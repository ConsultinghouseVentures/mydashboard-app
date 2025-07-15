// src/App.jsx

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Clients from './components/Clients';
import ClientsDetail from './components/ClientsDetail'; // Verify import path
import { SnackbarProvider } from './context/SnackbarContext';

// Wrapper for authenticated routes
const AuthenticatedLayout = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthenticatedLayout token check:', token); // Debug token
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <Box sx={{ display: 'flex', width: '100vw', height: '100vh', overflowX: 'hidden' }}>
      <TopBar />
      <Sidebar />
      <Box
        component="main"
        className="content-container"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: { xs: 0, sm: 'min(15vw, 60px)', md: 'min(25vw, 240px)' },
          mt: { xs: 8, sm: 8 },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

// Main App component
const App = () => {
  return (
    <SnackbarProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthenticatedLayout>
                <Profile />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/clients"
            element={
              <AuthenticatedLayout>
                <Clients />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/clients/:uid"
            element={
              <AuthenticatedLayout>
                <ClientsDetail />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/"
            element={
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            }
          />
        </Routes>
      </Router>
    </SnackbarProvider>
  );
};

export default App;