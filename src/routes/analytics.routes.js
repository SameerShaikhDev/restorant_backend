const express = require('express');
const router = express.Router();
const {
  getDailySales,
  getSalesOverview,
  getTopItems,
  getTableUtilization,
  getOrderStats,
} = require('../controllers/analytics.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// All analytics routes require manager authentication
router.use(authenticate);
router.use(authorize('manager'));

router.get('/daily-sales', getDailySales);
router.get('/sales-overview', getSalesOverview);
router.get('/top-items', getTopItems);
router.get('/table-utilization', getTableUtilization);
router.get('/order-stats', getOrderStats);

module.exports = router;