// src/components/TopBar.jsx
import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, TextField, IconButton, Box } from '@mui/material';
import { Search as SearchIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const TopBar = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    console.log('Search query:', event.target.value);
  };

  return (
    <AppBar
      position="fixed"
      className="glass-effect"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: '100vw',
        border: 'none',
        overflowX: 'hidden',
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 2 }, minHeight: 64 }}>
        <Typography
          variant="h6"
          noWrap
          component={Link}
          to="/dashboard"
          sx={{
            flexGrow: { xs: 0, sm: 1 },
            display: { xs: 'none', sm: 'block' },
            color: 'inherit',
            textDecoration: 'none',
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          MyDashboard
        </Typography>
        <Box sx={{ width: { xs: '100%', sm: '40vw', md: '30vw' }, maxWidth: 400, mx: { xs: 1, sm: 2 } }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search..."
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-box"
            InputProps={{
              startAdornment: <SearchIcon />,
            }}
          />
        </Box>
        <IconButton color="inherit">
          <MoreVertIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;