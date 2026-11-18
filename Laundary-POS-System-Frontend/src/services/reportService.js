import api from './api';

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/reports/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get revenue report
export const getRevenueReport = async (params = {}) => {
  try {
    const response = await api.get('/reports/revenue', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get order status report
export const getOrderStatusReport = async (params = {}) => {
  try {
    const response = await api.get('/reports/order-status', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get customer report
export const getCustomerReport = async (params = {}) => {
  try {
    const response = await api.get('/reports/customers', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get service report
export const getServiceReport = async (params = {}) => {
  try {
    const response = await api.get('/reports/services', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get income & expense report (admin only)
export const getIncomeExpenseReport = async (params = {}) => {
  try {
    const response = await api.get('/reports/income-expense', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Download a report file. `format` is 'xlsx' (default) or 'pdf'.
 */
const downloadReport = async (path, baseName, params = {}, format = 'xlsx') => {
  const isPdf = format === 'pdf';
  try {
    const response = await api.get(path, {
      params: { ...params, ...(isPdf ? { format: 'pdf' } : {}) },
      responseType: 'blob',
      timeout: 60000,
    });

    // Make sure we really got the format we asked for before saving a file
    // the user can't open (e.g. an old backend ignoring ?format=pdf).
    const contentType = String(response.headers?.['content-type'] || '');
    const head = await response.data.slice(0, 5).text();
    const looksLikePdf = head.startsWith('%PDF-');
    const looksLikeXlsx = head.startsWith('PK');
    if (isPdf && !looksLikePdf) {
      if (looksLikeXlsx || contentType.includes('spreadsheet')) {
        throw new Error('The server sent an Excel file instead of a PDF. Restart or redeploy the backend so it includes PDF export support.');
      }
      if (contentType.includes('json') || contentType.includes('html')) {
        let message = 'The server did not return a PDF';
        try { message = JSON.parse(await response.data.text()).message || message; } catch (e) { /* not json */ }
        throw new Error(message);
      }
      throw new Error('The server did not return a valid PDF file');
    }
    if (!isPdf && !looksLikeXlsx) {
      throw new Error('The server did not return a valid Excel file');
    }

    const blob = new Blob([response.data], {
      type: isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${baseName}.${isPdf ? 'pdf' : 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (!error.response && error instanceof Error) throw error;
    // Error bodies come back as blobs; surface the server message when there is one
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Failed to export report');
      } catch (parseError) {
        if (parseError.message && parseError.message !== 'Unexpected end of JSON input') throw parseError;
      }
    }
    throw error.response?.data || error;
  }
};

export const exportRevenueReport = (params = {}, format = 'xlsx') => downloadReport('/reports/export/revenue', 'revenue-report', params, format);
export const exportOrderStatusReport = (params = {}, format = 'xlsx') => downloadReport('/reports/export/order-status', 'order-status-report', params, format);
export const exportCustomerReport = (params = {}, format = 'xlsx') => downloadReport('/reports/export/customers', 'customer-report', params, format);
export const exportServiceReport = (params = {}, format = 'xlsx') => downloadReport('/reports/export/services', 'service-report', params, format);
export const exportIncomeExpenseReport = (params = {}, format = 'xlsx') => downloadReport('/reports/export/income-expense', 'income-expense-report', params, format);

// Backwards-compatible names
export const exportRevenueToExcel = (params) => exportRevenueReport(params, 'xlsx');
export const exportOrderStatusToExcel = (params) => exportOrderStatusReport(params, 'xlsx');
export const exportCustomerToExcel = (params) => exportCustomerReport(params, 'xlsx');
export const exportServiceToExcel = (params) => exportServiceReport(params, 'xlsx');
export const exportIncomeExpenseToExcel = (params) => exportIncomeExpenseReport(params, 'xlsx');
