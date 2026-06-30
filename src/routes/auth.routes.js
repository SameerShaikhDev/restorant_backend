const express = require('express');
const router = express.Router();
const { login, refresh, logout, register } = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { loginSchema, refreshTokenSchema } = require('../validators/auth.validators');
const { authLimiter } = require('../middleware/rateLimiter');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Apply rate limiting to auth routes
router.use(authLimiter);

router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/logout', logout);
router.post('/register', authenticate, authorize('manager'), register);

module.exports = router;