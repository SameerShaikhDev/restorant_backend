const express = require('express');
const router = express.Router();
const {
  getAllTables,
  getTableByNumber,
  generateSession,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
  forceReleaseTable,
} = require('../controllers/table.controller');
const validate = require('../middleware/validate');
const { 
  createTableSchema, 
  updateTableSchema, 
  statusUpdateSchema 
} = require('../validators/table.validators');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { tableSessionLimiter } = require('../middleware/rateLimiter');

// Public routes
router.get('/', getAllTables);
router.get('/:tableNumber', getTableByNumber);
router.post('/:tableNumber/session', tableSessionLimiter, generateSession);

// Staff only routes
router.post('/', authenticate, authorize('manager'), validate(createTableSchema), createTable);
router.put('/:id', authenticate, authorize('manager'), validate(updateTableSchema), updateTable);
router.delete('/:id', authenticate, authorize('manager'), deleteTable);
router.patch('/:id/status', authenticate, authorize('manager', 'waiter'), validate(statusUpdateSchema), updateTableStatus);
router.patch('/:id/force-release', authenticate, authorize('manager'), forceReleaseTable);

module.exports = router;