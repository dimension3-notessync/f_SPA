// src/components/Notification.jsx
import React, { useState, useEffect } from 'react';

const Notification = ({ message, type, id, onDismiss }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Automatically dismiss after 5 seconds
        const timer = setTimeout(() => {
            setVisible(false);
            // Give a little time for animation if you add one, then dismiss from parent
            setTimeout(() => onDismiss(id), 500);
        }, 5000);

        return () => clearTimeout(timer); // Cleanup on unmount
    }, [id, onDismiss]);

    if (!visible) return null;

    const notificationStyle = {
        padding: '10px 15px',
        margin: '10px 0',
        borderRadius: '4px',
        color: 'white',
        backgroundColor: type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    };

    const dismissButtonStyle = {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '1.2em',
        cursor: 'pointer',
    };

    return (
        <div style={notificationStyle}>
            <span>{message}</span>
            <button
                onClick={() => { setVisible(false); onDismiss(id); }}
                style={dismissButtonStyle}
            >
                &times;
            </button>
        </div>
    );
};

export default Notification;

