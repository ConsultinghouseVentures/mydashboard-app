// src/context/SnackbarContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

const SnackbarContext = createContext();

export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? 10000 : 6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ position: 'fixed', top: 16, zIndex: 1500 }}
      >
        <Alert onClose={handleClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {children}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => useContext(SnackbarContext);