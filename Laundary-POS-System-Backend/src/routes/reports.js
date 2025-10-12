const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getRevenueReport,
  getOrderStatusReport,
  getCustomerReport,
  getServiceReport,
  exportRevenueToExcel,
  exportOrderStatusToExcel,
  exportCustomerToExcel,
  exportServiceToExcel
} = require('../controllers/reportController');

const { authenticateToken } = require('../middleware/auth');
const { canViewReports } = require('../middleware/roleCheck');

// All routes require authentication
router.use(authenticateToken);

// GET /api/reports/dashboard - Get dashboard statistics
router.get('/dashboard', canViewReports, getDashboardStats);

// GET /api/reports/revenue - Get revenue report
router.get('/revenue', canViewReports, getRevenueReport);

// GET /api/reports/order-status - Get order status report
router.get('/order-status', canViewReports, getOrderStatusReport);

// GET /api/reports/customers - Get customer report
router.get('/customers', canViewReports, getCustomerReport);

// GET /api/reports/services - Get service report
router.get('/services', canViewReports, getServiceReport);

// Excel Export Routes
// GET /api/reports/export/revenue - Export revenue report to Excel
router.get('/export/revenue', canViewReports, exportRevenueToExcel);

// GET /api/reports/export/order-status - Export order status report to Excel
router.get('/export/order-status', canViewReports, exportOrderStatusToExcel);

// GET /api/reports/export/customers - Export customer report to Excel
router.get('/export/customers', canViewReports, exportCustomerToExcel);

// GET /api/reports/export/services - Export service report to Excel
router.get('/export/services', canViewReports, exportServiceToExcel);

module.exports = router;
