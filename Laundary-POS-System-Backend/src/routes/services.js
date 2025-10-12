const express = require('express');
const router = express.Router();

const {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceStatuses,
  toggleServiceStatus,
  getServiceAnalytics,
  bulkUpdateServices,
  getServiceStats,
  searchServices,
  duplicateService,
  calculateServicePrice
} = require('../controllers/serviceController');

const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireCashierOrAdmin } = require('../middleware/roleCheck');

/**
 * Service Routes - Role-based access control
 * Admin: Full access to all service operations
 * Cashier: Read-only access to services (can view but not modify)
 * Features: Advanced analytics, bulk operations, service performance tracking
 */

// All routes require authentication
router.use(authenticateToken);

// Get service statistics (Admin & Cashier)
router.get('/stats', requireCashierOrAdmin, getServiceStats);

// Search services (Admin & Cashier)
router.get('/search', requireCashierOrAdmin, searchServices);

// Get service statuses (Admin & Cashier)
router.get('/statuses', requireCashierOrAdmin, getServiceStatuses);

// Get all services with advanced filtering and pagination (Admin & Cashier)
router.get('/', requireCashierOrAdmin, getServices);

// Get service analytics and performance data (Admin & Cashier)
router.get('/:id/analytics', requireCashierOrAdmin, getServiceAnalytics);

// Calculate service price (Admin & Cashier)
router.post('/:id/calculate-price', requireCashierOrAdmin, calculateServicePrice);

// Duplicate service (Admin only)
router.post('/:id/duplicate', requireAdmin, duplicateService);

// Get service by ID (Admin & Cashier)
router.get('/:id', requireCashierOrAdmin, getServiceById);

// Create new service (Admin only)
router.post('/', requireAdmin, createService);

// Toggle service active status (Admin only)
router.patch('/:id/toggle-status', requireAdmin, toggleServiceStatus);

// Update service (Admin only)
router.put('/:id', requireAdmin, updateService);

// Bulk update services (Admin only)
router.put('/bulk-update', requireAdmin, bulkUpdateServices);

// Delete service (hard delete) (Admin only)
router.delete('/:id', requireAdmin, deleteService);

module.exports = router;
