// src/components/LecturesSection.jsx
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    getUpcomingLectures,
    requestAdminAccess,
    editLectureRequest,
    subscribeToLecture
} from '../services/api';
import { useNotification } from '../context/NotificationContext';

const LecturesSection = () => {
    const [lectures, setLectures] = useState([]);
    const [lecturesError, setLecturesError] = useState(null);
    const [lectureCount, setLectureCount] = useState(5);

    // State for Lecture Editing
    const [editingLectureId, setEditingLectureId] = useState(null);
    const [editableLectureData, setEditableLectureData] = useState({});
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
    const [isSavingLecture, setIsSavingLecture] = useState(false);

    // State for Global Calendar Subscription
    const [isSubscribing, setIsSubscribing] = useState(false);

    const { showNotification } = useNotification();
    const isInitialMount = useRef(true); // For preventing double fetch on initial mount

    // --- Helper for Date Conversion (Unix timestamp to datetime-local string) ---
    const formatUnixToDatetimeLocal = (unixTimestamp) => {
        if (!unixTimestamp) return '';
        const normalizedTimestamp = unixTimestamp < 10000000000
            ? unixTimestamp * 1000
            : unixTimestamp;
        const date = new Date(normalizedTimestamp);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const normalizedTimestamp = timestamp < 10000000000
            ? timestamp * 1000
            : timestamp;
        const date = new Date(normalizedTimestamp);
        const datePart = date.toLocaleDateString('en-GB');
        const timePart = date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        return `${datePart} ${timePart}`;
    };

    const fetchLectures = useCallback(async () => {
        setLecturesError(null);
        try {
            const data = await getUpcomingLectures(lectureCount);
            setLectures(data);
        } catch (err) {
            console.error("Failed to fetch upcoming lectures:", err);
            if (err.message !== "No upcoming lectures found.") {
                showNotification(err.message || "Failed to load upcoming lectures.", 'error');
            }
            setLecturesError(err.message || "Failed to load upcoming lectures.");
            setLectures([]);
        }
    }, [lectureCount, showNotification]);

    // --- Effect for Initial Data Load and subsequent lectureCount changes ---
    useEffect(() => {
        if (isInitialMount.current) {
            fetchLectures();
            isInitialMount.current = false;
        } else {
            fetchLectures();
        }
    }, [lectureCount, fetchLectures]);

    // --- Handlers for Lecture Editing ---
    const checkAdminAccessAndEdit = useCallback(async (lecture) => {
        setIsCheckingAdmin(true);
        try {
            await requestAdminAccess();
            setEditingLectureId(lecture.id);
            setEditableLectureData({
                ...lecture,
                date: formatUnixToDatetimeLocal(lecture.date),
                canceled: !lecture.start,
            });
        } catch (err) {
            console.error("Admin access check failed:", err);
            showNotification(err.message || 'You do not have permission to edit lectures.', 'error');
        } finally {
            setIsCheckingAdmin(false);
        }
    }, [showNotification]);

    const handleEditChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setEditableLectureData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    const handleEditSubmit = useCallback(async () => {
        if (!editingLectureId) return;

        setIsSavingLecture(true);
        try {
            const dateObj = new Date(editableLectureData.date);
            if (isNaN(dateObj.getTime())) {
                showNotification('Invalid Date/Time format. Please use the date picker.', 'error');
                return;
            }
            const unixTimestamp = dateObj.getTime();

            const payload = {
                lectureName: editableLectureData.lectureName,
                date: unixTimestamp,
                description: editableLectureData.description,
                lecturer: editableLectureData.lecturer,
                room: editableLectureData.room,
                start: !editableLectureData.canceled,
                online: editableLectureData.online,
                information: editableLectureData.information,
            };

            await editLectureRequest(editingLectureId, payload);
            showNotification('Lecture updated successfully!', 'success');
            setEditingLectureId(null);
            setEditableLectureData({});
            await fetchLectures();
        } catch (err) {
            console.error("Failed to update lecture:", err);
            showNotification(err.message || 'Failed to update lecture.', 'error');
        } finally {
            setIsSavingLecture(false);
        }
    }, [editingLectureId, editableLectureData, showNotification, fetchLectures]);

    const handleCancelEdit = useCallback(() => {
        setEditingLectureId(null);
        setEditableLectureData({});
    }, []);

    // --- NEW: Handle General Subscription ---
    const handleSubscribeCalendar = useCallback(async () => {
        setIsSubscribing(true);
        try {
            // Send 0 to subscribe to the general calendar
            const response = await subscribeToLecture(0);
            showNotification(response.message || 'Subscribed to lecture notifications successfully!', 'success');
        } catch (err) {
            console.error("Subscription failed:", err);
            showNotification(err.message || 'Failed to subscribe to lectures.', 'error');
        } finally {
            setIsSubscribing(false);
        }
    }, [showNotification]);

    return (
        <section className="card lectures-section">
            <div className="card-header">
                <h2>Upcoming Lectures</h2>

                {/* NEW: Grouped the Subscribe Button and the Show Select Dropdown */}
                <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                        className="btn-success"
                        onClick={handleSubscribeCalendar}
                        disabled={isSubscribing}
                        style={{ backgroundColor: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                    </button>

                    <div className="input-group">
                        <label htmlFor="lectureCount">Show:</label>
                        <select
                            id="lectureCount"
                            value={lectureCount}
                            onChange={(e) => setLectureCount(Number(e.target.value))}
                        >
                            <option value={3}>3</option>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                        <span>lectures</span>
                    </div>
                </div>
            </div>
            <div className="card-body">
                {lecturesError ? (
                    <p className="error-message">{lecturesError}</p>
                ) : lectures.length > 0 ? (
                    <div className="lecture-list">
                        {lectures.map((lecture, index) => (
                            <div key={lecture.id || index} className="lecture-item">
                                {editingLectureId === lecture.id ? (
                                    // --- Lecture Edit Form ---
                                    <div className="lecture-edit-form">
                                        <div className="form-group">
                                            <label htmlFor={`edit-lectureName-${lecture.id}`}>Lecture Name</label>
                                            <input
                                                type="text"
                                                id={`edit-lectureName-${lecture.id}`}
                                                name="lectureName"
                                                value={editableLectureData.lectureName || ''}
                                                onChange={handleEditChange}
                                                disabled={isSavingLecture}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor={`edit-date-${lecture.id}`}>Date and Time</label>
                                            <input
                                                type="datetime-local"
                                                id={`edit-date-${lecture.id}`}
                                                name="date"
                                                value={editableLectureData.date || ''}
                                                onChange={handleEditChange}
                                                disabled={isSavingLecture}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor={`edit-lecturer-${lecture.id}`}>Lecturer</label>
                                            <input
                                                type="text"
                                                id={`edit-lecturer-${lecture.id}`}
                                                name="lecturer"
                                                value={editableLectureData.lecturer || ''}
                                                onChange={handleEditChange}
                                                disabled={isSavingLecture}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor={`edit-room-${lecture.id}`}>Room</label>
                                            <input
                                                type="text"
                                                id={`edit-room-${lecture.id}`}
                                                name="room"
                                                value={editableLectureData.room || ''}
                                                onChange={handleEditChange}
                                                disabled={isSavingLecture}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor={`edit-description-${lecture.id}`}>Description</label>
                                            <textarea
                                                id={`edit-description-${lecture.id}`}
                                                name="description"
                                                value={editableLectureData.description || ''}
                                                onChange={handleEditChange}
                                                disabled={isSavingLecture}
                                            ></textarea>
                                        </div>
                                        <div className="checkbox-group">
                                            <input
                                                type="checkbox"
                                                id={`edit-canceled-${lecture.id}`}
                                                name="canceled"
                                                checked={editableLectureData.canceled || false}
                                                onChange={handleEditChange}
                                                disabled={isSavingLecture}
                                            />
                                            <label htmlFor={`edit-canceled-${lecture.id}`}>Canceled</label>
                                        </div>
                                        <div className="checkbox-group">
                                            <input
                                                type="checkbox"
                                                id={`edit-online-${lecture.id}`}
                                                name="online"
                                                checked={editableLectureData.online || false}
                                                onChange={handleEditChange}
                                                disabled={isSavingLecture}
                                            />
                                            <label htmlFor={`edit-online-${lecture.id}`}>Online Lecture</label>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor={`edit-information-${lecture.id}`}>Additional Information</label>
                                            <textarea
                                                id={`edit-information-${lecture.id}`}
                                                name="information"
                                                value={editableLectureData.information || ''}
                                                onChange={handleEditChange}
                                                disabled={isSavingLecture}
                                            ></textarea>
                                        </div>
                                        <div className="edit-actions">
                                            <button
                                                className="btn-primary"
                                                onClick={handleEditSubmit}
                                                disabled={isSavingLecture}
                                            >
                                                {isSavingLecture ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                onClick={handleCancelEdit}
                                                disabled={isSavingLecture}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // --- Lecture Display Mode ---
                                    <>
                                        <div className="lecture-meta">
                                            <span className={`badge ${lecture.online ? 'online' : 'in-person'}`}>
                                                {lecture.online ? 'Online' : 'In-Person'}
                                            </span>
                                            {!lecture.start && (
                                                <span className="badge canceled">Canceled</span>
                                            )}
                                            <button
                                                className="action-button edit-button"
                                                onClick={() => checkAdminAccessAndEdit(lecture)}
                                                disabled={isCheckingAdmin || !!editingLectureId}
                                            >
                                                {isCheckingAdmin ? 'Checking...' : 'Edit'}
                                            </button>
                                        </div>
                                        <h3>{lecture.lectureName}</h3>
                                        <p><strong>Lecturer:</strong> {lecture.lecturer}</p>
                                        <p><strong>Date:</strong> {formatDate(lecture.date)}</p>
                                        <p><strong>Room:</strong> {lecture.room}</p>
                                        <p><strong>Description:</strong> {lecture.description}</p>
                                        <p><strong>Additional Information:</strong> {lecture.information}</p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-data-message">No upcoming lectures scheduled.</p>
                )}
            </div>
        </section>
    );
};

export default LecturesSection;
