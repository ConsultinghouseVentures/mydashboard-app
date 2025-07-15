// TableFilterDialog.jsx

import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import LayoutLightbox from './Layout_Lightbox.jsx';
import { LayoutContext } from './Layout_TableOverview.jsx';

const TableFilterDialog = ({
  open = false,
  anchorEl = null,
  columnsConfig = [],
  filterRules = [],
  setFilterRules = () => {},
  onClose = () => {},
  onFilterClick,
}) => {
  const [tempFilterRules, setTempFilterRules] = useState(filterRules || []);
  const { lightboxStyles } = useContext(LayoutContext) || {};
  const defaultLightboxStyles = {
    title: { p: 1, fontSize: '1rem' },
    content: { p: 1 },
    actions: { p: 1 },
  };
  const effectiveLightboxStyles = lightboxStyles || defaultLightboxStyles;

  useEffect(() => {
    if (open) {
      setTempFilterRules(filterRules || []);
    }
  }, [open, filterRules]);

  const addNewRule = () => {
    if (columnsConfig.length === 0) return;
    setTempFilterRules([
      ...tempFilterRules,
      { field: columnsConfig[0].field, operator: 'equals', value: '', logicalOperator: 'AND' },
    ]);
  };

  const updateRule = (index, field, operator, value, logicalOperator) => {
    const newRules = [...tempFilterRules];
    newRules[index] = { field, operator, value, logicalOperator };
    setTempFilterRules(newRules);
  };

  const removeRule = (index) => {
    const newRules = tempFilterRules.filter((_, i) => i !== index);
    setTempFilterRules(newRules);
  };

  const handleApplyFilters = () => {
    setFilterRules(tempFilterRules);
    onClose();
  };

  const handleCancel = () => {
    console.log('Cancel button clicked, calling onClose. Rules:', tempFilterRules);
    setTempFilterRules(filterRules || []);
    onClose();
  };

  return (
    <LayoutLightbox
      open={open}
      onClose={(event, reason) => {
        console.log('TableFilterDialog onClose triggered', { event, reason });
        onClose(event, reason);
      }}
      {...(onFilterClick ? { onClick: onFilterClick } : {})}
    >
      <DialogTitle sx={effectiveLightboxStyles.title}>Add Filter Rules</DialogTitle>
      <DialogContent sx={effectiveLightboxStyles.content}>
        {tempFilterRules.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            No filter rules added. Add a rule to filter the table or apply to clear filters.
          </Typography>
        ) : (
          tempFilterRules.map((rule, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ whiteSpace: 'nowrap' }}>Field</InputLabel>
                <Select
                  value={rule.field || ''}
                  onChange={(e) => updateRule(index, e.target.value, rule.operator, rule.value, rule.logicalOperator)}
                  label="Field"
                  sx={{ fontSize: '0.75rem', height: '30px', p: 0.5 }}
                >
                  {columnsConfig.map((col) => (
                    <MenuItem key={col.field} value={col.field}>{col.headerName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ whiteSpace: 'nowrap' }}>Operator</InputLabel>
                <Select
                  value={rule.operator || 'equals'}
                  onChange={(e) => updateRule(index, rule.field, e.target.value, rule.value, rule.logicalOperator)}
                  label="Operator"
                  sx={{ fontSize: '0.75rem', height: '30px', p: 0.5 }}
                >
                  <MenuItem value="equals">Equals</MenuItem>
                  <MenuItem value="contains">Contains</MenuItem>
                  <MenuItem value="greater than">Greater Than</MenuItem>
                  <MenuItem value="less than">Less Than</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Value"
                value={rule.value || ''}
                onChange={(e) => updateRule(index, rule.field, rule.operator, e.target.value, rule.logicalOperator)}
                sx={{ minWidth: 120 }}
              />
              {index > 0 && (
                <FormControl size="small" sx={{ minWidth: 90 }}>
                  <InputLabel sx={{ whiteSpace: 'nowrap' }}>Logic</InputLabel>
                  <Select
                    value={rule.logicalOperator || 'AND'}
                    onChange={(e) => updateRule(index, rule.field, rule.operator, rule.value, e.target.value)}
                    label="Logic"
                    sx={{ fontSize: '0.75rem', height: '30px', p: 0.5 }}
                  >
                    <MenuItem value="AND">AND</MenuItem>
                    <MenuItem value="OR">OR</MenuItem>
                  </Select>
                </FormControl>
              )}
              <IconButton size="small" onClick={() => removeRule(index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={addNewRule}
          startIcon={<AddIcon />}
          sx={{ mt: 1 }}
          disabled={columnsConfig.length === 0}
        >
          Add Rule
        </Button>
      </DialogContent>
      <DialogActions sx={effectiveLightboxStyles.actions}>
        <Button size="small" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          size="small"
          onClick={handleApplyFilters}
          disabled={tempFilterRules.length > 0 && tempFilterRules.some((rule) => !rule.value?.trim())}
        >
          Apply Filters
        </Button>
      </DialogActions>
    </LayoutLightbox>
  );
};

export const applyFilterRules = (data, rules, searchFilter = () => true) => {
  return data.filter((item) => {
    if (rules.length === 0) return searchFilter(item);

    const filteredByRules = rules.reduce((acc, rule, index) => {
      const value = item[rule.field];
      let isValid = false;
      switch (rule.operator) {
        case 'equals':
          isValid = value === rule.value;
          break;
        case 'contains':
          isValid = value?.toString().toLowerCase().includes(rule.value.toLowerCase());
          break;
        case 'greater than':
          isValid = new Date(value) > new Date(rule.value);
          break;
        case 'less than':
          isValid = new Date(value) < new Date(rule.value);
          break;
        default:
          isValid = true;
      }
      if (index === 0) {
        return isValid;
      }
      const logOp = rule.logicalOperator || 'AND';
      return logOp === 'AND' ? acc && isValid : acc || isValid;
    }, false);

    return filteredByRules && searchFilter(item);
  });
};

export default TableFilterDialog;