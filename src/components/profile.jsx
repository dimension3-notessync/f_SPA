import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {requestProfileAccess, logoutRequest, userProfileRequest} from '../services/api'; // Use fetchDashboardSpecificData
import { useNotification } from '../context/NotificationContext';

const Profile = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [profileInfo, setProfileInfo] = useState(null); // To store actual data
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // This call to fetchDashboardSpecificData (11302/dashboard/data) implicitly checks the auth cookie
                // The backend's 11302 service must be configured to check the cookie and return JSON.
                const data = await requestProfileAccess();
            } catch (error) {
                // If fetchDashboardSpecificData fails (e.g., 401 from dashboard service), redirect to login
                showNotification(error.message, 'error'); // Display the specific error
                navigate('/login', {
                    replace: true,
                    state: { message: 'Your session has expired or is invalid. Please log in again.' }
                });
            }
            try {
                const data = await userProfileRequest()
                setProfileInfo(data); // Store the data
                setIsLoading(false);
            } catch (error) {
                showNotification(error.message, 'error');
            }
        };
        fetchData();
    }, [navigate, showNotification]);

    const handleLogout = async () => {
        try {
            await logoutRequest(); // Backend clears cookie via 11301/auth/logout
            showNotification('You have been logged out successfully.', 'info');
            navigate('/login', { replace: true });
        } catch (error) {
            showNotification(error.message, 'error');
            // Even if logout fails on backend, we typically redirect to login on frontend
            navigate('/login', { replace: true, state: { message: 'Logout failed, please try again.' } });
        }
    };

    if (isLoading) {
        return <p>Loading profile...</p>;
    }

    return (
        <div>
            <h2>Profile</h2>
            <p>Welcome! You are securely logged in using cookies.</p>
            {profileInfo && Object.keys(profileInfo).length > 0 ? (
                <div>
                    <h3>Profile Data:</h3>
                    {/* Render your dashboard data here. For now, just display JSON. */}
                    <pre>{JSON.stringify(profileInfo, null, 2)}</pre>
                </div>
            ) : (
                <p>No profile data available.</p>
            )}
            <button onClick={handleLogout}>Log Out</button>
        </div>
    );
};

export default Profile;
