const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff
} = require('../controllers/staffController');

/**
 * Staff Routes - Admin-only access control
 * Simple CRUD operations for staff management
 * Features: Create, Read, Update, Delete staff members
 */

// Apply authentication middleware to all routes
router.use(authenticateToken);

// All staff routes require admin access
router.use(requireAdmin);

// Get all staff members with filtering and pagination (Admin only)
router.get('/', getAllStaff);

// Get staff member by ID (Admin only)
router.get('/:id', getStaffById);

// Create new staff member (Admin only)
router.post('/', createStaff);

// Update staff member (Admin only)
router.put('/:id', updateStaff);

// Delete staff member - Hard delete (Admin only)
router.delete('/:id', deleteStaff);

module.exports = router;
