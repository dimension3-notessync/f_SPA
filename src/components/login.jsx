import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginRequest, checkAuthSession } from '../services/api'; // Use checkAuthSession
import { useNotification } from '../context/NotificationContext';
import '../css/Auth.css'; // <-- Import the CSS

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true); // New loading state for initial check

    const navigate = useNavigate();
    const location = useLocation();
    const { showNotification } = useNotification();

    const sessionMessage = location.state?.message;

    // Effect to check for an existing valid session cookie
    useEffect(() => {
        const verifySession = async () => {
            // If there's a session message (e.g., from an expired dashboard session),
            // display it and immediately stop loading. Do NOT attempt to auto-login.
            if (sessionMessage) {
                showNotification(sessionMessage, 'error');
                setLoading(false);
                // Clear the state from location after it's been read. This ensures the message
                // doesn't persist if the user navigates away and back, or refreshes.
                navigate(location.pathname, { replace: true, state: {} });
                return;
            }

            // Only attempt to check auth status if there's no session message
            try {
                await checkAuthSession(); // Backend verifies cookie via 11301/auth/check-session
                // If successful, means a valid cookie exists and user is logged in
                showNotification('Welcome back!', 'info');
                navigate('/dashboard', { replace: true });
            } catch (err) {
                // If checkAuthSession throws (e.g., 401 Not Found, or Unauthorized),
                // it means no valid session. Stay on login page and finish loading.
                setLoading(false);
                // Do NOT show a notification here unless it's a specific non-401 error.
                // A 401 is expected if not logged in, not an error to the user.
            }
        };
        verifySession();
    }, [navigate, sessionMessage, showNotification, location]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await loginRequest(username, password); // Backend sets cookie
            showNotification('Login successful!', 'success');
            navigate('/dashboard', { replace: true, state: {} }); // Clear state here too
        } catch (err) {
            showNotification(err.message, 'error'); // Display login error via notification
        }
    };

    // Only show loading if we are actively checking the session and no specific message is being displayed
    if (loading && !sessionMessage) {
        return <div className="auth-wrapper"><p>Checking existing session...</p></div>;
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                {/* Add NoteSync here */}
                <div className="auth-app-name">NoteSync</div>

                <h2>Login</h2>
                <form className="auth-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Username:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    <button type="submit" className="auth-btn">Log In</button>
                </form>
                <p className="auth-footer">
                    Don't have an account? <span className="auth-link" onClick={() => navigate('/register')}>Register here</span>
                </p>
            </div>
        </div>
    );
};

export default Login;

