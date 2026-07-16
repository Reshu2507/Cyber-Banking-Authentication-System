import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import OtpVerify from './components/OtpVerify';
import Dashboard from './components/Dashboard';

function App() {
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<OtpVerify />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      
      {/* SVG Gradient definition for logo styling */}
      <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true" focusable="false">
        <linearGradient id="cyan-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="100%" stopColor="#4facfe" />
        </linearGradient>
      </svg>
    </BrowserRouter>
  );
}

export default App;
