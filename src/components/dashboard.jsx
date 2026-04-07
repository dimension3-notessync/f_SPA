import React, {useCallback, useEffect, useMemo, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { requestDashboardAccess, getUpcomingLectures, getAllFiles } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../css/Dashboard.css';

const Dashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [lectures, setLectures] = useState([]);
    const [lecturesError, setLecturesError] = useState(null); // New state
    const [allFiles, setAllFiles] = useState([]);
    const [filesError, setFilesError] = useState(null);       // New state
    const [lectureCount, setLectureCount] = useState(5);
    const [fileFilters, setFileFilters] = useState({ lectureID: '', subject: '', authorID: '' });

    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp * 1000);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    useEffect(() => {
        const verifyAuthAndFetchData = async () => {
            setIsLoading(true);
            setLecturesError(null); // Clear previous errors on new fetch attempt
            setFilesError(null);   // Clear previous errors on new fetch attempt

            try {
                // --- Phase 1: Authentication Check (Critical) ---
                // If this fails, the user is NOT authenticated. Redirect to login.
                await requestDashboardAccess();

                // --- Phase 2: Fetch Lectures (Independent) ---
                const fetchLectures = async () => {
                    try {
                        const data = await getUpcomingLectures(lectureCount);
                        setLectures(data);
                    } catch (err) {
                        console.error("Failed to fetch upcoming lectures:", err);
                        // Only show notification for unexpected errors to the user
                        if (err.message !== "No upcoming lectures found.") { // Adjust this message if your backend sends it
                            showNotification(err.message || "Failed to load upcoming lectures.", 'error');
                        }
                        setLecturesError(err.message || "Failed to load upcoming lectures.");
                        setLectures([]); // Clear previous lectures on error
                    }
                };

                // --- Phase 3: Fetch Files (Independent) ---
                const fetchFiles = async () => {
                    try {
                        const data = await getAllFiles();
                        setAllFiles(data);
                    } catch (err) {
                        console.error("Failed to fetch uploaded files:", err);
                        // Only show notification for unexpected errors to the user
                        if (err.message !== "No files found.") { // Adjust this message if your backend sends it
                            showNotification(err.message || "Failed to load uploaded files.", 'error');
                        }
                        setFilesError(err.message || "Failed to load uploaded files.");
                        setAllFiles([]); // Clear previous files on error
                    }
                };

                // Run these data fetches concurrently. Their individual errors are caught above.
                await Promise.all([fetchLectures(), fetchFiles()]);

            } catch (authError) {
                // This catch block handles errors *only* from requestDashboardAccess()
                // It means the user's session is truly invalid or unauthorized.
                showNotification(authError.message || 'Your session has expired or is invalid. Please log in again.', 'error');
                navigate('/login', {
                    replace: true,
                    state: { message: 'Your session has expired or is invalid. Please log in again.' }
                });
            } finally {
                setIsLoading(false); // Always set loading to false when all attempts are done
            }
        };

        verifyAuthAndFetchData();
    }, [navigate, showNotification, lectureCount]); // lectureCount in dependencies will trigger re-fetch of lectures


    // ... rest of your component (handleFilterChange, filteredFiles) ...

    const handleFilterChange = useCallback((e) => {
        const { name, value } = e.target;
        setFileFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    }, []);

    const filteredFiles = useMemo(() => {
        return allFiles.filter(file => {
            const lectureMatch = fileFilters.lectureID ? file.lectureID?.toLowerCase().includes(fileFilters.lectureID.toLowerCase()) : true;
            const subjectMatch = fileFilters.subject ? file.subject?.toLowerCase().includes(fileFilters.subject.toLowerCase()) : true;
            const authorMatch = fileFilters.authorID ? file.authorID?.toLowerCase().includes(fileFilters.authorID.toLowerCase()) : true;
            return lectureMatch && subjectMatch && authorMatch;
        });
    }, [allFiles, fileFilters]);

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
                {/* Upcoming Lectures Section */}
                <section className="card lectures-section">
                    <div className="card-header">
                        <h2>Upcoming Lectures</h2>
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
                    <div className="card-body">
                        {lecturesError ? ( // Display lecture-specific error
                            <p className="error-message">{lecturesError}</p>
                        ) : lectures.length > 0 ? (
                            <div className="lecture-list">
                                {/* ... map through lectures ... */}
                                {lectures.map((lecture) => (
                                    <div key={lecture.id} className="lecture-item">
                                        <div className="lecture-meta">
                                            {/* Badges for online/in-person and started status */}
                                            <span className={`badge ${lecture.online ? 'online' : 'in-person'}`}>
                                                {lecture.online ? 'Online' : 'In-Person'}
                                            </span>
                                            {lecture.start && <span className="badge started">Started</span>}
                                        </div>
                                        <h3>{lecture.lectureName}</h3>
                                        <p><strong>Lecturer:</strong> {lecture.lecturer}</p>
                                        <p><strong>Date:</strong> {formatDate(lecture.date)}</p>
                                        <p><strong>Room:</strong> {lecture.room}</p>
                                        {lecture.description && <p className="lecture-description">{lecture.description}</p>}
                                        {lecture.information && <p className="lecture-info">{lecture.information}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data-message">No upcoming lectures scheduled.</p>
                        )}
                    </div>
                </section>

                {/* Uploaded Files Section */}
                <section className="card files-section">
                    <div className="card-header">
                        <h2>Uploaded Files</h2>
                        <div className="file-filters">
                            <input
                                type="text"
                                name="lectureID"
                                placeholder="Filter by Lecture ID"
                                value={fileFilters.lectureID}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />
                            <input
                                type="text"
                                name="subject"
                                placeholder="Filter by Subject"
                                value={fileFilters.subject}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />
                            <input
                                type="text"
                                name="authorID"
                                placeholder="Filter by Author ID"
                                value={fileFilters.authorID}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />
                        </div>
                    </div>
                    <div className="card-body">
                        {filesError ? ( // Display file-specific error
                            <p className="error-message">{filesError}</p>
                        ) : filteredFiles.length > 0 ? (
                            <div className="file-list">
                                {/* ... map through files ... */}
                                {filteredFiles.map((file) => (
                                    <div key={file.id} className="file-item">
                                        <h4><a href={file.fileUrl} target="_blank" rel="noopener noreferrer">{file.fileName}</a></h4>
                                        <p><strong>Lecture ID:</strong> {file.lectureID}</p>
                                        <p><strong>Subject:</strong> {file.subject}</p>
                                        <p><strong>Author ID:</strong> {file.authorID}</p>
                                        <p><strong>Uploaded:</strong> {formatDate(file.uploadTime)}</p>
                                        {file.aiSummary && <p className="file-summary">Summary: {file.aiSummary}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data-message">No files match your filters, or no files have been uploaded yet.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
