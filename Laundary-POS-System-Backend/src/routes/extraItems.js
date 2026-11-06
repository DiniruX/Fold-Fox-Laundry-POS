const express = require('express');
const router = express.Router();

const {
  getExtraItems,
  getExtraItem,
  createExtraItem,
  updateExtraItem,
  toggleExtraItemStatus,
  deleteExtraItem
} = require('../controllers/extraItemController');

const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireCashierOrAdmin } = require('../middleware/roleCheck');

/**
 * Extra Item ("Other Items") Routes
 * Admin: full CRUD
 * Cashier: read active items (needed to price hangers / add-ons on orders)
 */

router.use(authenticateToken);

router.get('/', requireCashierOrAdmin, getExtraItems);
router.get('/:id', requireCashierOrAdmin, getExtraItem);

router.post('/', requireAdmin, createExtraItem);
router.put('/:id', requireAdmin, updateExtraItem);
router.patch('/:id/toggle-status', requireAdmin, toggleExtraItemStatus);
router.delete('/:id', requireAdmin, deleteExtraItem);

module.exports = router;
