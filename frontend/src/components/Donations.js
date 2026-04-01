import React, { useState, useEffect } from 'react';
import { donationsAPI, disastersAPI } from '../services/api';
import socket from '../services/socket';
import '../styles/Donations.css';

function Donations() {
    const [donations, setDonations] = useState([]);
    const [disasters, setDisasters] = useState([]);
    const [stats, setStats] = useState({ totalAmount: 0, totalDonations: 0 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        donor_name: '',
        donor_email: '',
        amount: '',
        disaster_report_id: '',
        message: '',
        payment_method: 'razorpay'
    });
    const [processing, setProcessing] = useState(false);
    const [upiDetails, setUpiDetails] = useState(null);
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [upiConfirming, setUpiConfirming] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchData();

        // Connect to socket and listen for real-time donation updates
        socket.connect();
        
        const socketInstance = socket.socket;
        if (socketInstance) {
            socketInstance.on('donation:received', (data) => {
                console.log('New donation received:', data);
                // Refresh donations list after a short delay
                setTimeout(() => {
                    fetchData();
                }, 500);
            });
        }

        return () => {
            if (socketInstance) {
                socketInstance.off('donation:received');
            }
        };
    }, []);

    const fetchData = async () => {
        try {
            const [donRes, statsRes, disRes] = await Promise.all([
                donationsAPI.getAll(),
                donationsAPI.getStats(),
                disastersAPI.getAll({ status: 'responding' })
            ]);
            setDonations(donRes.data);
            setStats(statsRes.data);
            setDisasters(disRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpiConfirm = async () => {
        if (!upiDetails) return;
        
        setUpiConfirming(true);
        try {
            await donationsAPI.verifyUpi({
                donationId: upiDetails.donationId,
                upiReference: upiDetails.reference
            });
            
            // Show success message
            setSuccessMessage(`✅ Payment Confirmed! Your donation of ${formatCurrency(upiDetails.amount)} has been recorded.`);
            
            // Close modal and form
            setShowUpiModal(false);
            setUpiDetails(null);
            setFormData(prev => ({ ...prev, donor_name: '', donor_email: '', amount: '', disaster_report_id: '', message: '', payment_method: 'razorpay' }));
            setShowForm(false);
            
            // Fetch and update donations list
            await fetchData();
            
            // Auto dismiss success message after 5 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 5000);
            
            // Scroll to donations list
            setTimeout(() => {
                document.querySelector('.donations-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        } catch (err) {
            console.error('UPI confirmation error:', err);
            setSuccessMessage('');
            alert('⚠️ Could not confirm payment. Please try again or contact support.');
        } finally {
            setUpiConfirming(false);
        }
    };

    const handleDonate = async (e) => {
        e.preventDefault();
        setProcessing(true);

        try {
            const res = await donationsAPI.createOrder({
                ...formData,
                amount: parseFloat(formData.amount)
            });

            if (formData.payment_method === 'upi') {
                // Handle UPI payment
                if (res.data.upiDetails) {
                    setUpiDetails({
                        ...res.data.upiDetails,
                        donationId: res.data.donationId
                    });
                    setShowUpiModal(true);
                    setFormData(prev => ({ ...prev, donor_name: '', donor_email: '', amount: '', disaster_report_id: '', message: '', payment_method: 'razorpay' }));
                    setShowForm(false);
                }
            } else if (res.data.mock) {
                // Test mode - no Razorpay configured
                alert('Donation recorded successfully! (Test Mode - Razorpay not configured)');
                setShowForm(false);
                setFormData(prev => ({ ...prev, donor_name: '', donor_email: '', amount: '', disaster_report_id: '', message: '', payment_method: 'razorpay' }));
                fetchData();
            } else if (res.data.orderId) {
                // Open Razorpay checkout
                const options = {
                    key: res.data.key_id,
                    amount: res.data.amount,
                    currency: res.data.currency,
                    name: 'Crisis Management System',
                    description: 'Disaster Relief Donation',
                    order_id: res.data.orderId,
                    handler: async function (response) {
                        try {
                            await donationsAPI.verify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });
                            alert('Donation successful! Thank you for your generosity.');
                            setShowForm(false);
                            setFormData(prev => ({ ...prev, donor_name: '', donor_email: '', amount: '', disaster_report_id: '', message: '', payment_method: 'razorpay' }));
                            fetchData();
                        } catch (err) {
                            alert('Payment verification failed.');
                        }
                    },
                    prefill: {
                        name: formData.donor_name,
                        email: formData.donor_email
                    },
                    theme: { color: '#e74c3c' }
                };

                if (window.Razorpay) {
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                } else {
                    alert('Razorpay SDK not loaded. Please refresh and try again.');
                }
            }
        } catch (err) {
            console.error('Donation error:', err);
            alert('Failed to process donation. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    if (loading) return <div className="loading">Loading donations...</div>;

    return (
        <div className="donations-page">
            <div className="content-header">
                <h2>💰 Donation Gateway</h2>
                <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Close Form' : '❤️ Donate Now'}
                </button>
            </div>

            {successMessage && (
                <div className="success-banner">
                    <div className="success-content">
                        {successMessage}
                    </div>
                    <button className="close-banner" onClick={() => setSuccessMessage('')}>✕</button>
                </div>
            )}

            <div className="donation-stats">
                <div className="donation-stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>{formatCurrency(stats.totalAmount)}</h3>
                        <p>Total Funds Raised</p>
                    </div>
                </div>
                <div className="donation-stat-card">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-content">
                        <h3>{stats.totalDonations}</h3>
                        <p>Total Donations</p>
                    </div>
                </div>
                <div className="donation-stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                        <h3>{disasters.length}</h3>
                        <p>Active Disaster Campaigns</p>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="donation-form-card">
                    <h3>Make a Donation</h3>
                    <p className="form-subtitle">Your contribution can save lives and help rebuild communities.</p>
                    <form onSubmit={handleDonate}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Your Name</label>
                                <input type="text" name="donor_name" value={formData.donor_name} onChange={handleChange} required placeholder="Enter your name" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="donor_email" value={formData.donor_email} onChange={handleChange} required placeholder="Enter your email" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Amount (INR)</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="1" placeholder="Enter amount" />
                                <div className="quick-amounts">
                                    {[100, 500, 1000, 5000].map(amt => (
                                        <button type="button" key={amt} className="quick-amount-btn" onClick={() => setFormData(prev => ({ ...prev, amount: amt.toString() }))}>
                                            ₹{amt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Donate To (Optional)</label>
                                <select name="disaster_report_id" value={formData.disaster_report_id} onChange={handleChange}>
                                    <option value="">General Fund</option>
                                    {disasters.map(d => (
                                        <option key={d.id} value={d.id}>{d.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Message (Optional)</label>
                            <textarea name="message" value={formData.message} onChange={handleChange} rows="2" placeholder="Leave a message of support..." />
                        </div>
                        <div className="form-group">
                            <label>Payment Method</label>
                            <div className="payment-methods">
                                <label className="payment-option">
                                    <input type="radio" name="payment_method" value="razorpay" checked={formData.payment_method === 'razorpay'} onChange={handleChange} />
                                    <span className="payment-option-label">💳 Card / Wallet (Razorpay)</span>
                                </label>
                                <label className="payment-option">
                                    <input type="radio" name="payment_method" value="upi" checked={formData.payment_method === 'upi'} onChange={handleChange} />
                                    <span className="payment-option-label">📱 UPI Payment</span>
                                </label>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success btn-block" disabled={processing}>
                            {processing ? 'Processing...' : `${formData.payment_method === 'upi' ? '📱 Pay via UPI' : '💳 Proceed to Payment'} ${formData.amount ? formatCurrency(formData.amount) : ''}`}
                        </button>
                    </form>
                </div>
            )}

            {showUpiModal && upiDetails && (
                <div className="upi-modal-overlay" onClick={() => setShowUpiModal(false)}>
                    <div className="upi-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="upi-close-btn" onClick={() => setShowUpiModal(false)}>✕</button>
                        <div className="upi-header">
                            <h3>📱 UPI Payment</h3>
                            <p>Pay using your preferred UPI app</p>
                        </div>
                        
                        <div className="upi-content">
                            <div className="amount-display">
                                <p className="amount-label">Amount to Pay</p>
                                <p className="amount-value">{formatCurrency(upiDetails.amount)}</p>
                            </div>

                            {upiDetails.qrCode && (
                                <div className="qr-section">
                                    <p className="section-title">📱 Scan QR Code</p>
                                    <img src={upiDetails.qrCode} alt="UPI QR Code" className="qr-code-img" />
                                    <p className="qr-hint">Use any UPI app (Google Pay, PhonePe, WhatsApp Pay, etc.) to scan this code</p>
                                </div>
                            )}

                            <div className="upi-id-section">
                                <p className="section-title">Or Pay Manually</p>
                                <div className="upi-id-display">
                                    <span className="upi-id">{upiDetails.upiId}</span>
                                    <button 
                                        className="copy-btn" 
                                        onClick={() => {
                                            navigator.clipboard.writeText(upiDetails.upiId);
                                            alert('📋 UPI ID copied to clipboard!');
                                        }}
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                                <p className="section-hint">Reference: <strong>{upiDetails.reference}</strong></p>
                            </div>

                            <div className="upi-instructions">
                                <h4>💡 How to Complete Payment</h4>
                                <ol>
                                    <li><strong>Option 1:</strong> Scan the QR code with your UPI app</li>
                                    <li><strong>Option 2:</strong> Copy the UPI ID and send {formatCurrency(upiDetails.amount)} to it</li>
                                    <li>Complete the payment in your UPI app</li>
                                    <li>Click "Confirm Payment" below after payment is complete</li>
                                </ol>
                            </div>

                            <div className="upi-actions">
                                <button 
                                    className="btn btn-success btn-block" 
                                    onClick={handleUpiConfirm}
                                    disabled={upiConfirming}
                                >
                                    {upiConfirming ? '⏳ Confirming Payment...' : '✅ Confirm Payment'}
                                </button>
                                <button 
                                    className="btn btn-secondary btn-block" 
                                    onClick={() => {
                                        setShowUpiModal(false);
                                        setUpiDetails(null);
                                    }}
                                    disabled={upiConfirming}
                                >
                                    Cancel
                                </button>
                            </div>

                            <p className="upi-footer">Your donation reference: <strong>{upiDetails.reference}</strong></p>
                        </div>
                    </div>
                </div>
            )}

            <div className="donations-list">
                <h3>Recent Donations</h3>
                {donations.length === 0 ? (
                    <p className="no-data">No donations yet. Be the first to contribute!</p>
                ) : (
                    <div className="donations-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Donor</th>
                                    <th>Amount</th>
                                    <th>Campaign</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donations.map((donation, index) => (
                                    <tr key={donation.id} className={index === 0 && donations.length > 0 ? 'newly-added' : ''}>
                                        <td>
                                            <div className="donor-info">
                                                <span className="donor-avatar">{donation.donor_name.charAt(0)}</span>
                                                <div>
                                                    <strong>{donation.donor_name}</strong>
                                                    {donation.message && <p className="donor-message">{donation.message}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="amount-cell">{formatCurrency(donation.amount)}</td>
                                        <td>{donation.disaster_title || 'General Fund'}</td>
                                        <td><span className={`donation-status ${donation.status}`}>{donation.status}</span></td>
                                        <td>{new Date(donation.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Donations;
