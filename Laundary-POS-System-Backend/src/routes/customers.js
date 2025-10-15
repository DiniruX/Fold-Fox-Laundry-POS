const express = require('express');
const router = express.Router();

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  getCustomerByPhone,
  updateCustomer,
  deleteCustomer,
  getCustomerOrderHistory,
  getCustomerAnalytics,
  updateLoyaltyPoints,
  bulkUpdateCustomers,
  getCustomerStats,
  searchCustomers,
  registerFromLanding,
  getCustomerDiscountInfo
} = require('../controllers/customerController');

const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireCashierOrAdmin, canViewCustomers, canManageCustomers, canUpdateCustomers, canDeleteCustomers } = require('../middleware/roleCheck');
const { validateCustomerCreate, validateCustomerUpdate } = require('../middleware/validation');

// Import new middlewares for high-traffic handling
const { registrationLimiter } = require('../middleware/rateLimitConfig');
const { validateRegistration } = require('../middleware/registrationValidation');

/**
 * Customer Routes - Role-based access control
 * Admin & Cashier: Full access to customer operations
 * Features: Advanced search, analytics, bulk operations, loyalty management
 */

// PUBLIC ROUTES (No authentication required)
// Landing page customer registration - with strict rate limiting and validation
router.post(
  '/register-from-landing', 
  registrationLimiter,      // Rate limit: 5 attempts per 15 min per IP
  validateRegistration,     // Validate and sanitize all inputs
  registerFromLanding
);

// All routes below require authentication
router.use(authenticateToken);

// Get customer statistics (Admin & Cashier)
router.get('/stats', requireCashierOrAdmin, getCustomerStats);

// Search customers (Admin & Cashier)
router.get('/search', requireCashierOrAdmin, searchCustomers);

// Get all customers with advanced filtering and pagination (Admin & Cashier)
router.get('/', requireCashierOrAdmin, getCustomers);

// Get customer by phone number (Admin & Cashier)
router.get('/phone/:phoneNumber', requireCashierOrAdmin, getCustomerByPhone);

// Get customer analytics and insights (Admin & Cashier)
router.get('/:id/analytics', requireCashierOrAdmin, getCustomerAnalytics);

// Get customer order history with detailed analytics (Admin & Cashier)
router.get('/:id/orders', requireCashierOrAdmin, getCustomerOrderHistory);

// Get customer discount information (Admin & Cashier)
router.get('/:id/discount-info', requireCashierOrAdmin, getCustomerDiscountInfo);

// Get customer by ID (Admin & Cashier)
router.get('/:id', requireCashierOrAdmin, getCustomerById);

// Create new customer (Admin & Cashier)
router.post('/', requireCashierOrAdmin, validateCustomerCreate, createCustomer);

// Update customer loyalty points (Admin & Cashier)
router.put('/:id/loyalty-points', requireCashierOrAdmin, updateLoyaltyPoints);

// Update customer (Admin & Cashier)
router.put('/:id', requireCashierOrAdmin, validateCustomerUpdate, updateCustomer);

// Bulk update customers (Admin only)
router.put('/bulk-update', requireAdmin, bulkUpdateCustomers);

// Delete customer (soft delete) (Admin & Cashier)
router.delete('/:id', requireCashierOrAdmin, deleteCustomer);

module.exports = router;
