const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const db = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Lazy-init Razorpay only when keys are configured
let razorpay = null;
function getRazorpay() {
    if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const Razorpay = require('razorpay');
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return razorpay;
}

// Get donation stats (must be before /:id)
router.get('/stats/summary', auth, async (req, res) => {
    try {
        const [total] = await db.query('SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM donations WHERE status = "paid"');
        res.json({
            totalAmount: total[0].total,
            totalDonations: total[0].count
        });
    } catch (error) {
        console.error('Get donation stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Razorpay public key
router.get('/config', auth, (req, res) => {
    res.json({
        key_id: process.env.RAZORPAY_KEY_ID || '',
        configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    });
});

// Create donation order
router.post('/create-order', auth, async (req, res) => {
    try {
        const { amount, donor_name, donor_email, disaster_report_id, message, payment_method } = req.body;

        if (payment_method === 'upi') {
            // Handle UPI payment
            const upiId = process.env.UPI_ID || 'crisismanagement@upi';
            const upiName = process.env.UPI_NAME || 'Crisis Management';
            const reference = `DonUPI${Date.now()}`;

            // Generate UPI string and QR code
            const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tr=${reference}&tn=Donation&am=${amount}`;
            const qrCode = await QRCode.toDataURL(upiString);

            // Insert donation record with UPI details (status = 'created' - waiting for payment)
            const [result] = await db.query(
                'INSERT INTO donations (donor_name, donor_email, amount, disaster_report_id, message, payment_method, upi_reference, status) VALUES (?, ?, ?, ?, ?, ?, ?, "created")',
                [donor_name, donor_email, amount, disaster_report_id || null, message || null, 'upi', reference]
            );

            return res.json({
                success: true,
                upiDetails: {
                    upiId: upiId,
                    upiName: upiName,
                    amount: amount,
                    reference: reference,
                    qrCode: qrCode,
                    upiLink: upiString
                },
                donationId: result.insertId
            });
        } else {
            // Handle Razorpay payment (existing logic)
            const rz = getRazorpay();
            if (!rz) {
                // If Razorpay not configured, create a mock donation record
                const [result] = await db.query(
                    'INSERT INTO donations (donor_name, donor_email, amount, razorpay_order_id, disaster_report_id, message, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, "paid")',
                    [donor_name, donor_email, amount, 'mock_' + Date.now(), disaster_report_id || null, message || null, 'razorpay']
                );

                const io = req.app.get('io');
                io.emit('donation:received', { amount, donor_name, method: 'razorpay' });

                return res.json({
                    success: true,
                    mock: true,
                    message: 'Donation recorded (Razorpay not configured - test mode)',
                    donationId: result.insertId
                });
            }

            const options = {
                amount: Math.round(amount * 100), // paise
                currency: 'INR',
                receipt: `donation_${Date.now()}`
            };

            const order = await rz.orders.create(options);

            const [result] = await db.query(
                'INSERT INTO donations (donor_name, donor_email, amount, razorpay_order_id, disaster_report_id, message, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [donor_name, donor_email, amount, order.id, disaster_report_id || null, message || null, 'razorpay']
            );

            res.json({
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key_id: process.env.RAZORPAY_KEY_ID,
                donationId: result.insertId
            });
        }
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create donation order' });
    }
});

// Verify Razorpay payment
router.post('/verify', auth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            await db.query(
                'UPDATE donations SET razorpay_payment_id = ?, razorpay_signature = ?, status = "paid" WHERE razorpay_order_id = ?',
                [razorpay_payment_id, razorpay_signature, razorpay_order_id]
            );

            const io = req.app.get('io');
            io.emit('donation:received', { orderId: razorpay_order_id });

            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            await db.query(
                'UPDATE donations SET status = "failed" WHERE razorpay_order_id = ?',
                [razorpay_order_id]
            );
            res.status(400).json({ error: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// Verify UPI payment (for manual verification)
router.post('/verify-upi', auth, async (req, res) => {
    try {
        const { donationId, upiReference } = req.body;

        // Update the donation to mark as paid
        const [result] = await db.query(
            'UPDATE donations SET status = "paid" WHERE id = ? AND upi_reference = ? AND payment_method = "upi"',
            [donationId, upiReference]
        );

        if (result.affectedRows > 0) {
            // Get the donation details after update
            const [donation] = await db.query(
                'SELECT * FROM donations WHERE id = ?',
                [donationId]
            );

            if (donation && donation.length > 0) {
                const io = req.app.get('io');
                io.emit('donation:received', {
                    amount: donation[0].amount,
                    donor_name: donation[0].donor_name,
                    method: 'upi',
                    reference: donation[0].upi_reference
                });

                return res.json({
                    success: true,
                    status: 'paid',
                    message: '✅ UPI donation verified successfully',
                    donation: donation[0]
                });
            }
        }

        res.status(404).json({
            success: false,
            error: 'Donation not found or already verified'
        });
    } catch (error) {
        console.error('Verify UPI payment error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Get all donations
router.get('/', auth, async (req, res) => {
    try {
        const [donations] = await db.query(
            'SELECT d.*, dr.title as disaster_title FROM donations d LEFT JOIN disaster_reports dr ON d.disaster_report_id = dr.id ORDER BY d.created_at DESC'
        );
        res.json(donations);
    } catch (error) {
        console.error('Get donations error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
