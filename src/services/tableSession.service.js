const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { TABLE_STATUS_TRANSITIONS } = require('../config/constants');
const AppError = require('../utils/AppError');

const generateTableSession = (tableId, tableNumber) => {
  return jwt.sign(
    { tableId, tableNumber, type: 'table-session' },
    env.TABLE_SESSION_SECRET,
    { expiresIn: env.TABLE_SESSION_EXPIRY }
  );
};

const verifyTableSession = (token) => {
  try {
    const decoded = jwt.verify(token, env.TABLE_SESSION_SECRET);
    if (decoded.type !== 'table-session') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired table session');
  }
};

const canTransitionStatus = (currentStatus, newStatus) => {
  const allowed = TABLE_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
};

const validateStatusTransition = (currentStatus, newStatus, isStaff = false) => {
  // Staff can do more transitions
  if (isStaff) {
    // Staff can always set cleaning and available
    if (newStatus === 'cleaning' || newStatus === 'available') {
      return true;
    }
  }
  
  // Check against allowed transitions
  return canTransitionStatus(currentStatus, newStatus);
};

const getTableSessionData = (token) => {
  try {
    const decoded = jwt.verify(token, env.TABLE_SESSION_SECRET);
    return {
      tableId: decoded.tableId,
      tableNumber: decoded.tableNumber,
    };
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateTableSession,
  verifyTableSession,
  canTransitionStatus,
  validateStatusTransition,
  getTableSessionData,
};