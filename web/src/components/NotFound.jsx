// src/components/NotFound.jsx
import React from 'react';
import { Typography, Box } from '@mui/material';

const NotFound = () => (
  <Box sx={{ textAlign: 'center', mt: 10 }}>
    <Typography variant="h3">404 - Page Not Found</Typography>
    <Typography variant="body1">The page you are looking for does not exist.</Typography>
  </Box>
);

export default NotFound;