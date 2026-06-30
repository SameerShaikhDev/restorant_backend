const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  bulkUpdateAvailability,
} = require('../controllers/menu.controller');
const validate = require('../middleware/validate');
const { 
  createMenuItemSchema, 
  updateMenuItemSchema 
} = require('../validators/menu.validators');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
// Comment out rate limiter for now
// const { publicLimiter } = require('../middleware/rateLimiter');

// Public routes - remove rate limiter temporarily
// router.use(publicLimiter);
router.get('/', getMenuItems);
router.get('/:id', getMenuItem);

// Staff only routes
router.post('/', authenticate, authorize('manager'), validate(createMenuItemSchema), createMenuItem);
router.put('/:id', authenticate, authorize('manager'), validate(updateMenuItemSchema), updateMenuItem);
router.delete('/:id', authenticate, authorize('manager'), deleteMenuItem);
router.patch('/:id/toggle-availability', authenticate, authorize('manager'), toggleAvailability);
router.patch('/bulk-availability', authenticate, authorize('manager'), bulkUpdateAvailability);

module.exports = router;