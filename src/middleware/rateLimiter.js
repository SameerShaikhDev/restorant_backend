const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../config/constants');

// General public rate limiter
const publicLimiter = rateLimit({
  windowMs: RATE_LIMITS.PUBLIC.windowMs,
  max: RATE_LIMITS.PUBLIC.max,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Order rate limiter
const orderLimiter = rateLimit({
  windowMs: RATE_LIMITS.ORDER.windowMs,
  max: RATE_LIMITS.ORDER.max,
  message: {
    success: false,
    message: 'Too many orders placed, please wait a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Table session rate limiter
const tableSessionLimiter = rateLimit({
  windowMs: RATE_LIMITS.TABLE_SESSION.windowMs,
  max: RATE_LIMITS.TABLE_SESSION.max,
  message: {
    success: false,
    message: 'Too many session requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  publicLimiter,
  authLimiter,
  orderLimiter,
  tableSessionLimiter,
};