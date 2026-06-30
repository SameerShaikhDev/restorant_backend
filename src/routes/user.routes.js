const express = require('express');
const router = express.Router();
const User = require('../models/User.model');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

// Get all staff (manager only)
const getStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({}).select('-passwordHash -loginHistory');
  return successResponse(res, staff, 'Staff retrieved successfully');
});

// Get single staff (manager only)
const getStaffMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-passwordHash -loginHistory');
  if (!user) {
    throw new AppError('Staff member not found', 404);
  }
  return successResponse(res, user, 'Staff member retrieved successfully');
});

// Update staff (manager only)
const updateStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role, isActive } = req.body;
  
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('Staff member not found', 404);
  }
  
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  
  await user.save();
  
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
  
  return successResponse(res, userData, 'Staff updated successfully');
});

// Delete staff (manager only)
const deleteStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Prevent deleting yourself
  if (id === req.user._id.toString()) {
    throw new AppError('You cannot delete your own account', 400);
  }
  
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('Staff member not found', 404);
  }
  
  await user.deleteOne();
  return successResponse(res, null, 'Staff deleted successfully');
});

// Toggle staff active status (manager only)
const toggleStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('Staff member not found', 404);
  }
  
  user.isActive = isActive;
  await user.save();
  
  return successResponse(res, { 
    id: user._id, 
    isActive: user.isActive 
  }, `Staff ${isActive ? 'activated' : 'deactivated'} successfully`);
});

router.get('/', authenticate, authorize('manager'), getStaff);
router.get('/:id', authenticate, authorize('manager'), getStaffMember);
router.put('/:id', authenticate, authorize('manager'), updateStaff);
router.delete('/:id', authenticate, authorize('manager'), deleteStaff);
router.patch('/:id/toggle', authenticate, authorize('manager'), toggleStaff);

module.exports = router;