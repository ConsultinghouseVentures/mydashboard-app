// web/src/components/AddEmployeeForm.jsx
import React from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, Button, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import LayoutLightbox from './Layout_Lightbox';

const AddEmployeeForm = ({ open, onClose, formData, onChange, onSubmit, loading, clientName }) => (
  <LayoutLightbox open={open} onClose={onClose}>
    <DialogTitle>Add New Employee</DialogTitle>
    <DialogContent>
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
        label="Email (User Name)"
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
      <TextField
        label="Client"
        value={clientName}
        fullWidth
        margin="normal"
        disabled
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onSubmit} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Save'}
      </Button>
    </DialogActions>
  </LayoutLightbox>
);

export default AddEmployeeForm;