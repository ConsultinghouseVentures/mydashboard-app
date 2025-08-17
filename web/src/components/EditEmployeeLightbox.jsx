// Path: src/components/EditEmployeeLightbox.jsx
import React, { useState, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from '../context/SnackbarContext';
import LayoutLightbox from './Layout_Lightbox';
import api from '../services/api';

const EditEmployeeLightbox = ({ open, mode, data, clients, onClose, onSave, lightboxStyles }) => {
  const { showSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    status: 'Active',
    role: 'Employee',
    client_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!open || !data?.uid) return;
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('No authentication token found', 'error');
        setLoading(false);
        return;
      }
      try {
        const response = await api.getEmployee(data.uid, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const employeeData = response.data || response;
        setFormData({
          uid: employeeData.uid,
          first_name: employeeData.first_name || '',
          last_name: employeeData.last_name || '',
          email: employeeData.email || '',
          status: employeeData.status || 'Active',
          role: employeeData.role || 'Employee',
          client_id: employeeData.client_id || '',
        });
      } catch (err) {
        console.error('Fetch employee data error:', err);
        showSnackbar(err.response?.data?.message || 'Failed to fetch employee data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeData();
  }, [open, data?.uid, showSnackbar]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (mode !== 'edit') return;
    if (!formData.first_name || !formData.last_name || !formData.email) {
      showSnackbar('Missing required fields: First Name, Last Name, Email', 'error');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      showSnackbar('Invalid email format', 'error');
      return;
    }
    setSaveLoading(true);
    try {
      await onSave({
        uid: formData.uid,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        status: formData.status,
        role: formData.role,
        client_id: formData.client_id || null,
      });
    } catch (err) {
      // Error handling is done in onSave
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <LayoutLightbox open={open} onClose={onClose}>
        <DialogTitle sx={lightboxStyles ? lightboxStyles.title : { p: 1, fontSize: '1rem' }}>
          Loading...
        </DialogTitle>
        <DialogContent sx={lightboxStyles ? lightboxStyles.content : { p: 1 }}>
          <CircularProgress />
        </DialogContent>
      </LayoutLightbox>
    );
  }

  return (
    <LayoutLightbox open={open} onClose={onClose}>
      <DialogTitle sx={lightboxStyles ? lightboxStyles.title : { p: 1, fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {mode === 'edit' ? 'Edit Employee' : 'View Employee'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={lightboxStyles ? lightboxStyles.content : { p: 1 }}>
        <TextField
          label="First Name"
          name="first_name"
          value={formData.first_name || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          disabled={mode !== 'edit'}
        />
        <TextField
          label="Last Name"
          name="last_name"
          value={formData.last_name || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          disabled={mode !== 'edit'}
        />
        <TextField
          label="Email"
          name="email"
          value={formData.email || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          type="email"
          disabled={mode !== 'edit'}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={formData.status || ''}
            onChange={handleChange}
            disabled={mode !== 'edit'}
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select
            name="role"
            value={formData.role || ''}
            onChange={handleChange}
            disabled={mode !== 'edit'}
          >
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="Employee">Employee</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Client</InputLabel>
          <Select
            name="client_id"
            value={formData.client_id || ''}
            onChange={handleChange}
            disabled={mode !== 'edit'}
          >
            <MenuItem value="">None</MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.uid} value={client.uid}>
                {client.client_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {mode === 'view' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">Client: {clients.find(c => c.uid === formData.client_id)?.client_name || 'None'}</Typography>
            <Typography variant="body2">Created At: {formData.created_at ? new Date(formData.created_at).toLocaleString() : 'N/A'}</Typography>
            <Typography variant="body2">Updated At: {formData.updated_at ? new Date(formData.updated_at).toLocaleString() : 'N/A'}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={lightboxStyles ? lightboxStyles.actions : { p: 1 }}>
        <Button size="small" onClick={onClose}>
          {mode === 'edit' ? 'Cancel' : 'Close'}
        </Button>
        {mode === 'edit' && (
          <Button size="small" onClick={handleSubmit} disabled={saveLoading}>
            {saveLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        )}
      </DialogActions>
    </LayoutLightbox>
  );
};

export default EditEmployeeLightbox;