import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Button, List, ListItem, ListItemText, Divider, TextField, Select, MenuItem, InputLabel, FormControl, Tabs, Tab } from '@mui/material';
import api from '../services/api';

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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ClientsDetail = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchClientDetail = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
      try {
        const response = await api.get(`/api/clients/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Client detail API response:', response.data);
        const data = response.data || {};
        // Ensure status is one of the valid options or fallback to empty string
        const validStatus = ['Active', 'Inactive'].includes(data.status) ? data.status : '';
        setClient(data);
        setFormData({ ...data, address_region: data.address_region || '', status: validStatus });
        setError(null);
      } catch (error) {
        console.error('Fetch client detail error:', {
          message: error.message,
          url: error.config?.url,
          response: error.response
            ? {
                status: error.response.status,
                data: error.response.data,
              }
            : 'No response data',
        });
        setError(error.response?.data?.message || 'Failed to fetch client details');
        if (error.response?.status === 401) {
          console.log('Unauthorized, redirecting to login');
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        }
      }
    };
    fetchClientDetail();
  }, [uid, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Ensure status is valid when changed
      ...(name === 'status' && !['Active', 'Inactive'].includes(value) ? { status: '' } : {}),
    }));
  };

  const handleSave = async () => {
    try {
      const response = await api.put(`/api/clients/${uid}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedData = response.data || {};
      setClient(updatedData);
      setFormData({ ...updatedData, address_region: updatedData.address_region || '' });
      setEditMode(false);
      setError(null);
    } catch (err) {
      console.error('Update client error:', err);
      setError('Failed to update client details');
    }
  };

  const handleCancel = () => {
    setFormData({ ...client, address_region: client.address_region || '' });
    setEditMode(false);
  };

  const handleScroll = (id) => {
    const element = document.getElementById(id);
    if (element && contentRef.current) {
      contentRef.current.scrollTo({
        top: element.offsetTop,
        behavior: 'smooth',
      });
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={() => navigate('/clients')}>
          Back to Clients
        </Button>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const sections = [
    { id: 'general', name: 'General' },
    { id: 'address', name: 'Address' },
    { id: 'bank', name: 'Bank' },
    { id: 'tax', name: 'Tax' },
    { id: 'insurance', name: 'Insurance' },
  ];

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'DE', name: 'Germany' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    // Add more as needed
  ];

  const addressConfigs = {
    US: {
      hasRegion: true,
      postalCodeLabel: 'ZIP Code',
      localityLabel: 'City',
      streetLabel: 'Street Address',
      required: ['address_street', 'address_locality', 'address_region', 'address_postal_code', 'address_country'],
    },
    DE: {
      hasRegion: false,
      postalCodeLabel: 'PLZ',
      localityLabel: 'City',
      streetLabel: 'Street and House Number',
      required: ['address_street', 'address_postal_code', 'address_locality', 'address_country'],
    },
    GB: {
      hasRegion: false,
      postalCodeLabel: 'Postcode',
      localityLabel: 'Town/City',
      streetLabel: 'Street Address',
      required: ['address_street', 'address_locality', 'address_postal_code', 'address_country'],
    },
    FR: {
      hasRegion: false,
      postalCodeLabel: 'Code Postal',
      localityLabel: 'Ville',
      streetLabel: 'Adresse',
      required: ['address_street', 'address_postal_code', 'address_locality', 'address_country'],
    },
    CA: {
      hasRegion: true,
      postalCodeLabel: 'Postal Code',
      localityLabel: 'City',
      streetLabel: 'Street Address',
      required: ['address_street', 'address_locality', 'address_region', 'address_postal_code', 'address_country'],
    },
    AU: {
      hasRegion: true,
      postalCodeLabel: 'Postcode',
      localityLabel: 'Suburb',
      streetLabel: 'Street Address',
      required: ['address_street', 'address_locality', 'address_region', 'address_postal_code', 'address_country'],
    },
    JP: {
      hasRegion: true,
      postalCodeLabel: 'Postal Code',
      localityLabel: 'City',
      streetLabel: 'Street Address',
      required: ['address_street', 'address_locality', 'address_region', 'address_postal_code', 'address_country'],
    },
    CN: {
      hasRegion: true,
      postalCodeLabel: 'Postal Code',
      localityLabel: 'City',
      streetLabel: 'Street Address',
      required: ['address_street', 'address_locality', 'address_region', 'address_postal_code', 'address_country'],
    },
    IN: {
      hasRegion: true,
      postalCodeLabel: 'PIN Code',
      localityLabel: 'City',
      streetLabel: 'Street Address',
      required: ['address_street', 'address_locality', 'address_region', 'address_postal_code', 'address_country'],
    },
    BR: {
      hasRegion: true,
      postalCodeLabel: 'CEP',
      localityLabel: 'City',
      streetLabel: 'Street Address',
      required: ['address_street', 'address_locality', 'address_region', 'address_postal_code', 'address_country'],
    },
    default: {
      hasRegion: false,
      postalCodeLabel: 'Postal Code',
      localityLabel: 'Locality',
      streetLabel: 'Street Address',
      required: ['address_street', 'address_postal_code', 'address_locality', 'address_country'],
    },
  };

  const currentCountry = formData.address_country || '';
  const config = addressConfigs[currentCountry] || addressConfigs.default;

  return (
    <Box sx={{ width: '100%', minWidth: '800px', position: 'relative', overflowX: 'auto', height: 'calc(100vh - 64px)' }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1200, backgroundColor: '#fff' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {!editMode && <Button variant="contained" onClick={() => navigate('/clients')}>
              Back to Clients
            </Button>}
            {editMode ? (
              <>
                <Button variant="contained" color="primary" onClick={handleSave}>
                  Save
                </Button>
                <Button variant="outlined" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="contained" color="primary" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            )}
          </Box>
          <Typography variant="h4" component="h1" sx={{ ml: 0, textAlign: 'left' }}>
            Client Details - {client.client_name || 'Unknown'}
          </Typography>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="client tabs" sx={{ mb: 2 }}>
            <Tab label="Information" />
            <Tab label="Shareholder" />
            <Tab label="Employees" />
            <Tab label="Active Services" />
            <Tab label="Invoices" />
            <Tab label="Documents" />
            <Tab label="Letters" />
          </Tabs>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 64px)' }}>
        <Box
          sx={{
            width: 300, // Increased width for consistency
            pr: 2,
            borderRight: 1,
            borderColor: 'divider',
            position: 'sticky',
            top: 64, // Below the sticky header (approx. 64px height)
            height: 'calc(100vh - 64px)',
            overflowY: 'hidden', // Prevent scrolling in side menu
            backgroundColor: '#fff',
            zIndex: 1000,
          }}
        >
          <List sx={{ pt: 0 }}>
            {sections.map((section) => (
              <ListItem key={section.id} button onClick={() => handleScroll(section.id)}>
                <ListItemText primary={section.name} />
              </ListItem>
            ))}
          </List>
        </Box>
        <Box ref={contentRef} sx={{ flexGrow: 1, pl: 3, overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
          <Box sx={{ position: 'relative', maxWidth: '600px' }}> {/* Reduced max width for consistency */}
            <TabPanel value={tabValue} index={0}>
              <Box id="general" sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  General
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={0}>
                  <Field label="Client Name" name="client_name" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Client Status" name="client_status" options={['Incorporated']} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Incorporation Date" name="incorporation_date" type="date" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Company Form" name="company_form" options={['GmbH']} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Industry" name="industry" options={['Business Products & Services']} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Business Purpose" name="business_purpose" multiline={true} rows={4} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="# Employees" name="num_employees" options={['5-25']} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Annual Revenue" name="annual_revenue" options={['€0 - €50.000']} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Home Country" name="home_country" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Managing Director" name="managing_director" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Phone" name="phone" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Fax" name="fax" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Email" name="email" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Website" name="website" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Remarks" name="remarks" multiline={true} rows={4} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Creation Date" name="creation_date" type="date" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Status" name="status" options={['Active', 'Inactive']} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Service Limited" name="service_limited" options={['No']} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="NanoNets" name="nanonets" options={['Enabled']} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Account No." name="account_no" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Internal CRM No." name="internal_crm_no" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Internal Accounting No." name="internal_accounting_no" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Internal Payroll No." name="internal_payroll_no" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Internal Revenue Tax Account" name="internal_revenue_tax_account" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Purchase Order No." name="purchase_order_no" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Company Type" name="company_type" options={['Client']} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="ID" name="uid" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Created At" name="created_at" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Updated At" name="updated_at" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Created By" name="created_by" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                </Grid>
              </Box>
              <Box id="address" sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Address
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={0}>
                  <Field label={config.streetLabel || 'Street Address'} name="address_street" required={config.required.includes('address_street')} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label={config.localityLabel || 'Locality'} name="address_locality" required={config.required.includes('address_locality')} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  {config.hasRegion && (
                    <Field label="Region/State/Province" name="address_region" required={config.required.includes('address_region')} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  )}
                  <Field label={config.postalCodeLabel || 'Postal Code'} name="address_postal_code" required={config.required.includes('address_postal_code')} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      Country
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    {!editMode ? (
                      <Typography variant="body1">
                        {client.address_country || 'N/A'}
                      </Typography>
                    ) : (
                      <FormControl fullWidth required={config.required.includes('address_country')}>
                        <InputLabel>Country</InputLabel>
                        <Select
                          name="address_country"
                          value={formData.address_country || ''}
                          onChange={handleChange}
                        >
                          {countries.map((country) => (
                            <MenuItem key={country.code} value={country.code}>
                              {country.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                  {!editMode && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Formatted Address
                      </Typography>
                      <Typography variant="body1">
                        {client.address_street || ''}<br />
                        {client.address_locality || ''}{client.address_region ? `, ${client.address_region}` : ''}<br />
                        {client.address_postal_code || ''}<br />
                        {client.address_country || ''}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
              <Box id="bank" sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Bank
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={0}>
                  <Field label="Bank Name" name="bank_name" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Bank Code" name="bank_code" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Bank Account No." name="bank_account_no" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="IBAN" name="iban" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="SWIFT Code (BIC)" name="swift_code" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                </Grid>
              </Box>
              <Box id="tax" sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Tax
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={0}>
                  <Typography variant="subtitle1" gutterBottom>
                    Accounting Tax Office
                  </Typography>
                  <Field label="Tax Authority" name="tax_authority" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Bank Name" name="tax_office_bank_name" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="IBAN" name="tax_office_iban" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Bank SWIFT/BIC" name="tax_office_bank_swift" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Bank Address" name="tax_office_bank_address" multiline={true} rows={4} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Contact" name="tax_office_contact" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Contact's Phone" name="tax_office_contact_phone" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="ELSTER" name="elster" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Direct Debit (SEPA)" name="direct_debit_sepa" options={['Inactive']} editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Fiscal Year Start Date" name="fiscal_year_start_date" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="VAT ID" name="vat_id" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Operations No." name="operations_no" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Tax No." name="tax_no" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Payroll Tax No." name="payroll_tax_no" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Register Authority" name="register_authority" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Register ID" name="register_id" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                </Grid>
              </Box>
              <Box id="insurance" sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Insurance
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={0}>
                  <Field label="Accident Insurance Name" name="accident_insurance_name" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                  <Field label="Accident Insurance No." name="accident_insurance_no" editMode={editMode} formData={formData} client={client} handleChange={handleChange} />
                </Grid>
              </Box>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Shareholder
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {/* Add Shareholder content here if needed */}
              <Typography variant="body1">Shareholder details to be implemented.</Typography>
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Employees
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {/* Add Employees content here if needed */}
              <Typography variant="body1">Employees details to be implemented.</Typography>
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Active Services
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {/* Add Active Services content here if needed */}
              <Typography variant="body1">Active Services details to be implemented.</Typography>
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              <Typography variant="h6" gutterBottom>
                Invoices
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {/* Add Invoices content here if needed */}
              <Typography variant="body1">Invoices details to be implemented.</Typography>
            </TabPanel>
            <TabPanel value={tabValue} index={5}>
              <Typography variant="h6" gutterBottom>
                Documents
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {/* Add Documents content here if needed */}
              <Typography variant="body1">Documents details to be implemented.</Typography>
            </TabPanel>
            <TabPanel value={tabValue} index={6}>
              <Typography variant="h6" gutterBottom>
                Letters
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {/* Add Letters content here if needed */}
              <Typography variant="body1">Letters details to be implemented.</Typography>
            </TabPanel>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              {!editMode && <Button variant="contained" onClick={() => navigate('/clients')}>
                Back to Clients
              </Button>}
              {editMode ? (
                <>
                  <Button variant="contained" color="primary" onClick={handleSave}>
                    Save
                  </Button>
                  <Button variant="outlined" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="contained" color="primary" onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ClientsDetail;