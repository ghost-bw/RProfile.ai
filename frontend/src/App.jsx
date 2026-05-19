import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import ATSCheck from './pages/ATSCheck';
import CodingRound from './pages/CodingRound';
import AptitudeRound from './pages/AptitudeRound';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/ats-check" 
            element={<ProtectedRoute><ATSCheck /></ProtectedRoute>} 
          />
          <Route 
            path="/interview/:sessionId" 
            element={<ProtectedRoute><Interview /></ProtectedRoute>} 
          />
          <Route 
            path="/coding-round" 
            element={<ProtectedRoute><CodingRound /></ProtectedRoute>} 
          />
          <Route 
            path="/aptitude-round" 
            element={<ProtectedRoute><AptitudeRound /></ProtectedRoute>} 
          />
          <Route 
            path="/analytics" 
            element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
