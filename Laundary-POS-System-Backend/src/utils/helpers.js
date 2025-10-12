const moment = require('moment');

// Format date for display
const formatDate = (date, format = 'YYYY-MM-DD') => {
  return moment(date).format(format);
};

// Format currency
const formatCurrency = (amount, currency = 'LKR') => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR'
  }).format(amount);
};

// Generate random string
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  return moment().diff(moment(dateOfBirth), 'years');
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

// Generate order number
const generateOrderNumber = (prefix = 'FL') => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${prefix}${year}${month}${day}${random}`;
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Pagination helper
const getPagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

// Sort helper
const getSortOptions = (sortBy, sortOrder = 'desc') => {
  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sortOptions.createdAt = -1; // Default sort by creation date
  }
  return sortOptions;
};

// Search helper for text fields
const getSearchQuery = (searchTerm, searchFields) => {
  if (!searchTerm || !searchFields.length) return {};
  
  return {
    $or: searchFields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
};

// Date range helper
const getDateRangeQuery = (startDate, endDate, field = 'createdAt') => {
  const query = {};
  
  if (startDate || endDate) {
    query[field] = {};
    if (startDate) {
      query[field].$gte = new Date(startDate);
    }
    if (endDate) {
      query[field].$lte = new Date(endDate);
    }
  }
  
  return query;
};

// Calculate loyalty points
const calculateLoyaltyPoints = (amount, pointsPerRupee = 1) => {
  return Math.floor(amount / pointsPerRupee);
};

// Check if user has permission
const hasPermission = (user, permission) => {
  return user.role === 'admin' || user.permissions.includes(permission);
};

// Generate QR code data for order
const generateQRCodeData = (order) => {
  return {
    orderId: order.orderId,
    customerName: order.customer.fullName,
    totalAmount: order.totalAmount,
    status: order.orderStatus,
    createdAt: order.createdAt
  };
};

module.exports = {
  formatDate,
  formatCurrency,
  generateRandomString,
  calculateAge,
  isValidEmail,
  isValidPhoneNumber,
  generateOrderNumber,
  calculateDistance,
  getPagination,
  getSortOptions,
  getSearchQuery,
  getDateRangeQuery,
  calculateLoyaltyPoints,
  hasPermission,
  generateQRCodeData
};
