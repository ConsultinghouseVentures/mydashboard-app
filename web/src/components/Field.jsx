// src/components/Field.jsx
import React from 'react';
import { Grid, Typography, TextField, MenuItem } from '@mui/material';

const Field = ({ label, name, editMode, formData, client, handleChange, options, type = 'text', multiline = false, rows = 1, required = false }) => {
  return (
    <>
      <Grid item xs={4}>
        <Typography variant="subtitle2" gutterBottom>
          {label}{required ? ' *' : ''}
        </Typography>
      </Grid>
      <Grid item xs={8}>
        {!editMode ? (
          <Typography variant="body1">
            {client[name] || 'N/A'}
          </Typography>
        ) : (
          <TextField
            fullWidth
            label={label}
            name={name}
            value={formData[name] || ''}
            onChange={handleChange}
            type={type}
            multiline={multiline}
            rows={rows}
            required={required}
            select={!!options}
            spellCheck={false}
          >
            {options && options.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Grid>
    </>
  );
};

export default Field;