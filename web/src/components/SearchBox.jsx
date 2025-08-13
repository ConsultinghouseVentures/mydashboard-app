// web/src/components/SearchBox.jsx
import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';

const SearchBox = ({ value, onChange, onClear }) => {
  const handleClear = () => {
    onClear('');
  };

  return (
    <TextField
      variant="outlined"
      placeholder="Filter by Name or Status..."
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        endAdornment: value && (
          <InputAdornment position="end">
            <IconButton
              aria-label="clear search"
              onClick={handleClear}
              edge="end"
              size="small"
              sx={{ color: 'gray' }}
            >
              <CloseIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{ minWidth: 250, boxSizing: 'border-box' }}
    />
  );
};

export default SearchBox;