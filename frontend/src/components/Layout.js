import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import RealTimeNotification from './RealTimeNotification';
import '../styles/Layout.css';

function Layout({ user, onLogout }) {
    return (
        <div className="layout">
            <nav className="navbar">
                <div className="nav-brand">
                    <span className="brand-icon">🛡️</span>
                    <span>Crisis Management</span>
                    <span className="realtime-badge" title="Real-time updates enabled">🔴 LIVE</span>
                </div>
                <div className="nav-user">
                    <span className="user-name">{user?.username}</span>
                    <button onClick={onLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="main-layout">
                <aside className="sidebar">
                    <ul className="sidebar-menu">
                        <li>
                            <NavLink to="/dashboard" className="menu-item">
                                <span className="menu-icon">📊</span>
                                <span>Dashboard</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/alerts" className="menu-item">
                                <span className="menu-icon">⚠️</span>
                                <span>Alerts</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/incidents" className="menu-item">
                                <span className="menu-icon">🔥</span>
                                <span>Incidents</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/contacts" className="menu-item">
                                <span className="menu-icon">📞</span>
                                <span>Emergency Contacts</span>
                            </NavLink>
                        </li>
                    </ul>
                </aside>

                <main className="content">
                    <Outlet />
                </main>
            </div>

            {/* Real-time notification component */}
            <RealTimeNotification />
        </div>
    );
}

export default Layout;
