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

const getOperators = (type) => {
  switch (type) {
    case 'date':
      return ['equals', 'greaterThan', 'lessThan'];
    case 'singleSelect':
      return ['equals', 'contains'];
    default:
      return ['equals', 'contains'];
  }
};

const TableFilterDialog = ({
  open = false,
  columnsConfig = [],
  filterRules = [],
  setFilterRules = () => {},
  onClose = () => {},
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
      setTempFilterRules(filterRules.map(rule => ({ ...rule, id: rule.id || Date.now() })));
    }
  }, [open, filterRules]);

  const addNewRule = () => {
    if (columnsConfig.length === 0) return;
    setTempFilterRules([
      ...tempFilterRules,
      { id: Date.now(), field: '', operator: '', value: '', type: 'string', logicalOperator: 'AND' },
    ]);
  };

  const handleFieldChange = (index, value) => {
    const selectedColumn = columnsConfig.find((col) => col.field === value);
    const type = selectedColumn?.type || 'string';
    const newRules = [...tempFilterRules];
    newRules[index].field = value;
    newRules[index].type = type;
    newRules[index].operator = '';
    newRules[index].value = '';
    setTempFilterRules(newRules);
  };

  const handleOperatorChange = (index, value) => {
    const newRules = [...tempFilterRules];
    newRules[index].operator = value;
    setTempFilterRules(newRules);
  };

  const handleValueChange = (index, value) => {
    const newRules = [...tempFilterRules];
    newRules[index].value = value;
    setTempFilterRules(newRules);
  };

  const handleLogicalChange = (index, value) => {
    const newRules = [...tempFilterRules];
    newRules[index].logicalOperator = value;
    setTempFilterRules(newRules);
  };

  const handleDeleteRule = (index) => {
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
    >
      <DialogTitle sx={effectiveLightboxStyles.title}>Add Filter Rules</DialogTitle>
      <DialogContent sx={effectiveLightboxStyles.content}>
        {tempFilterRules.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            No filter rules added. Add a rule to filter the table or apply to clear filters.
          </Typography>
        ) : (
          tempFilterRules.map((rule, index) => {
            const selectedColumn = columnsConfig.find((col) => col.field === rule.field);
            const operators = getOperators(rule.type);
            const isSelect = rule.type === 'singleSelect' && selectedColumn?.valueOptions;
            return (
              <Box key={rule.id} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ whiteSpace: 'nowrap' }}>Field</InputLabel>
                  <Select
                    value={rule.field || ''}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    label="Field"
                    sx={{ fontSize: '0.75rem', height: '30px', p: 0.5 }}
                  >
                    {columnsConfig
                      .filter((col) => col.field !== 'actions')
                      .map((col) => (
                        <MenuItem key={col.field} value={col.field}>
                          {col.headerName}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ whiteSpace: 'nowrap' }}>Operator</InputLabel>
                  <Select
                    value={rule.operator || ''}
                    onChange={(e) => handleOperatorChange(index, e.target.value)}
                    label="Operator"
                    disabled={!rule.field}
                    sx={{ fontSize: '0.75rem', height: '30px', p: 0.5 }}
                  >
                    {operators.map((op) => (
                      <MenuItem key={op} value={op}>
                        {op.charAt(0).toUpperCase() + op.slice(1).replace(/([A-Z])/g, ' $1')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {isSelect ? (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ whiteSpace: 'nowrap' }}>Value</InputLabel>
                    <Select
                      value={rule.value || ''}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      label="Value"
                      disabled={!rule.operator}
                      sx={{ fontSize: '0.75rem', height: '30px', p: 0.5 }}
                    >
                      {selectedColumn.valueOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    size="small"
                    label="Value"
                    value={rule.value || ''}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    disabled={!rule.operator}
                    sx={{ minWidth: 120 }}
                  />
                )}
                {index > 0 && (
                  <FormControl size="small" sx={{ minWidth: 90 }}>
                    <InputLabel sx={{ whiteSpace: 'nowrap' }}>Logic</InputLabel>
                    <Select
                      value={rule.logicalOperator || 'AND'}
                      onChange={(e) => handleLogicalChange(index, e.target.value)}
                      label="Logic"
                      sx={{ fontSize: '0.75rem', height: '30px', p: 0.5 }}
                    >
                      <MenuItem value="AND">AND</MenuItem>
                      <MenuItem value="OR">OR</MenuItem>
                    </Select>
                  </FormControl>
                )}
                <IconButton size="small" onClick={() => handleDeleteRule(index)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            );
          })
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
          disabled={tempFilterRules.length > 0 && tempFilterRules.some((rule) => !rule.value?.toString().trim())}
        >
          Apply Filters
        </Button>
      </DialogActions>
    </LayoutLightbox>
  );
};

export const applyFilterRules = (data, rules, searchFilter = () => true) => {
  const validRules = rules.filter((rule) => rule.field && rule.operator && rule.value.toString().trim());
  if (validRules.length === 0) {
    return data.filter(searchFilter);
  }
  return data.filter((item) => {
    const filteredByRules = validRules.reduce((acc, rule, index) => {
      let itemValue = item[rule.field];
      let filterValue = rule.value;
      if (rule.type === 'date') {
        itemValue = itemValue ? new Date(itemValue) : null;
        filterValue = new Date(filterValue);
      } else {
        itemValue = Array.isArray(itemValue) ? itemValue.map(v => String(v).toLowerCase()) : String(itemValue || '').toLowerCase();
        filterValue = String(filterValue).toLowerCase();
      }
      let isValid = false;
      switch (rule.operator) {
        case 'equals':
          isValid = Array.isArray(itemValue) ? itemValue.includes(filterValue) : itemValue === filterValue;
          break;
        case 'contains':
          isValid = Array.isArray(itemValue) ? itemValue.some(v => v.includes(filterValue)) : itemValue.includes(filterValue);
          break;
        case 'greaterThan':
          isValid = itemValue > filterValue;
          break;
        case 'lessThan':
          isValid = itemValue < filterValue;
          break;
        default:
          isValid = true;
      }
      if (index === 0) {
        return isValid;
      }
      const logOp = rule.logicalOperator || 'AND';
      return logOp === 'AND' ? acc && isValid : acc || isValid;
    }, true);
    return filteredByRules && searchFilter(item);
  });
};

export default TableFilterDialog;