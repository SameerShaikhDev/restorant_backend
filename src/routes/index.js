const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const tableRoutes = require('./table.routes');
const menuRoutes = require('./menu.routes');
const categoryRoutes = require('./category.routes');
const orderRoutes = require('./order.routes');
const analyticsRoutes = require('./analytics.routes');
const userRoutes = require('./user.routes'); // Add this

// Mount routes
router.use('/auth', authRoutes);
router.use('/tables', tableRoutes);
router.use('/menu-items', menuRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', userRoutes); // Add this

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;