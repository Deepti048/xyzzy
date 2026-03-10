import React, { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';
import socketService from '../services/socket';
import '../styles/Dashboard.css';

function Dashboard() {
    const [stats, setStats] = useState({
        critical: 0,
        warning: 0,
        total: 0,
        resolvedToday: 0,
    });
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();

        // Setup real-time listeners
        socketService.onAlertCreated((newAlert) => {
            console.log('🔔 New alert received:', newAlert);
            setRecentAlerts((prev) => [newAlert, ...prev].slice(0, 5));
            fetchDashboardData(); // Refresh stats
        });

        socketService.onAlertUpdated((updatedAlert) => {
            console.log('🔄 Alert updated:', updatedAlert);
            setRecentAlerts((prev) =>
                prev.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert))
            );
            fetchDashboardData(); // Refresh stats
        });

        socketService.onAlertDeleted(({ id }) => {
            console.log('🗑️ Alert deleted:', id);
            setRecentAlerts((prev) => prev.filter((alert) => alert.id !== id));
            fetchDashboardData(); // Refresh stats
        });

        // Cleanup listeners
        return () => {
            socketService.offAlertEvents();
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, alertsRes] = await Promise.all([
                alertsAPI.getStats(),
                alertsAPI.getAll({ status: 'active' }),
            ]);
            setStats(statsRes.data);
            setRecentAlerts(alertsRes.data.slice(0, 5));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <div className="content-header">
                <h2>Dashboard Overview</h2>
            </div>

            <div className="stats-grid">
                <div className="stat-card critical">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <h3>{stats.critical}</h3>
                        <p>Critical Alerts</p>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-content">
                        <h3>{stats.warning}</h3>
                        <p>Warnings</p>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon">📌</div>
                    <div className="stat-content">
                        <h3>{stats.total}</h3>
                        <p>Active Alerts</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{stats.resolvedToday}</h3>
                        <p>Resolved Today</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Recent Alerts</h3>
                </div>
                <div className="card-body">
                    {recentAlerts.length === 0 ? (
                        <p className="no-data">No recent alerts</p>
                    ) : (
                        <div className="alerts-list">
                            {recentAlerts.map((alert) => (
                                <div key={alert.id} className={`alert-item ${alert.type}`}>
                                    <div className="alert-content">
                                        <h4>{alert.title}</h4>
                                        <p>{alert.description}</p>
                                        <div className="alert-meta">
                                            <span>📍 {alert.location}</span>
                                            <span>🕐 {formatTime(alert.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
