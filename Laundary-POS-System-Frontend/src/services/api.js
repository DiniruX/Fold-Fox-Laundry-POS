import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { token } = response.data;
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  checkEmail: (email) => api.post('/auth/check-email', { email }),
};

// Users API methods
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
  toggleStatus: (id) => api.put(`/users/${id}/toggle-status`),
  getStats: () => api.get('/users/stats'),
};

// Customers API methods
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  getByPhone: (phoneNumber) => api.get(`/customers/phone/${phoneNumber}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getOrderHistory: (id, params) => api.get(`/customers/${id}/orders`, { params }),
  getAnalytics: (id, params) => api.get(`/customers/${id}/analytics`, { params }),
  updateLoyaltyPoints: (id, data) => api.put(`/customers/${id}/loyalty-points`, data),
  bulkUpdate: (data) => api.put('/customers/bulk-update', data),
  getStats: () => api.get('/customers/stats'),
  search: (params) => api.get('/customers/search', { params }),
  // Public endpoint - no auth required
  registerFromLanding: (data) => axios.post(`${API_BASE_URL}/customers/register-from-landing`, data),
  // Get customer discount info
  getDiscountInfo: (id) => api.get(`/customers/${id}/discount-info`),
};

// Orders API methods
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  confirmItems: (id, data) => api.put(`/orders/${id}/confirm-items`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  addPayment: (id, data) => api.post(`/orders/${id}/payments`, data),
  sendBankDetails: (id, data) => api.post(`/orders/${id}/send-bank-details`, data),
  sendReceipt: (id, data) => api.post(`/orders/${id}/send-receipt`, data),
  getAnalytics: (params) => api.get('/orders/analytics', { params }),
  bulkUpdate: (data) => api.post('/orders/bulk-update', data),
  getByCustomer: (customerId, params) => api.get(`/orders/customer/${customerId}`, { params }),
  generateReceipt: (id) => api.get(`/orders/${id}/receipt`),
};

// Services API methods
export const servicesAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  getStatuses: () => api.get('/services/statuses'),
  toggleStatus: (id, data) => api.patch(`/services/${id}/toggle-status`, data),
  getAnalytics: (id, params) => api.get(`/services/${id}/analytics`, { params }),
  bulkUpdate: (data) => api.put('/services/bulk-update', data),
  getStats: () => api.get('/services/stats'),
  search: (params) => api.get('/services/search', { params }),
  duplicate: (id, data) => api.post(`/services/${id}/duplicate`, data),
  calculatePrice: (id, data) => api.post(`/services/${id}/calculate-price`, data),
};

// Clothing Categories API methods (built-in + custom)
export const clothingCategoriesAPI = {
  getAll: () => api.get('/clothing-categories'),
  create: (data) => api.post('/clothing-categories', data),
  delete: (key) => api.delete(`/clothing-categories/${key}`),
};

// Staff API methods
export const staffAPI = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  updateStatus: (id, data) => api.put(`/staff/${id}/status`, data),
  updateAttendance: (id, data) => api.put(`/staff/${id}/attendance`, data),
  addSkill: (id, data) => api.post(`/staff/${id}/skills`, data),
  addTraining: (id, data) => api.post(`/staff/${id}/training`, data),
  bulkUpdate: (data) => api.put('/staff/bulk-update', data),
  getStats: () => api.get('/staff/stats'),
  search: (params) => api.get('/staff/search', { params }),
  getAnalytics: (id) => api.get(`/staff/${id}/analytics`),
  delete: (id) => api.delete(`/staff/${id}`),
};

// Reports API methods
export const reportsAPI = {
  getDashboardStats: () => api.get('/reports/dashboard'),
  getRevenue: (params) => api.get('/reports/revenue', { params }),
  getOrderStatus: (params) => api.get('/reports/order-status', { params }),
  getCustomer: (params) => api.get('/reports/customers', { params }),
  getService: (params) => api.get('/reports/services', { params }),
};

export default api;
