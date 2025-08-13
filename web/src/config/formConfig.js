// web/src/config/formConfig.js
const formFields = {
  general: [
    { name: 'client_name', label: 'Client Name', type: 'text', grid: { xs: 12, sm: 6 } },
    { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], grid: { xs: 12, sm: 6 } },
    { name: 'incorporation_date', label: 'Incorporation Date', type: 'date', grid: { xs: 12, sm: 6 } },
  ],
};

export default formFields;