const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, canManageUsers, canViewUsers, canUpdateUsers, canDeleteUsers } = require('../middleware/roleCheck');
const userController = require('../controllers/userController');

/**
 * User Routes - Role-based access control
 * Admin: Full access to all user operations
 * Cashier: Limited access (own profile only)
 */

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get current user profile (accessible by all authenticated users)
router.get('/profile/me', userController.getMyProfile);

// Get user statistics (Admin only)
router.get('/stats', requireAdmin, userController.getUserStats);

// Get all users with pagination and filtering (Admin only)
router.get('/', requireAdmin, canViewUsers, userController.getAllUsers);

// Search users (Admin only)
router.get('/search', requireAdmin, canViewUsers, userController.getAllUsers);

// Get user by ID (Admin: any user, Cashier: own profile only)
router.get('/:id', userController.getUserById);

// Create new user (Admin only)
router.post('/', requireAdmin, canManageUsers, userController.createUser);

// Update user (Admin: any user, Cashier: own profile only with limited fields)
router.put('/:id', userController.updateUser);

// Update user password (Admin: any user, Cashier: own password only)
router.put('/:id/password', userController.updatePassword);

// Toggle user active status (Admin only)
router.put('/:id/toggle-status', requireAdmin, canUpdateUsers, userController.toggleUserStatus);

// Delete user (Admin only)
router.delete('/:id', requireAdmin, canDeleteUsers, userController.deleteUser);

module.exports = router;
