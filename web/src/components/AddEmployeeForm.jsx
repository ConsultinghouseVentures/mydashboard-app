// Path: src/components/AddEmployeeForm.jsx
import React from 'react';
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
  CircularProgress,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LayoutLightbox from './Layout_Lightbox';

const AddEmployeeForm = ({ open, onClose, formData, onChange, onSubmit, loading, clients }) => (
  <LayoutLightbox open={open} onClose={onClose}>
    <DialogTitle sx={{ p: 1, fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      Add New Employee
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
    <DialogContent sx={{ p: 1 }}>
      <TextField
        label="First Name"
        name="first_name"
        value={formData.first_name}
        onChange={onChange}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Last Name"
        name="last_name"
        value={formData.last_name}
        onChange={onChange}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Email"
        name="email"
        value={formData.email}
        onChange={onChange}
        fullWidth
        margin="normal"
        required
        type="email"
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={onChange}
        fullWidth
        margin="normal"
        required
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Status</InputLabel>
        <Select name="status" value={formData.status} onChange={onChange}>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Role</InputLabel>
        <Select name="role" value={formData.role} onChange={onChange}>
          <MenuItem value="Admin">Admin</MenuItem>
          <MenuItem value="User">User</MenuItem>
          <MenuItem value="Employee">Employee</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Client</InputLabel>
        <Select name="client_id" value={formData.client_id} onChange={onChange}>
          <MenuItem value="">None</MenuItem>
          {clients.map((client) => (
            <MenuItem key={client.uid} value={client.uid}>
              {client.client_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </DialogContent>
    <DialogActions sx={{ p: 1 }}>
      <Button size="small" onClick={onClose}>
        Cancel
      </Button>
      <Button size="small" onClick={onSubmit} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Save'}
      </Button>
    </DialogActions>
  </LayoutLightbox>
);

export default AddEmployeeForm;