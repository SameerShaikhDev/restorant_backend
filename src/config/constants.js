// Token expiry times (in seconds)
const TOKEN_EXPIRY = {
  ACCESS: 900,        // 15 minutes
  REFRESH: 604800,    // 7 days
  TABLE_SESSION: 14400 // 4 hours
};

// Rate limiting windows (in milliseconds)
// Rate limiting windows (in milliseconds)
const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Increase from 5 to 50
  },
  ORDER: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Increase from 10 to 30
  },
  TABLE_SESSION: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Increase from 3 to 20
  },
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Increase from 20 to 100
  }
};

// Allowed table status transitions
const TABLE_STATUS_TRANSITIONS = {
  available: ['occupied', 'reserved', 'cleaning'],
  occupied: ['available', 'cleaning'],
  reserved: ['occupied', 'available', 'cleaning'],
  cleaning: ['available'],
};

// Order statuses
const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// Order status flow (valid transitions)
const ORDER_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served'],
  served: [],
  rejected: [],
  cancelled: [],
};

// Staff roles
const ROLES = {
  MANAGER: 'manager',
  KITCHEN: 'kitchen',
  WAITER: 'waiter',
};

module.exports = {
  TOKEN_EXPIRY,
  RATE_LIMITS,
  TABLE_STATUS_TRANSITIONS,
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  ROLES,
};