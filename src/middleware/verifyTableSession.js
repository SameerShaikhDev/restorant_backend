const { verifyTableSession } = require('../services/tableSession.service');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const verifyTableSessionMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  
  // Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    throw new AppError('Table session required. Please scan the QR code again.', 401);
  }
  
  try {
    const decoded = verifyTableSession(token);
    
    // Attach table info to request
    req.tableSession = decoded;
    req.tableId = decoded.tableId;
    req.tableNumber = decoded.tableNumber;
    
    // Also store the raw token for use in controllers
    req.rawSessionToken = token;
    
    next();
  } catch (error) {
    // Log the actual error for debugging
    console.error('Table session verification failed:', error.message);
    throw new AppError('Invalid or expired table session. Please scan the QR code again.', 401);
  }
});

module.exports = verifyTableSessionMiddleware;