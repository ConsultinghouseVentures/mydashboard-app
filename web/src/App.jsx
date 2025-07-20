// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, Toolbar, CircularProgress } from '@mui/material';
import jwtDecode from 'jwt-decode';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { SnackbarProvider } from './context/SnackbarContext';
import { UserProvider } from './context/UserContext';

// Lazy load components for better performance
const Profile = lazy(() => import('./components/Profile'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Login = lazy(() => import('./components/Login'));
const Clients = lazy(() => import('./components/Clients'));
const ClientsDetail = lazy(() => import('./components/ClientsDetail'));
const Admin = lazy(() => import('./components/Admin'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const PermissionsMatrix = lazy(() => import('./components/PermissionsMatrix'));
const UserDetail = lazy(() => import('./components/UserDetail'));
const Register = lazy(() => import('./components/Register'));
const MiniApps = lazy(() => import('./components/MiniApps'));
const Employees = lazy(() => import('./components/Employees.jsx'));
const EmployeeDetail = lazy(() => import('./components/EmployeeDetail'));
const NotFound = lazy(() => import('./components/NotFound.jsx'));

// PrivateRoute component for protected routes
const PrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }
  } catch (err) {
    console.error('Invalid token in PrivateRoute:', err);
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  return children;
};

// AuthenticatedLayout wrapper
const AuthenticatedLayout = ({ children }) => (
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

// Main App component
const App = () => {
  return (
    <SnackbarProvider>
      <UserProvider>
        <Router>
          <Suspense
            fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
              </Box>
            }
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <AuthenticatedLayout>
                      <Dashboard />
                    </AuthenticatedLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <AuthenticatedLayout>
                      <Profile />
                    </AuthenticatedLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <PrivateRoute>
                    <AuthenticatedLayout>
                      <Clients />
                    </AuthenticatedLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/clients/:uid"
                element={
                  <PrivateRoute>
                    <AuthenticatedLayout>
                      <ClientsDetail />
                    </AuthenticatedLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <PrivateRoute>
                    <AuthenticatedLayout>
                      <Admin />
                    </AuthenticatedLayout>
                  </PrivateRoute>
                }
              >
                <Route index element={<UserManagement />} />
                <Route path="user-management" element={<UserManagement />} />
                <Route path="permissions-matrix" element={<PermissionsMatrix />} />
              </Route>
              <Route
                path="/users/:uid"
                element={
                  <PrivateRoute>
                    <AuthenticatedLayout>
                      <UserDetail />
                    </AuthenticatedLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/miniapps"
                element={
                  <PrivateRoute>
                    <AuthenticatedLayout>
                      <MiniApps />
                    </AuthenticatedLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <PrivateRoute>
                    <AuthenticatedLayout>
                      <Employees />
                    </AuthenticatedLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/employees/:uid"
                element={
                  <PrivateRoute>
                    <AuthenticatedLayout>
                      <EmployeeDetail />
                    </AuthenticatedLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <AuthenticatedLayout>
                      <Dashboard />
                    </AuthenticatedLayout>
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </UserProvider>
    </SnackbarProvider>
  );
};

export default App;