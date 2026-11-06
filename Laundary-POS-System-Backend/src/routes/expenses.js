const express = require('express');
const router = express.Router();

const {
  getExpenses,
  getExpenseSummary,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');

const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

/**
 * Expense Routes - Admin only
 * Salary payments and day-to-day business expenses
 */

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/summary', getExpenseSummary);
router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
