// src/index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { NotificationProvider } from './context/NotificationContext'; // Import NotificationProvider
import App from './app';
import './app.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <NotificationProvider> {/* Wrap App with NotificationProvider */}
            <App />
        </NotificationProvider>
    </React.StrictMode>
);
