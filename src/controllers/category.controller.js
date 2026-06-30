const Category = require('../models/Category.model');
const MenuItem = require('../models/MenuItem.model');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Public - Get all categories
const getCategories = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  const categories = await Category.find(filter).sort({ displayOrder: 1, name: 1 });
  return successResponse(res, categories, 'Categories retrieved successfully');
});

// Staff only - Create category
const createCategory = asyncHandler(async (req, res) => {
  const { name, displayOrder, isActive } = req.body;
  
  // Check if category name already exists
  const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (existing) {
    throw new AppError('Category name already exists', 409);
  }
  
  const category = new Category({
    name,
    displayOrder: displayOrder || 0,
    isActive: isActive !== undefined ? isActive : true,
  });
  
  await category.save();
  return successResponse(res, category, 'Category created successfully', 201);
});

// Staff only - Update category
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, displayOrder, isActive } = req.body;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  
  // If changing name, check for duplicates
  if (name && name !== category.name) {
    const existing = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: id }
    });
    if (existing) {
      throw new AppError('Category name already exists', 409);
    }
  }
  
  if (name) category.name = name;
  if (displayOrder !== undefined) category.displayOrder = displayOrder;
  if (isActive !== undefined) category.isActive = isActive;
  
  await category.save();
  return successResponse(res, category, 'Category updated successfully');
});

// Staff only - Delete category
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  
  // Check if category has menu items
  const itemCount = await MenuItem.countDocuments({ categoryId: id });
  if (itemCount > 0) {
    throw new AppError(`Cannot delete category with ${itemCount} menu items. Remove or reassign items first.`, 400);
  }
  
  await category.deleteOne();
  return successResponse(res, null, 'Category deleted successfully');
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};