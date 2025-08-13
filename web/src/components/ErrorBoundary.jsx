// src/components/ErrorBoundary.jsx
import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography color="error">Something went wrong: {this.state.error.message}</Typography>
          <Button variant="contained" onClick={() => this.props.navigate('/clients')}>
            Back to Clients
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundaryWrapper(props) {
  const navigate = useNavigate();
  return <ErrorBoundary navigate={navigate} {...props} />;
}