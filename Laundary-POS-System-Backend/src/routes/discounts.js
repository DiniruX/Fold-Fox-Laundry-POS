const express = require('express');
const router = express.Router();

const {
  getDiscounts,
  getActiveDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  toggleDiscountStatus,
  deleteDiscount
} = require('../controllers/discountController');

const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireCashierOrAdmin } = require('../middleware/roleCheck');

/**
 * Discount / Promotion Routes
 * Admin: full CRUD
 * Cashier: live offers only (shown while creating an order)
 */

router.use(authenticateToken);

router.get('/active', requireCashierOrAdmin, getActiveDiscounts);

router.get('/', requireAdmin, getDiscounts);
router.get('/:id', requireAdmin, getDiscount);
router.post('/', requireAdmin, createDiscount);
router.put('/:id', requireAdmin, updateDiscount);
router.patch('/:id/toggle-status', requireAdmin, toggleDiscountStatus);
router.delete('/:id', requireAdmin, deleteDiscount);

module.exports = router;
