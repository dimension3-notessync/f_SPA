// src/components/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestDashboardAccess } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import LecturesSection from './LecturesSection'; // Import the new component
import FilesSection from './FilesSection';     // Import the new component
import '../css/Dashboard.css';

const Dashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    // --- Effect for Initial Auth and Data Load ---
    useEffect(() => {
        const initialLoad = async () => {
            setIsLoading(true);
            try {
                await requestDashboardAccess();
                // Sub-components will handle their own initial data fetching
            } catch (authError) {
                showNotification(authError.message || 'Session invalid.', 'error');
                navigate('/login', { replace: true });
            } finally {
                setIsLoading(false);
            }
        };
        initialLoad();
    }, [navigate, showNotification]);

    if (isLoading) {
        return <p>Loading dashboard...</p>;
    }

    return (
        <div className="dashboard-content">
            <header className="page-header">
                <h1>Dashboard</h1>
                <p>Welcome! Here's an overview of your upcoming lectures and uploaded files.</p>
            </header>

            <div className="dashboard-grid">
                <LecturesSection /> {/* Render the LecturesSection component */}
                <FilesSection />    {/* Render the FilesSection component */}
            </div>
        </div>
    );
};

export default Dashboard;
