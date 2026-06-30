const express = require('express');
const router = express.Router();
const {
  createCustomerOrder,
  getActiveOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  rejectOrder,
  cancelOrder,
} = require('../controllers/order.controller');
const validate = require('../middleware/validate');
const { 
  createOrderSchema, 
  updateOrderStatusSchema,
  rejectOrderSchema,
} = require('../validators/order.validators');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const verifyTableSession = require('../middleware/verifyTableSession');
const { orderLimiter } = require('../middleware/rateLimiter');

// IMPORTANT: Order of routes matters!
// Customer routes (table session protected)
router.post('/', orderLimiter, verifyTableSession, validate(createOrderSchema), createCustomerOrder);
router.get('/active', verifyTableSession, getActiveOrders);

// Staff routes - MUST come BEFORE the /:id route
router.get('/all', authenticate, authorize('manager', 'kitchen', 'waiter'), getAllOrders);

// Customer/Staff route for single order (must be after /all)
router.get('/:id', verifyTableSession, getOrder);

// Staff routes for status updates
router.patch('/:id/status', authenticate, authorize('manager', 'kitchen', 'waiter'), validate(updateOrderStatusSchema), updateOrderStatus);
router.patch('/:id/reject', authenticate, authorize('manager'), validate(rejectOrderSchema), rejectOrder);
router.patch('/:id/cancel', authenticate, authorize('manager', 'waiter'), cancelOrder);

module.exports = router;