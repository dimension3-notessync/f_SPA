// src/components/FilesSection.jsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
    getAllFiles,
    uploadFileRequest,
    subscribeToAuthor // NEW: Import subscribeToAuthor
} from '../services/api';
import { useNotification } from '../context/NotificationContext';

// Import the files_URL directly to construct download links
import { files_URL } from '../services/api';

const FilesSection = () => {
    const [allFiles, setAllFiles] = useState([]);
    const [filesError, setFilesError] = useState(null);
    const [fileFilters, setFileFilters] = useState({ lectureID: '', subject: '', authorID: '' });

    // State for File Upload
    const [isUploading, setIsUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({ file: null, lectureID: '', subject: '' });

    // NEW: State for Author Subscription
    const [subscribingAuthorId, setSubscribingAuthorId] = useState(null);


    const { showNotification } = useNotification();
    const isInitialMount = useRef(true); // For preventing double fetch on initial mount

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

    // --- Effect for Initial Data Load ---
    useEffect(() => {
        if (isInitialMount.current) {
            fetchFiles();
            isInitialMount.current = false; // Mark as not initial mount after first fetch
        }
    }, [fetchFiles]);

    // --- Handlers for File Upload and Filters ---

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

    // NEW: Handle Subscribe to Author
    const handleSubscribeToAuthor = useCallback(async (authorId) => {
        setSubscribingAuthorId(authorId); // Set loading state for this specific author
        try {
            const response = await subscribeToAuthor(authorId);
            showNotification(response.message || `Subscribed to author ${authorId} successfully!`, 'success');
        } catch (err) {
            console.error("Author Subscription failed:", err);
            showNotification(err.message || `Failed to subscribe to author ${authorId}.`, 'error');
        } finally {
            setSubscribingAuthorId(null); // Clear loading state
        }
    }, [showNotification]);


    const filteredFiles = useMemo(() => {
        return allFiles.filter(file => {
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

    return (
        <section className="card files-section">
            <div className="card-header">
                <h2>Uploaded Files</h2>
                <form className="upload-form" onSubmit={handleUploadSubmit}>
                    <input
                        type="file"
                        name="file"
                        onChange={handleUploadChange}
                        className="file-input-hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="btn-secondary">
                        {uploadForm.file ? (uploadForm.file.name.length > 10 ? uploadForm.file.name.substring(0, 10) + "..." : uploadForm.file.name) : 'Choose File'}
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
                                <div className="file-info-header">
                                    <h4>
                                        <a href={`${files_URL}${file.fileUrl}`} target="_blank" rel="noopener noreferrer">{file.fileName}</a>
                                    </h4>
                                    <div className="file-actions"> {/* NEW: Group download and subscribe buttons */}
                                        <a
                                            href={`${files_URL}${file.fileUrl}`}
                                            download={file.fileName}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-download"
                                        >
                                            Download
                                        </a>
                                        {/* NEW: Subscribe to Author Button */}
                                        <button
                                            className="btn-subscribe-author"
                                            onClick={() => handleSubscribeToAuthor(file.authorID)}
                                            disabled={subscribingAuthorId === file.authorID}
                                        >
                                            {subscribingAuthorId === file.authorID ? 'Subscribing...' : 'Subscribe Author'}
                                        </button>
                                    </div>
                                </div>
                                <p><strong>Lecture ID:</strong> {file.lectureID}</p>
                                <p><strong>Subject:</strong> {file.subject}</p>
                                <p><strong>Author ID:</strong> {file.authorID}</p> {/* Display Author ID as it's what's used */}
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
    );
};

export default FilesSection;
