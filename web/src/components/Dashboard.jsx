// src/components/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Container, Box, Button } from '@mui/material';
import { useUser } from '../context/UserContext';

const Dashboard = () => {
  const [displayName, setDisplayName] = useState('');
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || (user.username ? user.username.split('@')[0] : 'User'));
    }
  }, [user]);

  const handleLogout = () => {
    console.log('Dashboard logout triggered');
    localStorage.removeItem('token');
    refreshUser();
    navigate('/login', { replace: true });
  };

  return (
    <Container
      maxWidth="lg"
      className="content-container"
      sx={{ ml: { xs: 0, sm: 'min(15vw, 60px)', md: 'min(25vw, 240px)' }, p: 3 }}
    >
      <Box sx={{ mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'left' }}>
          Welcome back, {displayName || 'User'}!
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" color="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;