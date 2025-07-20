// src/components/ClientsDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Edit, Save } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';

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

const ClientsDetail = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }
      try {
        console.log('Fetching client for UID:', uid);
        setLoading(true);
        const response = await api.get(`/api/clients/${uid}`, { headers: { Authorization: `Bearer ${token}` } });
        setClient(response);
      } catch (err) {
        console.error('Fetch client error:', err);
        console.log('Error response:', err.response ? err.response.data : err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        } else {
          showSnackbar('Failed to fetch client details', 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [uid, navigate, showSnackbar]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.put(`/api/clients/${uid}`, client, { headers: { Authorization: `Bearer ${token}` } });
      setClient(response);
      setEditMode(false);
      showSnackbar('Client updated successfully', 'success');
    } catch (err) {
      console.error('Update client error:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      } else {
        showSnackbar('Failed to update client', 'error');
      }
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setClient((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Client not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Client Details: {client.client_name}
        </Typography>
        <IconButton onClick={() => navigate('/clients')}>
          <ArrowBack />
        </IconButton>
      </Box>
      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered>
        <Tab label="General" />
        <Tab label="Address" />
        <Tab label="Bank" />
        <Tab label="Tax" />
        <Tab label="Other" />
      </Tabs>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {!editMode ? (
          <Button startIcon={<Edit />} onClick={() => setEditMode(true)}>
            Edit
          </Button>
        ) : (
          <Button startIcon={<Save />} color="primary" variant="contained" onClick={handleSave}>
            Save
          </Button>
        )}
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Client Name" fullWidth value={client.client_name || ''} onChange={handleChange('client_name')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={client.status || ''} onChange={handleChange('status')} disabled={!editMode}>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Client Status" fullWidth value={client.client_status || ''} onChange={handleChange('client_status')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Incorporation Date" type="date" fullWidth value={client.incorporation_date || ''} onChange={handleChange('incorporation_date')} disabled={!editMode} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Company Form" fullWidth value={client.company_form || ''} onChange={handleChange('company_form')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Industry" fullWidth value={client.industry || ''} onChange={handleChange('industry')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Business Purpose" fullWidth value={client.business_purpose || ''} onChange={handleChange('business_purpose')} disabled={!editMode} multiline />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Number of Employees" fullWidth value={client.num_employees || ''} onChange={handleChange('num_employees')} disabled={!editMode} type="number" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Annual Revenue" fullWidth value={client.annual_revenue || ''} onChange={handleChange('annual_revenue')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Home Country" fullWidth value={client.home_country || ''} onChange={handleChange('home_country')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Managing Director" fullWidth value={client.managing_director || ''} onChange={handleChange('managing_director')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Phone" fullWidth value={client.phone || ''} onChange={handleChange('phone')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Fax" fullWidth value={client.fax || ''} onChange={handleChange('fax')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" fullWidth value={client.email || ''} onChange={handleChange('email')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Website" fullWidth value={client.website || ''} onChange={handleChange('website')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks" fullWidth value={client.remarks || ''} onChange={handleChange('remarks')} disabled={!editMode} multiline />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Creation Date" type="date" fullWidth value={client.creation_date || ''} onChange={handleChange('creation_date')} disabled={!editMode} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Service Limited" fullWidth value={client.service_limited || ''} onChange={handleChange('service_limited')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nanonets" fullWidth value={client.nanonets || ''} onChange={handleChange('nanonets')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Account No" fullWidth value={client.account_no || ''} onChange={handleChange('account_no')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Internal CRM No" fullWidth value={client.internal_crm_no || ''} onChange={handleChange('internal_crm_no')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Internal Accounting No" fullWidth value={client.internal_accounting_no || ''} onChange={handleChange('internal_accounting_no')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Internal Payroll No" fullWidth value={client.internal_payroll_no || ''} onChange={handleChange('internal_payroll_no')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Internal Revenue Tax Account" fullWidth value={client.internal_revenue_tax_account || ''} onChange={handleChange('internal_revenue_tax_account')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Purchase Order No" fullWidth value={client.purchase_order_no || ''} onChange={handleChange('purchase_order_no')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Company Type" fullWidth value={client.company_type || ''} onChange={handleChange('company_type')} disabled={!editMode} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Street" fullWidth value={client.address_street || ''} onChange={handleChange('address_street')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Locality" fullWidth value={client.address_locality || ''} onChange={handleChange('address_locality')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Region" fullWidth value={client.address_region || ''} onChange={handleChange('address_region')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Postal Code" fullWidth value={client.address_postal_code || ''} onChange={handleChange('address_postal_code')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Country" fullWidth value={client.address_country || ''} onChange={handleChange('address_country')} disabled={!editMode} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Bank Name" fullWidth value={client.bank_name || ''} onChange={handleChange('bank_name')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Bank Code" fullWidth value={client.bank_code || ''} onChange={handleChange('bank_code')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Bank Account No" fullWidth value={client.bank_account_no || ''} onChange={handleChange('bank_account_no')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="IBAN" fullWidth value={client.iban || ''} onChange={handleChange('iban')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="SWIFT Code" fullWidth value={client.swift_code || ''} onChange={handleChange('swift_code')} disabled={!editMode} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Tax Authority" fullWidth value={client.tax_authority || ''} onChange={handleChange('tax_authority')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Tax Office Bank Name" fullWidth value={client.tax_office_bank_name || ''} onChange={handleChange('tax_office_bank_name')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Tax Office IBAN" fullWidth value={client.tax_office_iban || ''} onChange={handleChange('tax_office_iban')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Tax Office Bank SWIFT" fullWidth value={client.tax_office_bank_swift || ''} onChange={handleChange('tax_office_bank_swift')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Tax Office Bank Address" fullWidth value={client.tax_office_bank_address || ''} onChange={handleChange('tax_office_bank_address')} disabled={!editMode} multiline />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Tax Office Contact" fullWidth value={client.tax_office_contact || ''} onChange={handleChange('tax_office_contact')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Tax Office Contact Phone" fullWidth value={client.tax_office_contact_phone || ''} onChange={handleChange('tax_office_contact_phone')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Elster" fullWidth value={client.elster || ''} onChange={handleChange('elster')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Direct Debit SEPA" fullWidth value={client.direct_debit_sepa || ''} onChange={handleChange('direct_debit_sepa')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Fiscal Year Start Date" type="date" fullWidth value={client.fiscal_year_start_date || ''} onChange={handleChange('fiscal_year_start_date')} disabled={!editMode} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="VAT ID" fullWidth value={client.vat_id || ''} onChange={handleChange('vat_id')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Operations No" fullWidth value={client.operations_no || ''} onChange={handleChange('operations_no')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Tax No" fullWidth value={client.tax_no || ''} onChange={handleChange('tax_no')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Payroll Tax No" fullWidth value={client.payroll_tax_no || ''} onChange={handleChange('payroll_tax_no')} disabled={!editMode} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Register Authority" fullWidth value={client.register_authority || ''} onChange={handleChange('register_authority')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Register ID" fullWidth value={client.register_id || ''} onChange={handleChange('register_id')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Accident Insurance Name" fullWidth value={client.accident_insurance_name || ''} onChange={handleChange('accident_insurance_name')} disabled={!editMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Accident Insurance No" fullWidth value={client.accident_insurance_no || ''} onChange={handleChange('accident_insurance_no')} disabled={!editMode} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/clients')}>
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default ClientsDetail;