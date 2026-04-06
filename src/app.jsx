import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import Register from './components/register'; // Import Register
import Dashboard from './components/dashboard';
import Admin from './components/admin';
import Profile from './components/profile';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/me" element={<Profile />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
