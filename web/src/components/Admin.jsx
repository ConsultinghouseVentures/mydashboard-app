// src/components/Admin.jsx
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';

const Admin = () => {
  const location = useLocation();
  const currentPath = location.pathname.replace('/admin/', '').replace('/admin', '');

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box
        sx={{
          width: 250,
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          overflowY: 'auto',
        }}
      >
        <List component="nav">
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/admin/user-management"
              selected={currentPath === 'user-management' || currentPath === ''}
            >
              <ListItemText primary="User Management" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/admin/permissions-matrix"
              selected={currentPath === 'permissions-matrix'}
            >
              <ListItemText primary="Permissions Matrix" />
            </ListItemButton>
          </ListItem>
          {/* Add more admin sections here */}
        </List>
      </Box>
      <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Admin;