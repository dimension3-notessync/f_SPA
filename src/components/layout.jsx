import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { logoutRequest } from '../services/api';
import { useNotification } from '../context/NotificationContext.jsx';
import '../css/Layout.css'; // Add your styling here

const Layout = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const handleLogout = async () => {
        try {
            await logoutRequest();
            showNotification('Logged out successfully.', 'info');
            navigate('/login', { replace: true });
        } catch (error) {
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="layout-container">
            <nav className="sidebar">
                <h2>NoteSync</h2>
                {/* Moved the Logout button here, right after the title */}
                <button className="logout-btn" onClick={handleLogout}>Log Out</button>
                <ul>
                    <li><Link to="/dashboard">Dashboard</Link></li>
                    <li><Link to="/me">Profile</Link></li>
                    <li><Link to="/admin">Admin</Link></li>
                </ul>
            </nav>
            <main className="main-content">
                {/* Outlet renders the matched child route (Dashboard, Admin, or Profile) */}
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
