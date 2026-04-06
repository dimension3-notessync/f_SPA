import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerRequest } from '../services/api';
import { useNotification } from '../context/NotificationContext';

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
        <div className="register-container">
            <h2>Register</h2>

            <form onSubmit={handleRegister}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username"
                        required
                    />
                </div>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Choose a password"
                        required
                    />
                </div>
                <button type="submit">Register</button>
            </form>
            <p>
                Already have an account? <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>Login here</span>
            </p>
        </div>
    );
};

export default Register;
