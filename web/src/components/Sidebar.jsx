// src/components/Sidebar.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
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
  AdminPanelSettings as AdminIcon,
  Apps as AppsIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import api from '../services/api';
import jwtDecode from 'jwt-decode';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(UserContext);
  const [permissions, setPermissions] = useState({
    users: { access: {} },
    clients: { access: {} },
    employees: { access: {} },
  });
  const fetchedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    window.dispatchEvent(new Event('sidebarToggle'));
    console.log('Sidebar rendered, isCollapsed:', isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    const fetchPermissions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token in Sidebar, skipping fetch');
        return;
      }
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          refreshUser();
          navigate('/login', { replace: true });
          return;
        }
        const response = await api.get('/permissions/permissions-matrix', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Permissions response:', response);
        const moduleData = response.data?.moduleData || {
          users: { access: {} },
          clients: { access: {} },
          employees: { access: {} },
        };
        setPermissions(moduleData);
      } catch (err) {
        console.error('Fetch permissions error:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          refreshUser();
          navigate('/login', { replace: true });
        } else {
          // Fallback for admins
          const token = localStorage.getItem('token');
          let isAdmin = false;
          if (token) {
            try {
              const decoded = jwtDecode(token);
              isAdmin = decoded.roles?.includes('Admin');
            } catch (e) {
              console.error('Token decode error:', e);
            }
          }
          if (isAdmin || user?.role?.toLowerCase() === 'admin') {
            setPermissions({
              users: { access: { Admin: { view_users: true, edit_users: true, assign_roles: true, add_users: true, delete_users: true } } },
              clients: { access: { Admin: { view_clients: true, edit_clients: true } } },
              employees: { access: { Admin: { view_employees: true, edit_employees: true } } },
            });
          }
        }
      }
    };
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchPermissions();
    }
  }, [navigate, refreshUser, user?.role]);

  const toggleSidebar = () => {
    console.log('Toggling sidebar, current state:', isCollapsed);
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    console.log('Logout triggered');
    localStorage.removeItem('token');
    refreshUser();
    navigate('/login', { replace: true });
  };

  const token = localStorage.getItem('token');
  let isAdmin = false;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      isAdmin = decoded.roles?.includes('Admin') || user?.role?.toLowerCase() === 'admin';
    } catch (e) {
      console.error('Token decode error:', e);
    }
  }
  const hasViewUsers = isAdmin || permissions.users?.access[user?.role]?.['view_users'] === true;
  const hasViewClients = isAdmin || permissions.clients?.access[user?.role]?.['view_clients'] === true;
  const hasViewEmployees = isAdmin || permissions.employees?.access[user?.role]?.['view_employees'] === true;

  const primaryMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Clients', icon: <BusinessIcon />, path: '/clients', visible: hasViewClients },
    {
      text: 'Employees',
      icon: <WorkIcon />,
      path: '/employees',
      visible: hasViewEmployees && !['employee', 'public user'].includes(user?.role?.toLowerCase() || ''),
    },
    { text: 'Mini Apps', icon: <AppsIcon />, path: '/miniapps' },
  ];

  const supportMenuItems = [
    ...(isAdmin ? [{ text: 'Admin', icon: <AdminIcon />, path: '/admin' }] : []),
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Logout', icon: <ExitToAppIcon />, action: handleLogout },
  ];

  console.log('Rendering support menu items:', supportMenuItems.map(item => item.text));

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
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            justifyContent: isCollapsed ? 'center' : 'space-between',
            minWidth: '60px',
          }}
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
            (item.visible === undefined || item.visible) && (
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
            )
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