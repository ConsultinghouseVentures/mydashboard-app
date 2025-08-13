// src/components/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Container, Box } from '@mui/material';
import { useUser } from '../context/UserContext';

const Dashboard = () => {
  const [displayName, setDisplayName] = useState('');
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();

  useEffect(() => {
    if (user) {
      const name = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
      setDisplayName(name || (user.username ? user.username.split('@')[0] : 'User'));
    }
  }, [user]);

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
      </Box>
    </Container>
  );
};

export default Dashboard;