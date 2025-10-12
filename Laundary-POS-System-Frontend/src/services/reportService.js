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

// Export revenue report to Excel
export const exportRevenueToExcel = async (params = {}) => {
  try {
    const response = await api.get('/reports/export/revenue', {
      params,
      responseType: 'blob',
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'revenue-report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Export order status report to Excel
export const exportOrderStatusToExcel = async (params = {}) => {
  try {
    const response = await api.get('/reports/export/order-status', {
      params,
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'order-status-report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Export customer report to Excel
export const exportCustomerToExcel = async (params = {}) => {
  try {
    const response = await api.get('/reports/export/customers', {
      params,
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customer-report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Export service report to Excel
export const exportServiceToExcel = async (params = {}) => {
  try {
    const response = await api.get('/reports/export/services', {
      params,
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'service-report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw error.response?.data || error;
  }
};

