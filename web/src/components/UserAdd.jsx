// src/components/UserAdd.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';

const UserAdd = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    status: 'Active',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await api.post('/api/users', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar('User added successfully', 'success');
      navigate('/admin');
    } catch (err) {
      console.error('Add user error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to add user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Add New User
      </Typography>
      <TextField
        label="First Name"
        name="first_name"
        value={formData.first_name}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Last Name"
        name="last_name"
        value={formData.last_name}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Status</InputLabel>
        <Select name="status" value={formData.status} onChange={handleChange}>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>User Role</InputLabel>
        <Select name="role" value={formData.role} onChange={handleChange}>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="user">User</MenuItem>
          <MenuItem value="public user">Public User</MenuItem>
        </Select>
      </FormControl>
      <Button variant="contained" onClick={handleSubmit} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Add User'}
      </Button>
    </Box>
  );
};

export default UserAdd;