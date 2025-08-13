// web/src/components/TableLightbox.jsx
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
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import LayoutLightbox from './Layout_Lightbox';
import { useSnackbar } from '../context/SnackbarContext';
import { countries } from '../data/countries';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const TableLightbox = ({
  open = false,
  onClose = () => {},
  data = null,
  columnsConfig = [],
  mode = 'view',
  onSave = () => {},
  onEdit = () => {},
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [currentData, setCurrentData] = useState(data);
  const { showSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);

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

  const isUS = currentData.address_country === 'United States of America';
  const roleOptions = columnsConfig.find(col => col.field === 'role')?.valueOptions || [];
  const statusOptions = columnsConfig.find(col => col.field === 'status')?.valueOptions || [];

  return (
    <LayoutLightbox
      open={open}
      onClose={onClose}
      PaperProps={{
        style: { minWidth: '600px', maxWidth: '800px', maxHeight: '80vh' },
      }}
    >
      <DialogTitle>
        {currentMode === 'view' ? 'View Client Details' : 'Edit Client Details'}
      </DialogTitle>
      <DialogContent sx={{ overflowY: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
        {currentMode === 'view' && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button size="small" startIcon={<Edit />} onClick={onEdit} sx={{ mr: 1 }}>
              Edit
            </Button>
            <Button size="small" onClick={onClose}>
              Close
            </Button>
          </Box>
        )}
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
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered>
          <Tab label="General" />
          <Tab label="Address" />
          <Tab label="Contact" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            General Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Client Name</Typography>
                  <Typography variant="body1">{currentData.client_name || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Client Name"
                  fullWidth
                  value={currentData.client_name || ''}
                  onChange={(e) => handleFieldChange('client_name', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Status</Typography>
                  <Typography variant="body1">{currentData.status || 'N/A'}</Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={currentData.status || ''}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                  >
                    {statusOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Incorporation Date</Typography>
                  <Typography variant="body1">{currentData.incorporation_date || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Incorporation Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={currentData.incorporation_date || ''}
                  onChange={(e) => handleFieldChange('incorporation_date', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Company Form</Typography>
                  <Typography variant="body1">{currentData.company_form || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Company Form"
                  fullWidth
                  value={currentData.company_form || ''}
                  onChange={(e) => handleFieldChange('company_form', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Industry</Typography>
                  <Typography variant="body1">{currentData.industry || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Industry"
                  fullWidth
                  value={currentData.industry || ''}
                  onChange={(e) => handleFieldChange('industry', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Business Purpose</Typography>
                  <Typography variant="body1">{currentData.business_purpose || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Business Purpose"
                  fullWidth
                  value={currentData.business_purpose || ''}
                  onChange={(e) => handleFieldChange('business_purpose', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Number of Employees</Typography>
                  <Typography variant="body1">{currentData.num_employees || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Number of Employees"
                  fullWidth
                  value={currentData.num_employees || ''}
                  onChange={(e) => handleFieldChange('num_employees', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Annual Revenue</Typography>
                  <Typography variant="body1">{currentData.annual_revenue || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Annual Revenue"
                  fullWidth
                  value={currentData.annual_revenue || ''}
                  onChange={(e) => handleFieldChange('annual_revenue', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Home Country</Typography>
                  <Typography variant="body1">{currentData.home_country || 'N/A'}</Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel shrink>Home Country</InputLabel>
                  <Select
                    value={currentData.home_country || ''}
                    label="Home Country"
                    onChange={(e) => handleFieldChange('home_country', e.target.value)}
                    notched
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Remarks</Typography>
                  <Typography variant="body1">{currentData.remarks || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Remarks"
                  fullWidth
                  multiline
                  value={currentData.remarks || ''}
                  onChange={(e) => handleFieldChange('remarks', e.target.value)}
                />
              )}
            </Grid>
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Address Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Street Address</Typography>
                  <Typography variant="body1">{currentData.address_street || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Street Address"
                  fullWidth
                  value={currentData.address_street || ''}
                  onChange={(e) => handleFieldChange('address_street', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Postal Code</Typography>
                  <Typography variant="body1">{currentData.address_postal_code || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Postal Code"
                  fullWidth
                  value={currentData.address_postal_code || ''}
                  onChange={(e) => handleFieldChange('address_postal_code', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Locality</Typography>
                  <Typography variant="body1">{currentData.address_locality || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Locality"
                  fullWidth
                  value={currentData.address_locality || ''}
                  onChange={(e) => handleFieldChange('address_locality', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Country</Typography>
                  <Typography variant="body1">{currentData.address_country || 'N/A'}</Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel shrink>Country</InputLabel>
                  <Select
                    value={currentData.address_country || ''}
                    label="Country"
                    onChange={(e) => handleFieldChange('address_country', e.target.value)}
                    notched
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            {isUS && (
              <Grid item xs={12}>
                {currentMode === 'view' ? (
                  <Box>
                    <Typography variant="subtitle2">State</Typography>
                    <Typography variant="body1">{currentData.address_region || 'N/A'}</Typography>
                  </Box>
                ) : (
                  <FormControl fullWidth>
                    <InputLabel shrink>State</InputLabel>
                    <Select
                      value={currentData.address_region || ''}
                      label="State"
                      onChange={(e) => handleFieldChange('address_region', e.target.value)}
                      notched
                    >
                      {usStates.map((state) => (
                        <MenuItem key={state} value={state}>
                          {state}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
            )}
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Contact Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Managing Director</Typography>
                  <Typography variant="body1">{currentData.managing_director || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Managing Director"
                  fullWidth
                  value={currentData.managing_director || ''}
                  onChange={(e) => handleFieldChange('managing_director', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography variant="body1">{currentData.phone || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Phone"
                  fullWidth
                  value={currentData.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Fax</Typography>
                  <Typography variant="body1">{currentData.fax || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Fax"
                  fullWidth
                  value={currentData.fax || ''}
                  onChange={(e) => handleFieldChange('fax', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography variant="body1">{currentData.email || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={currentData.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Website</Typography>
                  <Typography variant="body1">{currentData.website || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Website"
                  fullWidth
                  value={currentData.website || ''}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                />
              )}
            </Grid>
          </Grid>
        </TabPanel>
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
          <>
            <Button size="small" startIcon={<Edit />} onClick={onEdit} sx={{ mr: 1 }}>
              Edit
            </Button>
            <Button size="small" onClick={onClose}>
              Close
            </Button>
          </>
        )}
      </DialogActions>
    </LayoutLightbox>
  );
};

export default TableLightbox;