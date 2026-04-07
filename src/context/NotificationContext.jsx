import React, { createContext, useState, useContext, useCallback, useRef } from 'react'; // Import useRef
import Notification from '../components/notification';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const nextNotificationId = useRef(0); // Use a ref for a mutable, unique counter

    const showNotification = useCallback((message, type = 'info') => {
        const id = nextNotificationId.current++; // Increment the counter for a unique ID
        setNotifications((prevNotifications) => [
            ...prevNotifications,
            { id, message, type },
        ]);
    }, []);

    const dismissNotification = useCallback((id) => {
        setNotifications((prevNotifications) =>
            prevNotifications.filter((n) => n.id !== id)
        );
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                maxWidth: '300px',
            }}>
                {notifications.map((n) => (
                    <Notification
                        key={n.id} // This is now guaranteed unique
                        id={n.id}
                        message={n.message}
                        type={n.type}
                        onDismiss={dismissNotification}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
