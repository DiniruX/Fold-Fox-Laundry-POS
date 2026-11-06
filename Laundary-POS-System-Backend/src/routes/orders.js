const express = require('express');
const router = express.Router();
const {
  getPricingConfig,
  getDeliverySchedule,
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  updateOrderStatus,
  addPayment,
  deleteOrder,
  getOrderAnalytics,
  bulkUpdateOrders,
  sendBankDetails,
  confirmOrderItems,
  sendReceiptToCustomer
} = require('../controllers/orderController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Order CRUD routes
router.get('/', getOrders); // Get all orders with filtering
router.get('/analytics', getOrderAnalytics); // Get order analytics
router.get('/pricing-config', getPricingConfig); // Minimum order / express fee for the POS
router.get('/deliveries', getDeliverySchedule); // Deliveries calendar
router.get('/:id', getOrder); // Get single order
router.post('/', validateOrder, createOrder); // Create new order
router.put('/:id', updateOrder); // Update order
router.patch('/:id/status', updateOrderStatus); // Update order status
router.put('/:id/confirm-items', confirmOrderItems); // Confirm order items after pickup
router.post('/:id/payments', addPayment); // Add payment to order
router.post('/:id/send-bank-details', sendBankDetails); // Send bank details to customer
router.post('/:id/send-receipt', sendReceiptToCustomer); // Send receipt to customer email
router.delete('/:id', authorizeRole(['admin']), deleteOrder); // Delete order (Admin only)

// Bulk operations (Admin/Manager only)
router.post('/bulk-update', authorizeRole(['admin']), bulkUpdateOrders);

module.exports = router;