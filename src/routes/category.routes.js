const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const validate = require('../middleware/validate');
const { 
  createCategorySchema, 
  updateCategorySchema 
} = require('../validators/menu.validators');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { publicLimiter } = require('../middleware/rateLimiter');

// Public routes
router.use(publicLimiter);
router.get('/', getCategories);

// Staff only routes
router.post('/', authenticate, authorize('manager'), validate(createCategorySchema), createCategory);
router.put('/:id', authenticate, authorize('manager'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', authenticate, authorize('manager'), deleteCategory);

module.exports = router;