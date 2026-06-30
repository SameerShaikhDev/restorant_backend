const MenuItem = require('../models/MenuItem.model');
const Category = require('../models/Category.model');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Public - Get all menu items with categories
const getMenuItems = asyncHandler(async (req, res) => {
  const { categoryId, search, isAvailable, isVeg, isBestSeller } = req.query;
  
  const filter = {};
  
  if (categoryId) {
    filter.categoryId = categoryId;
  }
  
  if (isAvailable !== undefined) {
    filter.isAvailable = isAvailable === 'true';
  }
  
  if (isVeg !== undefined) {
    filter.isVeg = isVeg === 'true';
  }
  
  if (isBestSeller !== undefined) {
    filter.isBestSeller = isBestSeller === 'true';
  }
  
  let query = MenuItem.find(filter).populate('categoryId', 'name displayOrder');
  
  if (search) {
    query = query.find({ $text: { $search: search } });
  }
  
  const items = await query.sort({ categoryId: 1, name: 1 });
  
  // Group by category for better frontend display
  const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });
  
  const categorizedItems = categories.map(category => ({
    category: {
      id: category._id,
      name: category.name,
      displayOrder: category.displayOrder,
    },
    items: items.filter(item => 
      item.categoryId._id.toString() === category._id.toString()
    ),
  }));
  
  // Add items without category
  const uncategorized = items.filter(item => !item.categoryId);
  if (uncategorized.length > 0) {
    categorizedItems.push({
      category: {
        id: null,
        name: 'Uncategorized',
        displayOrder: 999,
      },
      items: uncategorized,
    });
  }
  
  return successResponse(res, {
    categories: categorizedItems,
    allItems: items,
  }, 'Menu items retrieved successfully');
});

// Public - Get single menu item
const getMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const item = await MenuItem.findById(id).populate('categoryId', 'name');
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }
  
  return successResponse(res, item, 'Menu item retrieved successfully');
});

// Staff only - Create menu item
const createMenuItem = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    categoryId,
    imageUrl,
    isVeg,
    isBestSeller,
    rating,
    prepTimeMinutes,
    spiceLevel,
    ingredients,
    isAvailable,
  } = req.body;
  
  // Check if category exists
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }
  
  const item = new MenuItem({
    name,
    description,
    price,
    categoryId,
    imageUrl,
    isVeg: isVeg || false,
    isBestSeller: isBestSeller || false,
    rating: rating || 0,
    prepTimeMinutes: prepTimeMinutes || 15,
    spiceLevel: spiceLevel || 'medium',
    ingredients: ingredients || [],
    isAvailable: isAvailable !== undefined ? isAvailable : true,
  });
  
  await item.save();
  return successResponse(res, item, 'Menu item created successfully', 201);
});

// Staff only - Update menu item
const updateMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }
  
  // If updating category, verify it exists
  if (updates.categoryId) {
    const category = await Category.findById(updates.categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }
  
  Object.assign(item, updates);
  await item.save();
  
  return successResponse(res, item, 'Menu item updated successfully');
});

// Staff only - Delete menu item
const deleteMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }
  
  await item.deleteOne();
  return successResponse(res, null, 'Menu item deleted successfully');
});

// Staff only - Toggle availability
const toggleAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }
  
  item.isAvailable = !item.isAvailable;
  await item.save();
  
  return successResponse(res, item, `Item ${item.isAvailable ? 'available' : 'unavailable'} now`);
});

// Staff only - Bulk update availability
const bulkUpdateAvailability = asyncHandler(async (req, res) => {
  const { itemIds, isAvailable } = req.body;
  
  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    throw new AppError('itemIds array is required', 400);
  }
  
  const result = await MenuItem.updateMany(
    { _id: { $in: itemIds } },
    { isAvailable }
  );
  
  return successResponse(res, {
    modifiedCount: result.modifiedCount,
  }, `Updated ${result.modifiedCount} items`);
});

module.exports = {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  bulkUpdateAvailability,
};