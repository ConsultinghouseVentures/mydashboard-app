// src/components/MiniApps.jsx
import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';

const MiniApps = () => {
  const [selectedSection, setSelectedSection] = useState('app1');

  const handleSelect = (section) => {
    setSelectedSection(section);
  };

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
              selected={selectedSection === 'app1'}
              onClick={() => handleSelect('app1')}
            >
              <ListItemText primary="Mini App 1" />
            </ListItemButton>
          </ListItem>
          {/* Add more mini app sections here */}
        </List>
      </Box>
      <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
        {selectedSection ? (
          <Typography variant="h6">Selected: {selectedSection}</Typography>
        ) : (
          <Typography variant="h6">Select a mini app</Typography>
        )}
      </Box>
    </Box>
  );
};

export default MiniApps;