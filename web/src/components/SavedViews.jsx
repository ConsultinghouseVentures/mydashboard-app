// SavedViews.jsx

import React, { useState, useContext } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import LayoutLightbox from './Layout_Lightbox.jsx';
import { LayoutContext } from './Layout_TableOverview.jsx';

const SavedViews = ({
  savedViews = [],
  setSavedViews = () => {},
  selectedView = '',
  setSelectedView = () => {},
  setFilterRules = () => {},
  filterRules = [],
  open = false,
  onClose = () => {},
}) => {
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');
  const [nameError, setNameError] = useState('');
  const { lightboxStyles } = useContext(LayoutContext) || {};
  const defaultLightboxStyles = {
    title: { p: 1, fontSize: '1rem' },
    content: { p: 1 },
    actions: { p: 1 },
  };
  const effectiveLightboxStyles = lightboxStyles || defaultLightboxStyles;

  const handleDeleteView = (viewName) => {
    setSavedViews(savedViews.filter((view) => view.name !== viewName));
    if (selectedView === viewName) {
      setSelectedView('');
      setFilterRules([]);
    }
  };

  const handleSelectView = (viewName) => {
    setSelectedView(viewName);
    const view = savedViews.find((v) => v.name === viewName);
    if (view) {
      setFilterRules(view.filterRules || []);
    } else {
      setFilterRules([]);
    }
    onClose();
  };

  const handleSaveView = () => {
    if (!viewName.trim()) {
      setNameError('View name is required');
      return;
    }
    if (savedViews.some((view) => view.name.toLowerCase() === viewName.trim().toLowerCase())) {
      setNameError('View name already exists');
      return;
    }
    if (filterRules.length === 0) {
      setNameError('At least one filter rule is required');
      return;
    }
    setSavedViews([...savedViews, { name: viewName.trim(), filterRules }]);
    setSelectedView(viewName.trim());
    setViewName('');
    setNameError('');
    setOpenSaveDialog(false);
  };

  const handleSaveDialogClose = () => {
    setViewName('');
    setNameError('');
    setOpenSaveDialog(false);
  };

  const handleClearCurrentView = () => {
    setFilterRules([]);
    setSelectedView('');
    onClose();
  };

  return (
    <LayoutLightbox
      open={open}
      onClose={(event, reason) => {
        console.log('SavedViews onClose triggered', { event, reason });
        onClose(event, reason);
      }}
    >
      <DialogTitle sx={effectiveLightboxStyles.title}>Saved Views</DialogTitle>
      <DialogContent sx={effectiveLightboxStyles.content}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SaveIcon />}
            onClick={() => setOpenSaveDialog(true)}
            disabled={filterRules.length === 0}
          >
            Save View
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleClearCurrentView}
            disabled={filterRules.length === 0}
          >
            Clear current view
          </Button>
        </Box>
        <List>
          {savedViews.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              No saved views. Click "Save View" to create one.
            </Typography>
          ) : (
            savedViews.map((view) => (
              <ListItem
                key={view.name}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteView(view.name)}
                    sx={{
                      '&:hover': {
                        bgcolor: 'error.light',
                        transform: 'scale(1.1)',
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemButton
                  selected={selectedView === view.name}
                  onClick={() => handleSelectView(view.name)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'primary.light',
                      cursor: 'pointer',
                      transform: 'scale(1.02)',
                      transition: 'all 0.2s ease-in-out',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                >
                  <ListItemText primary={view.name} />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </DialogContent>
      <DialogActions sx={effectiveLightboxStyles.actions}>
        <Button size="small" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
      <LayoutLightbox
        open={openSaveDialog}
        onClose={(event, reason) => {
          console.log('SaveViewDialog onClose triggered', { event, reason });
          handleSaveDialogClose();
        }}
      >
        <DialogTitle sx={effectiveLightboxStyles.title}>Save New View</DialogTitle>
        <DialogContent sx={effectiveLightboxStyles.content}>
          <TextField
            autoFocus
            margin="dense"
            label="View Name"
            value={viewName}
            onChange={(e) => {
              setViewName(e.target.value);
              setNameError('');
            }}
            error={!!nameError}
            helperText={nameError}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions sx={effectiveLightboxStyles.actions}>
          <Button size="small" onClick={handleSaveDialogClose}>
            Cancel
          </Button>
          <Button size="small" onClick={handleSaveView} disabled={!viewName.trim()}>
            Save
          </Button>
        </DialogActions>
      </LayoutLightbox>
    </LayoutLightbox>
  );
};

export default SavedViews;