// src/components/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Container, Box, Button, Grid } from '@mui/material';
import jwtDecode from 'jwt-decode';
import api from '../services/api';

const Dashboard = () => {
  const [services, setServices] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      console.log('Token in Dashboard:', token);
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded JWT:', decoded);
        setDisplayName(decoded.name || decoded.username.split('@')[0]);
        const response = await api.get('/api/serviceitems', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Service items response:', response.data);
        setServices(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Fetch services error:', error);
        setServices([]);
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    console.log('Dashboard logout triggered');
    localStorage.removeItem('token');
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
        <Typography variant="h6" gutterBottom>
          Service Items
        </Typography>
        {services.length === 0 ? (
          <Typography>No service items available</Typography>
        ) : (
          <Grid container spacing={2}>
            {services.map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service.uid}>
                <Box
                  className="glass-effect"
                  sx={{
                    p: 2,
                    '&:hover': { boxShadow: '0 6px 40px rgba(0, 0, 0, 0.15)' },
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {service.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.detail_description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;