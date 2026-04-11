import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    requestAdminAccess,
    userListRequest,
    updateUserPermission,
    addLectureRequest,
    systemHealthRequest // Ensure this is exported in your api.js
} from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../css/Admin.css';
import '../css/Dashboard.css'; // For general card and page-header styles

const Admin = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userList, setUserList] = useState([]);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('users');

    // States for System Health
    const [healthData, setHealthData] = useState(null);
    const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);

    // States for permission editing
    const [editingUserId, setEditingUserId] = useState(null);
    const [selectedPermissionLevel, setSelectedPermissionLevel] = useState(null);
    const [isSubmittingPermissionChange, setIsSubmittingPermissionChange] = useState(false);

    // States for Add Lecture form
    const [newLecture, setNewLecture] = useState({
        lectureName: '',
        date: '',
        description: '',
        lecturer: '',
        room: '',
        canceled: false,
        online: false,
        information: ''
    });
    const [isSubmittingNewLecture, setIsSubmittingNewLecture] = useState(false);

    const navigate = useNavigate();
    const { showNotification } = useNotification();

    // --- Helper: Format Uptime ---
    const formatUptime = (ms) => {
        if (!ms && ms !== 0) return 'N/A';
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
        return parts.join(' ');
    };

    // --- Fetch Logic ---
    const fetchHealthStatus = useCallback(async () => {
        setIsRefreshingHealth(true);
        try {
            const data = await systemHealthRequest();
            setHealthData(data);
        } catch (err) {
            console.error("Failed to fetch health status:", err);
            showNotification('Failed to fetch system health status.', 'error');
        } finally {
            setIsRefreshingHealth(false);
        }
    }, [showNotification]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                await requestAdminAccess();

                if (activeTab === 'users') {
                    const data = await userListRequest();
                    setUserList(data.users || []);
                } else if (activeTab === 'health') {
                    await fetchHealthStatus();
                }
            } catch (err) {
                console.error("Failed to fetch admin data:", err);
                if (err.status === 401 || err.status === 403) {
                    showNotification(err.message || 'You do not have administrative access. Redirecting.', 'error');
                    navigate('/dashboard', { replace: true });
                } else {
                    setError(err.message || "Failed to load admin data.");
                    showNotification(err.message || "Failed to load admin data.", 'error');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, showNotification, activeTab, fetchHealthStatus]);

    // --- Handlers: Permissions ---
    const getPermissionBadgeClass = (level) => {
        switch (level) {
            case 1: return 'permission-badge level-1';
            case 2: return 'permission-badge level-2';
            case 3: return 'permission-badge level-3';
            default: return 'permission-badge level-0';
        }
    };

    const getPermissionLabel = (level) => {
        switch (level) {
            case 1: return 'Viewer';
            case 2: return 'Student';
            case 3: return 'Admin';
            default: return 'Unknown';
        }
    };

    const handleStartEditPermission = (userId, currentPermission) => {
        setEditingUserId(userId);
        setSelectedPermissionLevel(currentPermission);
    };

    const handleCancelEditPermission = () => {
        setEditingUserId(null);
        setSelectedPermissionLevel(null);
    };

    const handleSavePermission = async (userId, currentUsername) => {
        if (selectedPermissionLevel === null) return;
        setIsSubmittingPermissionChange(true);
        try {
            await updateUserPermission(currentUsername, selectedPermissionLevel);
            showNotification(`Permission updated for ${currentUsername}.`, 'success');
            setUserList(prev => prev.map(u => u.id === userId ? { ...u, permissionLevel: selectedPermissionLevel } : u));
            handleCancelEditPermission();
        } catch (err) {
            showNotification(err.message || 'Failed to update permission.', 'error');
        } finally {
            setIsSubmittingPermissionChange(false);
        }
    };

    // --- Handlers: Add Lecture ---
    const handleNewLectureChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewLecture(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAddLectureSubmit = async (e) => {
        e.preventDefault();
        if (isSubmittingNewLecture) return;
        if (!newLecture.lectureName || !newLecture.date) {
            showNotification('Lecture Name and Date are mandatory.', 'error');
            return;
        }
        setIsSubmittingNewLecture(true);
        try {
            const unixTimestamp = new Date(newLecture.date).getTime();
            const payload = {
                lectureName: newLecture.lectureName,
                date: unixTimestamp,
                start: !newLecture.canceled,
                description: newLecture.description,
                lecturer: newLecture.lecturer,
                room: newLecture.room,
                online: newLecture.online,
                information: newLecture.information,
            };
            const response = await addLectureRequest(payload);
            showNotification(response.message || 'Lecture added successfully!', 'success');
            setNewLecture({ lectureName: '', date: '', description: '', lecturer: '', room: '', canceled: false, online: false, information: '' });
        } catch (err) {
            showNotification(err.message || 'Failed to add lecture.', 'error');
        } finally {
            setIsSubmittingNewLecture(false);
        }
    };

    if (isLoading && !healthData && userList.length === 0) {
        return <p>Loading admin page...</p>;
    }

    return (
        <div className="dashboard-content admin-page-content">
            <div className="admin-page-header-wrapper">
                <h1>Admin Panel</h1>
                <p>Manage users and oversee system operations.</p>
            </div>

            <nav className="admin-tab-nav">
                <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>User List</button>
                <button className={activeTab === 'health' ? 'active' : ''} onClick={() => setActiveTab('health')}>System Health</button>
                <button className={activeTab === 'auditLog' ? 'active' : ''} onClick={() => setActiveTab('auditLog')}>Audit Log</button>
                <button className={activeTab === 'addLecture' ? 'active' : ''} onClick={() => setActiveTab('addLecture')}>Add Lecture</button>
            </nav>

            {/* --- Tab: User List --- */}
            {activeTab === 'users' && (
                <section className="card admin-user-list-card">
                    <div className="card-header"><h2>All System Users</h2></div>
                    <div className="card-body">
                        {error ? <p className="error-message">{error}</p> : userList.length > 0 ? (
                            <div className="user-table-container">
                                <table className="admin-user-table">
                                    <thead>
                                    <tr><th>ID</th><th>Username</th><th>Email</th><th>Permission</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                    {userList.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td><td>{user.username}</td><td>{user.email}</td>
                                            <td><span className={getPermissionBadgeClass(user.permissionLevel)}>{getPermissionLabel(user.permissionLevel)}</span></td>
                                            <td className="action-cell">
                                                {editingUserId === user.id ? (
                                                    <><select className="permission-select" value={selectedPermissionLevel || ''} onChange={(e) => setSelectedPermissionLevel(Number(e.target.value))}>
                                                        <option value={1}>Viewer</option><option value={2}>Student</option><option value={3}>Admin</option>
                                                    </select>
                                                        <button className="action-button save-button" onClick={() => handleSavePermission(user.id, user.username)} disabled={isSubmittingPermissionChange}>Save</button>
                                                        <button className="action-button cancel-button" onClick={handleCancelEditPermission}>Cancel</button></>
                                                ) : (
                                                    <button className="action-button edit-permission" onClick={() => handleStartEditPermission(user.id, user.permissionLevel)}>Change Permission</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="no-data-message">No user data available.</p>}
                    </div>
                </section>
            )}

            {/* --- Tab: System Health --- */}
            {activeTab === 'health' && (
                <section className="card system-health-card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>Component Status</h2>
                        <button className="btn-primary" onClick={fetchHealthStatus} disabled={isRefreshingHealth} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                            {isRefreshingHealth ? 'Refreshing...' : 'Refresh Status'}
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="user-table-container">
                            <table className="admin-user-table">
                                <thead>
                                <tr><th>Component</th><th>Status</th><th>Uptime</th><th>Message</th></tr>
                                </thead>
                                <tbody>
                                {healthData ? Object.entries(healthData).map(([name, data]) => (
                                    <tr key={name}>
                                        <td style={{ fontWeight: 'bold' }}>{name}</td>
                                        <td>
                                                <span className={`badge ${data.status === 'healthy' ? 'online' : 'canceled'}`}>
                                                    {data.status.toUpperCase()}
                                                </span>
                                        </td>
                                        <td style={{ fontFamily: 'monospace' }}>{formatUptime(data.uptime)}</td>
                                        <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>{data.message}</td>
                                    </tr>
                                )) : <tr><td colSpan="4" className="no-data-message">Loading health data...</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {/* --- Tab: Audit Log --- */}
            {activeTab === 'auditLog' && (
                <section className="card admin-audit-log-card">
                    <div className="card-header"><h2>System Audit Log</h2></div>
                    <div className="card-body"><p className="no-data-message">Audit log data will appear here. (Coming Soon!)</p></div>
                </section>
            )}

            {/* --- Tab: Add Lecture --- */}
            {activeTab === 'addLecture' && (
                <section className="card add-lecture-form-card">
                    <div className="card-header"><h2>Add New Lecture</h2></div>
                    <div className="card-body">
                        <form onSubmit={handleAddLectureSubmit} className="add-lecture-form">
                            <div className="form-group"><label>Lecture Name *</label><input type="text" name="lectureName" value={newLecture.lectureName} onChange={handleNewLectureChange} required /></div>
                            <div className="form-group"><label>Date and Time *</label><input type="datetime-local" name="date" value={newLecture.date} onChange={handleNewLectureChange} required /></div>
                            <div className="form-group"><label>Description</label><textarea name="description" value={newLecture.description} onChange={handleNewLectureChange}></textarea></div>
                            <div className="form-group"><label>Lecturer</label><input type="text" name="lecturer" value={newLecture.lecturer} onChange={handleNewLectureChange} /></div>
                            <div className="form-group"><label>Room</label><input type="text" name="room" value={newLecture.room} onChange={handleNewLectureChange} /></div>
                            <div className="checkbox-group"><input type="checkbox" id="canceled" name="canceled" checked={newLecture.canceled} onChange={handleNewLectureChange} /><label htmlFor="canceled">Canceled</label></div>
                            <div className="checkbox-group"><input type="checkbox" id="online" name="online" checked={newLecture.online} onChange={handleNewLectureChange} /><label htmlFor="online">Online Lecture</label></div>
                            <div className="form-group"><label>Additional Info</label><textarea name="information" value={newLecture.information} onChange={handleNewLectureChange}></textarea></div>
                            <button type="submit" className="submit-btn" disabled={isSubmittingNewLecture}>{isSubmittingNewLecture ? 'Adding...' : 'Add Lecture'}</button>
                        </form>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Admin;
