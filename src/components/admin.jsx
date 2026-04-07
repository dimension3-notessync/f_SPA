import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Import updateUserPermission
import { requestAdminAccess, userListRequest, updateUserPermission } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../css/Admin.css';
import '../css/Dashboard.css';

const Admin = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userList, setUserList] = useState([]);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('users');

    // New states for permission editing
    const [editingUserId, setEditingUserId] = useState(null); // Keep this for identifying the row being edited in UI
    const [selectedPermissionLevel, setSelectedPermissionLevel] = useState(null);
    const [isSubmittingPermissionChange, setIsSubmittingPermissionChange] = useState(false);

    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                await requestAdminAccess();

                if (activeTab === 'users') {
                    const data = await userListRequest();
                    setUserList(data.users || []);
                }
            } catch (err) {
                console.error("Failed to fetch admin data:", err);
                if (err.status === 401 || err.status === 403) {
                    showNotification(err.message || 'You do not have administrative access. Redirecting.', 'error');
                    navigate('/dashboard', {
                        replace: true,
                        state: { message: 'You do not have administrative access.' }
                    });
                } else {
                    setError(err.message || "Failed to load admin data.");
                    showNotification(err.message || "Failed to load admin data.", 'error');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, showNotification, activeTab]);

    const getPermissionBadgeClass = (level) => {
        switch (level) {
            case 1: return 'permission-badge level-1'; // Viewer
            case 2: return 'permission-badge level-2'; // Student
            case 3: return 'permission-badge level-3'; // Admin
            default: return 'permission-badge level-0'; // Default for unknown/low level
        }
    };

    // Helper to get a human-readable label for permission levels
    const getPermissionLabel = (level) => {
        switch (level) {
            case 1: return 'Viewer';
            case 2: return 'Student';
            case 3: return 'Admin';
            default: return 'Unknown';
        }
    };


    // Handlers for permission editing
    const handleStartEditPermission = (userId, currentPermission) => {
        setEditingUserId(userId);
        setSelectedPermissionLevel(currentPermission);
    };

    const handleCancelEditPermission = () => {
        setEditingUserId(null);
        setSelectedPermissionLevel(null);
    };

    const handleSavePermission = async (userId, currentUsername) => { // userId is used to update local state, currentUsername for API call
        if (selectedPermissionLevel === null) return;

        // Prevent changing to the same permission level
        const currentUser = userList.find(u => u.id === userId);
        if (currentUser && currentUser.permissionLevel === selectedPermissionLevel) {
            showNotification('Permission level is already the same.', 'info');
            handleCancelEditPermission();
            return;
        }

        setIsSubmittingPermissionChange(true);
        try {
            // Send API request with username, not userId, as per backend expectation
            await updateUserPermission(currentUsername, selectedPermissionLevel);
            showNotification(`Permission for ${currentUsername} updated to ${getPermissionLabel(selectedPermissionLevel)}.`, 'success');

            // Update local state to reflect the change
            setUserList(prevList =>
                prevList.map(user =>
                    user.id === userId ? { ...user, permissionLevel: selectedPermissionLevel } : user
                )
            );
            handleCancelEditPermission(); // Exit editing mode
        } catch (err) {
            console.error("Failed to update user permission:", err);
            showNotification(err.message || 'Failed to update user permission.', 'error');
        } finally {
            setIsSubmittingPermissionChange(false);
        }
    };


    if (isLoading) {
        return <p>Loading admin page...</p>;
    }

    return (
        <div className="dashboard-content admin-page-content">
            <div className="admin-page-header-wrapper">
                <h1>Admin Panel</h1>
                <p>Manage users and oversee system operations.</p>
            </div>

            <nav className="admin-tab-nav">
                <button
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                >
                    User List
                </button>
                <button
                    className={activeTab === 'auditLog' ? 'active' : ''}
                    onClick={() => setActiveTab('auditLog')}
                >
                    Audit Log
                </button>
            </nav>

            {activeTab === 'users' && (
                <section className="card admin-user-list-card">
                    <div className="card-header">
                        <h2>All System Users</h2> {/* This heading is now centered via CSS */}
                    </div>
                    <div className="card-body">
                        {error ? (
                            <p className="error-message">{error}</p>
                        ) : userList.length > 0 ? (
                            <div className="user-table-container">
                                <table className="admin-user-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Permission Level</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {userList.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                    <span className={getPermissionBadgeClass(user.permissionLevel)}>
                                                        {getPermissionLabel(user.permissionLevel)}
                                                    </span>
                                            </td>
                                            <td className="action-cell">
                                                {editingUserId === user.id ? (
                                                    <>
                                                        <select
                                                            className="permission-select"
                                                            value={selectedPermissionLevel || ''}
                                                            onChange={(e) => setSelectedPermissionLevel(Number(e.target.value))}
                                                            disabled={isSubmittingPermissionChange}
                                                        >
                                                            <option value={1}>{getPermissionLabel(1)}</option>
                                                            <option value={2}>{getPermissionLabel(2)}</option>
                                                            <option value={3}>{getPermissionLabel(3)}</option>
                                                        </select>
                                                        <button
                                                            className="action-button save-button"
                                                            onClick={() => handleSavePermission(user.id, user.username)} // Pass user.username
                                                            disabled={isSubmittingPermissionChange}
                                                        >
                                                            {isSubmittingPermissionChange ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button
                                                            className="action-button cancel-button"
                                                            onClick={handleCancelEditPermission}
                                                            disabled={isSubmittingPermissionChange}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="action-button edit-permission"
                                                        onClick={() => handleStartEditPermission(user.id, user.permissionLevel)}
                                                        disabled={isSubmittingPermissionChange}
                                                    >
                                                        Change Permission
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="no-data-message">No user data available.</p>
                        )}
                    </div>
                </section>
            )}

            {activeTab === 'auditLog' && (
                <section className="card admin-audit-log-card">
                    <div className="card-header">
                        <h2>System Audit Log</h2> {/* This heading is now centered via CSS */}
                    </div>
                    <div className="card-body">
                        <p className="no-data-message">Audit log data will appear here. (Coming Soon!)</p>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Admin;
