// src/components/TableLightbox.jsx
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
import LayoutLightbox from './Layout_Lightbox.jsx';
import { useSnackbar } from '../context/SnackbarContext';
import { countries } from '../constants/countries';

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

  const isUS = currentData.country === 'United States of America (the)';

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
        {currentMode === 'view' ? 'View Details' : 'Edit Details'}
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
          <Tab label="Login" />
          <Tab label="Personal" />
          <Tab label="Payroll" />
          <Tab label="Bank" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Login Profile
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Display Name</Typography>
                  <Typography variant="body1">{currentData.name || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Display Name"
                  fullWidth
                  value={currentData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
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
                  <Typography variant="subtitle2">Username</Typography>
                  <Typography variant="body1">{currentData.username || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Username"
                  fullWidth
                  value={currentData.username || ''}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Role</Typography>
                  <Typography variant="body1">{currentData.role || 'N/A'}</Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={currentData.role || ''}
                    onChange={(e) => handleFieldChange('role', e.target.value)}
                  >
                    {roleOptions.map((opt) => (
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
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">First Name</Typography>
                  <Typography variant="body1">{currentData.first_name || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="First Name"
                  fullWidth
                  value={currentData.first_name || ''}
                  onChange={(e) => handleFieldChange('first_name', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Last Name</Typography>
                  <Typography variant="body1">{currentData.last_name || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Last Name"
                  fullWidth
                  value={currentData.last_name || ''}
                  onChange={(e) => handleFieldChange('last_name', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Academic Title</Typography>
                  <Typography variant="body1">{currentData.academic_title || 'N/A'}</Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel shrink>Academic Title</InputLabel>
                  <Select
                    value={currentData.academic_title || ''}
                    label="Academic Title"
                    onChange={(e) => handleFieldChange('academic_title', e.target.value)}
                    notched
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="Dr.">Dr.</MenuItem>
                    <MenuItem value="Prof.">Prof.</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Salutation</Typography>
                  <Typography variant="body1">{currentData.salutation || 'N/A'}</Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel shrink>Salutation</InputLabel>
                  <Select
                    value={currentData.salutation || ''}
                    label="Salutation"
                    onChange={(e) => handleFieldChange('salutation', e.target.value)}
                    notched
                  >
                    <MenuItem value="Mr.">Mr.</MenuItem>
                    <MenuItem value="Ms.">Ms.</MenuItem>
                    <MenuItem value="Mrs.">Mrs.</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Gender</Typography>
                  <Typography variant="body1">{currentData.gender || 'N/A'}</Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel shrink>Gender</InputLabel>
                  <Select
                    value={currentData.gender || ''}
                    label="Gender"
                    onChange={(e) => handleFieldChange('gender', e.target.value)}
                    notched
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Non-binary">Non-binary</MenuItem>
                    <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Street 1</Typography>
                  <Typography variant="body1">{currentData.street1 || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Street 1"
                  fullWidth
                  value={currentData.street1 || ''}
                  onChange={(e) => handleFieldChange('street1', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Street 2</Typography>
                  <Typography variant="body1">{currentData.street2 || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Street 2"
                  fullWidth
                  value={currentData.street2 || ''}
                  onChange={(e) => handleFieldChange('street2', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">ZIP</Typography>
                  <Typography variant="body1">{currentData.zip || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="ZIP"
                  fullWidth
                  value={currentData.zip || ''}
                  onChange={(e) => handleFieldChange('zip', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">City</Typography>
                  <Typography variant="body1">{currentData.city || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="City"
                  fullWidth
                  value={currentData.city || ''}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">State</Typography>
                  <Typography variant="body1">{currentData.state || 'N/A'}</Typography>
                </Box>
              ) : isUS ? (
                <FormControl fullWidth>
                  <InputLabel shrink>State</InputLabel>
                  <Select
                    value={currentData.state || ''}
                    label="State"
                    onChange={(e) => handleFieldChange('state', e.target.value)}
                    notched
                  >
                    {usStates.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  label="State"
                  fullWidth
                  value={currentData.state || ''}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Country</Typography>
                  <Typography variant="body1">{currentData.country || 'N/A'}</Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel shrink>Country</InputLabel>
                  <Select
                    value={currentData.country || ''}
                    label="Country"
                    onChange={(e) => handleFieldChange('country', e.target.value)}
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
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Payroll Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Employment Start</Typography>
                  <Typography variant="body1">{currentData.employment_start || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Employment Start"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={currentData.employment_start || ''}
                  onChange={(e) => handleFieldChange('employment_start', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Employment End</Typography>
                  <Typography variant="body1">{currentData.employment_end || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Employment End"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={currentData.employment_end || ''}
                  onChange={(e) => handleFieldChange('employment_end', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Religion</Typography>
                  <Typography variant="body1">{currentData.religion || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Religion"
                  fullWidth
                  value={currentData.religion || ''}
                  onChange={(e) => handleFieldChange('religion', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Marital Status</Typography>
                  <Typography variant="body1">{currentData.marital_status || 'N/A'}</Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel shrink>Marital Status</InputLabel>
                  <Select
                    value={currentData.marital_status || ''}
                    label="Marital Status"
                    onChange={(e) => handleFieldChange('marital_status', e.target.value)}
                    notched
                  >
                    <MenuItem value="Single">Single</MenuItem>
                    <MenuItem value="Married">Married</MenuItem>
                    <MenuItem value="Divorced">Divorced</MenuItem>
                    <MenuItem value="Widowed">Widowed</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Education</Typography>
                  <Typography variant="body1">{currentData.education || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Education"
                  fullWidth
                  value={currentData.education || ''}
                  onChange={(e) => handleFieldChange('education', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Date of Birth</Typography>
                  <Typography variant="body1">{currentData.date_of_birth || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={currentData.date_of_birth || ''}
                  onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Place of Birth</Typography>
                  <Typography variant="body1">{currentData.place_of_birth || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Place of Birth"
                  fullWidth
                  value={currentData.place_of_birth || ''}
                  onChange={(e) => handleFieldChange('place_of_birth', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Country of Birth</Typography>
                  <Typography variant="body1">{currentData.country_of_birth || 'N/A'}</Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel shrink>Country of Birth</InputLabel>
                  <Select
                    value={currentData.country_of_birth || ''}
                    label="Country of Birth"
                    onChange={(e) => handleFieldChange('country_of_birth', e.target.value)}
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
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Birth Name</Typography>
                  <Typography variant="body1">{currentData.birth_name || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Birth Name"
                  fullWidth
                  value={currentData.birth_name || ''}
                  onChange={(e) => handleFieldChange('birth_name', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Citizenship</Typography>
                  <Typography variant="body1">{currentData.citizenship || 'N/A'}</Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel shrink>Citizenship</InputLabel>
                  <Select
                    value={currentData.citizenship || ''}
                    label="Citizenship"
                    onChange={(e) => handleFieldChange('citizenship', e.target.value)}
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
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Place of Residence</Typography>
                  <Typography variant="body1">{currentData.place_of_residence || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Place of Residence"
                  fullWidth
                  value={currentData.place_of_residence || ''}
                  onChange={(e) => handleFieldChange('place_of_residence', e.target.value)}
                />
              )}
            </Grid>
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Bank Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Bank Name</Typography>
                  <Typography variant="body1">{currentData.bank_name || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Bank Name"
                  fullWidth
                  value={currentData.bank_name || ''}
                  onChange={(e) => handleFieldChange('bank_name', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Bank Code No.</Typography>
                  <Typography variant="body1">{currentData.bank_code_no || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Bank Code No."
                  fullWidth
                  value={currentData.bank_code_no || ''}
                  onChange={(e) => handleFieldChange('bank_code_no', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">Bank Account No.</Typography>
                  <Typography variant="body1">{currentData.bank_account_no || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="Bank Account No."
                  fullWidth
                  value={currentData.bank_account_no || ''}
                  onChange={(e) => handleFieldChange('bank_account_no', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">IBAN</Typography>
                  <Typography variant="body1">{currentData.iban || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="IBAN"
                  fullWidth
                  value={currentData.iban || ''}
                  onChange={(e) => handleFieldChange('iban', e.target.value)}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {currentMode === 'view' ? (
                <Box>
                  <Typography variant="subtitle2">SWIFT/BIC</Typography>
                  <Typography variant="body1">{currentData.swift_bic || 'N/A'}</Typography>
                </Box>
              ) : (
                <TextField
                  label="SWIFT/BIC"
                  fullWidth
                  value={currentData.swift_bic || ''}
                  onChange={(e) => handleFieldChange('swift_bic', e.target.value)}
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