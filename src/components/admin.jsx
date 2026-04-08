import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestAdminAccess, userListRequest, updateUserPermission, addLectureRequest } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../css/Admin.css';
import '../css/Dashboard.css'; // For general card and page-header styles

const Admin = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userList, setUserList] = useState([]);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('users');

    // States for permission editing
    const [editingUserId, setEditingUserId] = useState(null);
    const [selectedPermissionLevel, setSelectedPermissionLevel] = useState(null);
    const [isSubmittingPermissionChange, setIsSubmittingPermissionChange] = useState(false);

    // States for Add Lecture form
    const [newLecture, setNewLecture] = useState({
        lectureName: '',
        date: '', // Will store datetime-local string initially
        description: '',
        lecturer: '',
        room: '',
        // Changed 'start' to 'canceled'
        canceled: false, // Default: not canceled (meaning lecture will "start")
        online: false,
        information: ''
    });
    const [isSubmittingNewLecture, setIsSubmittingNewLecture] = useState(false);

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
                // No specific fetch needed for 'addLecture' tab on load
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
    }, [navigate, showNotification, activeTab]); // activeTab in dependencies to refetch userList if tab changes

    const getPermissionBadgeClass = (level) => {
        switch (level) {
            case 1: return 'permission-badge level-1'; // Viewer
            case 2: return 'permission-badge level-2'; // Student
            case 3: return 'permission-badge level-3'; // Admin
            default: return 'permission-badge level-0'; // Default for unknown/low level
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

    // Handlers for permission editing
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

        const currentUser = userList.find(u => u.id === userId);
        if (currentUser && currentUser.permissionLevel === selectedPermissionLevel) {
            showNotification('Permission level is already the same.', 'info');
            handleCancelEditPermission();
            return;
        }

        setIsSubmittingPermissionChange(true);
        try {
            await updateUserPermission(currentUsername, selectedPermissionLevel);
            showNotification(`Permission for ${currentUsername} updated to ${getPermissionLabel(selectedPermissionLevel)}.`, 'success');

            setUserList(prevList =>
                prevList.map(user =>
                    user.id === userId ? { ...user, permissionLevel: selectedPermissionLevel } : user
                )
            );
            handleCancelEditPermission();
        } catch (err) {
            console.error("Failed to update user permission:", err);
            showNotification(err.message || 'Failed to update user permission.', 'error');
        } finally {
            setIsSubmittingPermissionChange(false);
        }
    };

    // Handlers for Add Lecture Form
    const handleNewLectureChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewLecture(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddLectureSubmit = async (e) => {
        e.preventDefault();
        if (isSubmittingNewLecture) return;

        // Basic validation
        if (!newLecture.lectureName || !newLecture.date) {
            showNotification('Lecture Name and Date/Time are mandatory.', 'error');
            return;
        }

        setIsSubmittingNewLecture(true);
        try {
            // Convert datetime-local string to Unix timestamp (seconds)
            const dateObj = new Date(newLecture.date);
            if (isNaN(dateObj.getTime())) {
                showNotification('Invalid Date/Time format. Please use the date picker.', 'error');
                return;
            }
            const unixTimestamp = dateObj.getTime();

            // Construct payload:
            const payload = {
                lectureName: newLecture.lectureName,
                date: unixTimestamp,
                // If 'canceled' is true, send 'start: false'. If 'canceled' is false, send 'start: true'.
                start: !newLecture.canceled, // This handles the inversion logic
                ...(newLecture.description && { description: newLecture.description }),
                ...(newLecture.lecturer && { lecturer: newLecture.lecturer }),
                ...(newLecture.room && { room: newLecture.room }),
                ...(newLecture.online && { online: true }), // Only send true if checked
                ...(newLecture.information && { information: newLecture.information }),
            };

            const response = await addLectureRequest(payload);
            showNotification(response.message || 'Lecture added successfully!', 'success');

            // Clear form
            setNewLecture({
                lectureName: '',
                date: '',
                description: '',
                lecturer: '',
                room: '',
                canceled: false, // Reset to not canceled
                online: false,
                information: ''
            });
        } catch (err) {
            console.error("Failed to add lecture:", err);
            showNotification(err.message || 'Failed to add lecture.', 'error');
        } finally {
            setIsSubmittingNewLecture(false);
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
                <button
                    className={activeTab === 'addLecture' ? 'active' : ''}
                    onClick={() => setActiveTab('addLecture')}
                >
                    Add Lecture
                </button>
            </nav>

            {activeTab === 'users' && (
                <section className="card admin-user-list-card">
                    <div className="card-header">
                        <h2>All System Users</h2>
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
                                                            onClick={() => handleSavePermission(user.id, user.username)}
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
                        <h2>System Audit Log</h2>
                    </div>
                    <div className="card-body">
                        <p className="no-data-message">Audit log data will appear here. (Coming Soon!)</p>
                    </div>
                </section>
            )}

            {activeTab === 'addLecture' && (
                <section className="card add-lecture-form-card">
                    <div className="card-header">
                        <h2>Add New Lecture</h2>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleAddLectureSubmit} className="add-lecture-form">
                            <div className="form-group">
                                <label htmlFor="lectureName">Lecture Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    id="lectureName"
                                    name="lectureName"
                                    value={newLecture.lectureName}
                                    onChange={handleNewLectureChange}
                                    required
                                    disabled={isSubmittingNewLecture}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="date">Date and Time <span className="required">*</span></label>
                                <input
                                    type="datetime-local"
                                    id="date"
                                    name="date"
                                    value={newLecture.date}
                                    onChange={handleNewLectureChange}
                                    required
                                    disabled={isSubmittingNewLecture}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={newLecture.description}
                                    onChange={handleNewLectureChange}
                                    disabled={isSubmittingNewLecture}
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label htmlFor="lecturer">Lecturer</label>
                                <input
                                    type="text"
                                    id="lecturer"
                                    name="lecturer"
                                    value={newLecture.lecturer}
                                    onChange={handleNewLectureChange}
                                    disabled={isSubmittingNewLecture}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="room">Room</label>
                                <input
                                    type="text"
                                    id="room"
                                    name="room"
                                    value={newLecture.room}
                                    onChange={handleNewLectureChange}
                                    disabled={isSubmittingNewLecture}
                                />
                            </div>
                            {/* Changed 'start' to 'canceled' checkbox */}
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="canceled"
                                    name="canceled"
                                    checked={newLecture.canceled}
                                    onChange={handleNewLectureChange}
                                    disabled={isSubmittingNewLecture}
                                />
                                <label htmlFor="canceled">Canceled</label>
                            </div>
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="online"
                                    name="online"
                                    checked={newLecture.online}
                                    onChange={handleNewLectureChange}
                                    disabled={isSubmittingNewLecture}
                                />
                                <label htmlFor="online">Online Lecture</label>
                            </div>
                            <div className="form-group">
                                <label htmlFor="information">Additional Information</label>
                                <textarea
                                    id="information"
                                    name="information"
                                    value={newLecture.information}
                                    onChange={handleNewLectureChange}
                                    disabled={isSubmittingNewLecture}
                                ></textarea>
                            </div>
                            <button type="submit" className="submit-btn" disabled={isSubmittingNewLecture}>
                                {isSubmittingNewLecture ? 'Adding Lecture...' : 'Add Lecture'}
                            </button>
                        </form>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Admin;
