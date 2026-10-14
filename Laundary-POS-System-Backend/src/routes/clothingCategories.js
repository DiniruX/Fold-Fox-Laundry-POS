const express = require('express');
const router = express.Router();

const {
  getClothingCategories,
  createClothingCategory,
  deleteClothingCategory
} = require('../controllers/clothingCategoryController');

const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireCashierOrAdmin } = require('../middleware/roleCheck');

/**
 * Clothing Category Routes
 * Admin: add/delete custom categories
 * Cashier: read-only (needed to build orders)
 */

router.use(authenticateToken);

// Get built-in + custom categories (Admin & Cashier)
router.get('/', requireCashierOrAdmin, getClothingCategories);

// Add a custom category (Admin only)
router.post('/', requireAdmin, createClothingCategory);

// Delete a custom category (Admin only)
router.delete('/:key', requireAdmin, deleteClothingCategory);

module.exports = router;
