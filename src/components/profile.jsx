import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Import changePasswordRequest along with others
import { requestProfileAccess, userProfileRequest, changePasswordRequest } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../css/Profile.css';

const Profile = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [profileInfo, setProfileInfo] = useState(null);
    const [error, setError] = useState(null);

    // State for password change form
    const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isSubmittingPasswordChange, setIsSubmittingPasswordChange] = useState(false);

    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                await requestProfileAccess();
                const data = await userProfileRequest();
                setProfileInfo(data);
            } catch (err) {
                console.error("Failed to fetch profile data:", err);
                if (err.status === 401 || err.status === 403) {
                    showNotification(err.message || 'Your session has expired or is invalid. Please log in again.', 'error');
                    navigate('/login', {
                        replace: true,
                        state: { message: 'Your session has expired or is invalid. Please log in again.' }
                    });
                } else {
                    setError(err.message || "Failed to load user profile information.");
                    showNotification(err.message || "Failed to load user profile information.", 'error');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, showNotification]);

    // Function to toggle the password change form visibility
    const toggleChangePasswordForm = () => {
        setShowChangePasswordForm(prev => !prev);
        // Clear password fields when closing the form
        if (showChangePasswordForm) {
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        }
    };

    // Handler for password change form submission
    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        if (isSubmittingPasswordChange) return;

        if (newPassword !== confirmNewPassword) {
            showNotification('New passwords do not match.', 'error');
            return;
        }

        if (!oldPassword || !newPassword || newPassword.length < 12) { // Basic validation
            showNotification('Please enter valid old and new passwords (new password minimum 12 characters).', 'error');
            return;
        }

        setIsSubmittingPasswordChange(true);
        try {
            await changePasswordRequest(oldPassword, newPassword);
            showNotification('Password changed successfully!', 'success');
            toggleChangePasswordForm(); // Close form on successful submission
        } catch (err) {
            showNotification(err.message || 'Failed to change password.', 'error');
        } finally {
            setIsSubmittingPasswordChange(false);
        }
    };

    if (isLoading) {
        return <p>Loading profile...</p>;
    }

    return (
        <div className="dashboard-content profile-page-content">
            <div className="profile-page-header-wrapper">
                <h1>User Profile</h1>
                <p>Manage your account settings and view your details.</p>
            </div>

            <section className="card profile-card">
                <div className="card-header">
                    <h2>Your Information</h2>
                </div>
                <div className="card-body">
                    {error ? (
                        <p className="error-message">{error}</p>
                    ) : profileInfo && Object.keys(profileInfo).length > 0 ? (
                        <div className="profile-details">
                            <div className="profile-detail-item">
                                <span className="profile-detail-label">Username:</span>
                                <span className="profile-detail-value">{profileInfo.username}</span>
                            </div>
                            <div className="profile-detail-item">
                                <span className="profile-detail-label">Email:</span>
                                <span className="profile-detail-value">{profileInfo.email}</span>
                            </div>
                            <div className="profile-detail-item">
                                <span className="profile-detail-label">Permission Level:</span>
                                <span className="profile-detail-value">{profileInfo.permissionLevel}</span>
                            </div>
                            <div className="profile-detail-item">
                                <span className="profile-detail-label">Lectures Subscription:</span>
                                <span className="profile-detail-value">
                                    {profileInfo.lecturesSubscription ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            {profileInfo.subscribedAuthors && profileInfo.subscribedAuthors.length > 0 && (
                                <div className="profile-detail-item">
                                    <span className="profile-detail-label">Subscribed Authors:</span>
                                    <div className="subscribed-authors-list">
                                        {profileInfo.subscribedAuthors.map((author, index) => (
                                            <span key={index} className="subscribed-author-badge">
                                                {author.username}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="no-data-message">No profile data available.</p>
                    )}

                    {/* Change Password Button */}
                    <button onClick={toggleChangePasswordForm} className="change-password-btn">
                        {showChangePasswordForm ? 'Cancel Change' : 'Change Password'}
                    </button>

                    {/* Conditional rendering for the Change Password Form */}
                    {showChangePasswordForm && (
                        <form onSubmit={handleChangePasswordSubmit} className="change-password-form">
                            <h3>Change Your Password</h3>
                            <div className="input-group">
                                <label htmlFor="oldPassword">Old Password</label>
                                <input
                                    type="password"
                                    id="oldPassword"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength="6"
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                                <input
                                    type="password"
                                    id="confirmNewPassword"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    required
                                    minLength="6"
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={isSubmittingPasswordChange}>
                                {isSubmittingPasswordChange ? 'Changing...' : 'Submit Change'}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Profile;
