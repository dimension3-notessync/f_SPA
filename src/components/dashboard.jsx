import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    requestDashboardAccess,
    getUpcomingLectures,
    getAllFiles,
    uploadFileRequest // Ensure this is exported in your api.js
} from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../css/Dashboard.css';

const Dashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [lectures, setLectures] = useState([]);
    const [lecturesError, setLecturesError] = useState(null);
    const [allFiles, setAllFiles] = useState([]);
    const [filesError, setFilesError] = useState(null);
    const [lectureCount, setLectureCount] = useState(5);
    const [fileFilters, setFileFilters] = useState({ lectureID: '', subject: '', authorID: '' });

    // State for File Upload
    const [isUploading, setIsUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({ file: null, lectureID: '', subject: '' });

    const navigate = useNavigate();
    const { showNotification } = useNotification();

    // --- Independent fetch functions ---

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

    const fetchFiles = useCallback(async () => {
        setFilesError(null);
        try {
            const data = await getAllFiles();
            setAllFiles(data);
        } catch (err) {
            console.error("Failed to fetch uploaded files:", err);
            if (err.message !== "No files found.") {
                showNotification(err.message || "Failed to load uploaded files.", 'error');
            }
            setFilesError(err.message || "Failed to load uploaded files.");
            setAllFiles([]);
        }
    }, [showNotification]);

    // --- Effect 1: Initial Mount (Auth and First Data Load) ---
    useEffect(() => {
        const initialLoad = async () => {
            setIsLoading(true);
            try {
                await requestDashboardAccess();
                await Promise.all([fetchLectures(), fetchFiles()]);
            } catch (authError) {
                showNotification(authError.message || 'Session invalid.', 'error');
                navigate('/login', { replace: true });
            } finally {
                setIsLoading(false);
            }
        };
        initialLoad();
    }, [navigate, showNotification, fetchLectures, fetchFiles]);

    // --- Effect 2: Update Lectures ONLY when lectureCount changes ---
    useEffect(() => {
        if (!isLoading) {
            fetchLectures();
        }
    }, [lectureCount, fetchLectures]);

    // --- Handlers ---

    const handleFilterChange = useCallback((e) => {
        const { name, value } = e.target;
        setFileFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    }, []);

    const handleUploadChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'file') {
            setUploadForm(prev => ({ ...prev, file: files[0] }));
        } else {
            setUploadForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) {
            showNotification("Please select a file first.", "error");
            return;
        }

        setIsUploading(true);
        try {
            await uploadFileRequest(uploadForm.file, uploadForm.lectureID, uploadForm.subject);
            showNotification("File uploaded successfully!", "success");
            setUploadForm({ file: null, lectureID: '', subject: '' }); // Reset form
            fetchFiles(); // Refresh list to show new file
        } catch (err) {
            showNotification(err.message || "Upload failed", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const filteredFiles = useMemo(() => {
        return allFiles.filter(file => {
            // Use optional chaining and nullish coalescing to avoid errors
            const lectureMatch = fileFilters.lectureID
                ? file.lectureID?.toString().toLowerCase().includes(fileFilters.lectureID.toLowerCase())
                : true;
            const subjectMatch = fileFilters.subject
                ? file.subject?.toLowerCase().includes(fileFilters.subject.toLowerCase())
                : true;
            const authorMatch = fileFilters.authorID
                ? file.authorID?.toString().toLowerCase().includes(fileFilters.authorID.toLowerCase())
                : true;
            return lectureMatch && subjectMatch && authorMatch;
        });
    }, [allFiles, fileFilters]);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        // If the timestamp is in seconds (usually 10 digits),
        // convert it to milliseconds (13 digits)
        const normalizedTimestamp = timestamp < 10000000000
            ? timestamp * 1000
            : timestamp;

        const date = new Date(normalizedTimestamp);

        // 'en-GB' uses dd/mm/yyyy
        const datePart = date.toLocaleDateString('en-GB');

        // hour12: false forces 24h format
        const timePart = date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        return `${datePart} ${timePart}`;
    };

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
                        {lecturesError ? (
                            <p className="error-message">{lecturesError}</p>
                        ) : lectures.length > 0 ? (
                            <div className="lecture-list">
                                {lectures.map((lecture, index) => (
                                    <div key={lecture.id || index} className="lecture-item">
                                        <div className="lecture-meta">
                                            <span className={`badge ${lecture.online ? 'online' : 'in-person'}`}>
                                                {lecture.online ? 'Online' : 'In-Person'}
                                            </span>
                                            {!lecture.start && (
                                                <span className="badge canceled">Canceled</span>
                                            )}
                                        </div>
                                        <h3>{lecture.lectureName}</h3>
                                        <p><strong>Lecturer:</strong> {lecture.lecturer}</p>
                                        <p><strong>Date:</strong> {formatDate(lecture.date)}</p>
                                        <p><strong>Room:</strong> {lecture.room}</p>
                                        <p><strong>Description:</strong> {lecture.description}</p>
                                        <p><strong>Additional Information:</strong> {lecture.information}</p>
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
                        {/* File Upload Form */}
                        <form className="upload-form" onSubmit={handleUploadSubmit}>
                            <input
                                type="file"
                                name="file"
                                onChange={handleUploadChange}
                                className="file-input-hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="btn-secondary">
                                {uploadForm.file ? uploadForm.file.name.substring(0, 10) + "..." : 'Choose File'}
                            </label>
                            <input
                                type="text"
                                name="lectureID"
                                placeholder="Lecture ID"
                                value={uploadForm.lectureID}
                                onChange={handleUploadChange}
                                className="filter-input-small"
                            />
                            <input
                                type="text"
                                name="subject"
                                placeholder="Subject"
                                value={uploadForm.subject}
                                onChange={handleUploadChange}
                                className="filter-input-small"
                            />
                            <button type="submit" className="btn-primary" disabled={isUploading}>
                                {isUploading ? '...' : 'Upload'}
                            </button>
                        </form>
                    </div>

                    <div className="card-body">
                        {/* Filters */}
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

                        {filesError ? (
                            <p className="error-message">{filesError}</p>
                        ) : filteredFiles.length > 0 ? (
                            <div className="file-list">
                                {filteredFiles.map((file, index) => (
                                    <div key={file.id || index} className="file-item">
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
