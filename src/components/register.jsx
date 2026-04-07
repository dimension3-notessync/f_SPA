import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerRequest } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import '../css/Auth.css'; // <-- Import the CSS

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            await registerRequest(username, email, password); // Backend sets cookie
            showNotification('Registration successful! Redirecting to dashboard.', 'success');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            showNotification(err.message, 'error'); // Display registration error
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                {/* Add NoteSync here */}
                <div className="auth-app-name">NoteSync</div>

                <h2>Register</h2>
                <form className="auth-form" onSubmit={handleRegister}>
                    <div className="input-group">
                        <label>Username:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Choose a password"
                            required
                        />
                    </div>
                    <button type="submit" className="auth-btn">Register</button>
                </form>
                <p className="auth-footer">
                    Already have an account? <span className="auth-link" onClick={() => navigate('/login')}>Login here</span>
                </p>
            </div>
        </div>
    );
};

export default Register;

