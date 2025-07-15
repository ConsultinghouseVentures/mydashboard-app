// Sidebar.jsx

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    window.dispatchEvent(new Event('sidebarToggle'));
    console.log('Sidebar rendered, isCollapsed:', isCollapsed);
    console.log('Rendering support menu items:', ['Profile', 'Logout']);
  }, [isCollapsed]);

  const toggleSidebar = () => {
    console.log('Toggling sidebar, current state:', isCollapsed);
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    console.log('Logout triggered');
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  const primaryMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Clients', icon: <BusinessIcon />, path: '/clients' },
  ];

  const supportMenuItems = [
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Logout', icon: <ExitToAppIcon />, action: handleLogout },
  ];

  return (
    <Drawer
      variant="permanent"
      className="glass-effect sidebar-container"
      sx={{
        width: isCollapsed ? '60px' : 'min(25vw, 240px)',
        minWidth: '60px',
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isCollapsed ? '60px' : 'min(25vw, 240px)',
          minWidth: '60px',
          boxSizing: 'border-box',
          transition: 'width 0.3s',
          top: 64,
          minHeight: 'calc(100vh - 64px)',
          maxHeight: 'calc(100vh - 64px)',
          overflowX: 'hidden',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'inherit',
        },
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Box
          className="glass-effect-light"
          sx={{ display: 'flex', alignItems: 'center', p: 1, justifyContent: isCollapsed ? 'center' : 'space-between', minWidth: '60px' }}
        >
          {!isCollapsed && (
            <Typography variant="h6" sx={{ pl: 2, color: 'inherit', minWidth: '0' }}>
              Menu
            </Typography>
          )}
          <IconButton
            onClick={toggleSidebar}
            sx={{ color: 'inherit', visibility: 'visible', zIndex: (theme) => theme.zIndex.drawer + 2, minWidth: '60px' }}
          >
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
        <Divider className="glass-effect-light" />
        <List sx={{ overflowX: 'hidden', pb: 1, minWidth: '60px' }}>
          {primaryMenuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              onClick={() => console.log(`Navigating to ${item.text}`)}
              className="glass-effect-light"
              sx={{
                m: 0.5,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                visibility: 'visible',
                minHeight: 48,
                minWidth: '60px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <ListItemIcon sx={{ minWidth: isCollapsed ? 'auto' : 56, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText
                  primary={item.text}
                  sx={{ color: 'inherit', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis' }}
                />
              )}
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ flexGrow: 0, pb: 8, minWidth: '60px' }}>
        <Divider className="glass-effect-light" />
        <List sx={{ overflowX: 'hidden', pt: 1, minWidth: '60px' }}>
          {supportMenuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={item.path ? Link : 'button'}
              to={item.path}
              onClick={item.action}
              className="glass-effect-light"
              sx={{
                m: 0.5,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                visibility: 'visible',
                minHeight: 48,
                minWidth: '80px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <ListItemIcon sx={{ minWidth: isCollapsed ? 'auto' : 56, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText
                  primary={item.text}
                  sx={{ color: 'inherit', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis' }}
                />
              )}
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;