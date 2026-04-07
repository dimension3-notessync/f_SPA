import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import Register from './components/register';
import Dashboard from './components/dashboard';
import Admin from './components/admin';
import Profile from './components/profile';
import Layout from './components/layout'; // Import Layout

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Routes wrapped in Layout */}
                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/me" element={<Profile />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;
