const User = require('../models/User.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../services/token.service');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }
  
  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Your account has been disabled', 401);
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }
  
  // Update last login
  user.lastLogin = new Date();
  user.loginHistory.push({
    loginAt: new Date(),
    ip: req.ip || req.connection.remoteAddress,
  });
  await user.save();
  
  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);
  
  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    lastLogin: user.lastLogin,
  };
  
  return successResponse(res, {
    user: userData,
    accessToken,
  }, 'Login successful');
});

// Add this to auth.controller.js
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists with this email', 409);
  }
  
  // Hash password
  const passwordHash = await User.hashPassword(password);
  
  // Create user
  const user = new User({
    name,
    email,
    passwordHash,
    role: role || 'waiter',
    isActive: true,
  });
  
  await user.save();
  
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  
  return successResponse(res, userData, 'Staff created successfully', 201);
});

const logout = asyncHandler(async (req, res) => {
  // Update logout time in login history
  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user && user.loginHistory.length > 0) {
      const lastEntry = user.loginHistory[user.loginHistory.length - 1];
      if (!lastEntry.logoutAt) {
        lastEntry.logoutAt = new Date();
        await user.save();
      }
    }
  }
  
  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  
  return successResponse(res, null, 'Logged out successfully');
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }
  
  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }
    
    // Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.role);
    
    return successResponse(res, {
      accessToken: newAccessToken,
    }, 'Token refreshed');
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
});

module.exports = {
  login,
  refresh,
  logout,
  register,
};