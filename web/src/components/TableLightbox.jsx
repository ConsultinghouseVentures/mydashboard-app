// TableLightbox.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import LayoutLightbox from './Layout_Lightbox.jsx';
import { useSnackbar } from '../context/SnackbarContext';

const TableLightbox = ({
  open = false,
  onClose = () => {},
  data = null,
  columnsConfig = [],
  mode = 'view', // 'view' or 'edit'
  onSave = () => {},
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [currentData, setCurrentData] = useState(data);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      setCurrentMode(mode);
      setCurrentData(data);
      console.log('TableLightbox useEffect triggered - mode:', mode, 'data:', data);
    }
  }, [open, mode, data]);

  const handleFieldChange = (field, value) => {
    setCurrentData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSave = async () => {
    try {
      console.log('Attempting to save data:', currentData);
      const updatedData = await onSave(currentData);
      console.log('Save successful, updated data:', updatedData);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
      showSnackbar(error.message || 'Save failed', 'error');
    }
  };

  if (!open || !currentData) return null;

  const visibleColumns = columnsConfig.filter((col) => col.visible && col.field !== 'actions');

  return (
    <LayoutLightbox open={open} onClose={onClose}>
      <DialogTitle>
        {currentMode === 'view' ? 'View Details' : 'Edit Details'}
      </DialogTitle>
      <DialogContent sx={{ width: '480px', maxWidth: '90vw', overflowX: 'hidden' }}>
        {currentMode === 'edit' && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button size="small" onClick={handleCancel} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={handleSave}>
              Save
            </Button>
          </Box>
        )}
        {currentMode === 'view' && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button size="small" onClick={onClose}>
              Close
            </Button>
          </Box>
        )}
        <Grid container spacing={2}>
          {visibleColumns.map((col) => (
            <Grid item xs={12} key={col.field}>
              <Typography variant="subtitle2" gutterBottom>
                {col.headerName}
              </Typography>
              {currentMode === 'view' ? (
                <Typography variant="body1">
                  {col.type === 'date' && currentData?.[col.field]
                    ? new Date(currentData[col.field]).toLocaleString()
                    : currentData?.[col.field] || 'N/A'}
                </Typography>
              ) : col.type === 'singleSelect' ? (
                <FormControl fullWidth size="small" sx={{ maxWidth: '100%' }}>
                  <InputLabel>{col.headerName}</InputLabel>
                  <Select
                    value={currentData?.[col.field] || ''}
                    onChange={(e) => handleFieldChange(col.field, e.target.value)}
                    label={col.headerName}
                  >
                    {col.valueOptions.map(opt => (
                      <MenuItem key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  value={currentData?.[col.field] || ''}
                  onChange={(e) => handleFieldChange(col.field, e.target.value)}
                  type={col.type === 'date' ? 'date' : 'text'}
                  InputLabelProps={col.type === 'date' ? { shrink: true } : {}}
                  sx={{ maxWidth: '100%' }}
                />
              )}
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ pr: 3 }}>
        {currentMode === 'edit' ? (
          <>
            <Button size="small" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={handleSave}>
              Save
            </Button>
          </>
        ) : (
          <Button size="small" onClick={onClose}>
            Close
          </Button>
        )}
      </DialogActions>
    </LayoutLightbox>
  );
};

export default TableLightbox;