import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IconButton, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const BackButton = ({ topRight = false, bottomCenter = false }) => {
  const navigate = useNavigate();

  return (
    <>
      {topRight && (
        <IconButton
          sx={{ position: 'absolute', top: 80, right: 16 }}
          onClick={() => navigate('/dashboard')}
        >
          <ArrowBack />
        </IconButton>
      )}
      {bottomCenter && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
          <Button
            component={Link}
            to="/dashboard"
            variant="text"
            color="primary"
          >
            Back
          </Button>
        </Box>
      )}
    </>
  );
};

export default BackButton;