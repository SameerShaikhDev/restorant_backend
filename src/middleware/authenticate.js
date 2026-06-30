const { verifyAccessToken } = require('../services/token.service');
const User = require('../models/User.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  
  // Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    throw new AppError('Please login to access this resource', 401);
  }
  
  try {
    const decoded = await verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }
    
    if (!user.isActive) {
      throw new AppError('User account is disabled', 401);
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    throw new AppError('Invalid or expired token. Please login again', 401);
  }
});

module.exports = authenticate;