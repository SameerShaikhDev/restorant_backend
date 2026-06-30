const MenuItem = require('../models/MenuItem.model');
const Order = require('../models/Order.model');
const AppError = require('../utils/AppError');

const calculateOrderTotal = async (items) => {
  let totalAmount = 0;
  let taxAmount = 0;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Get current prices from database for each item
  const menuItemIds = items.map(item => item.menuItemId);
  const menuItems = await MenuItem.find({
    _id: { $in: menuItemIds },
    isAvailable: true,
  });
  
  if (menuItems.length !== items.length) {
    throw new AppError('Some items are no longer available', 400);
  }
  
  const priceMap = {};
  menuItems.forEach(item => {
    priceMap[item._id.toString()] = item.price;
  });
  
  // Calculate total using database prices
  const processedItems = items.map(item => {
    const dbPrice = priceMap[item.menuItemId.toString()];
    if (!dbPrice) {
      throw new AppError(`Item not found: ${item.menuItemId}`, 400);
    }
    
    const itemTotal = dbPrice * item.quantity;
    totalAmount += itemTotal;
    
    return {
      ...item,
      itemPrice: dbPrice,
      itemTotal,
    };
  });
  
  // Calculate tax (example: 10% GST)
  taxAmount = totalAmount * 0.10;
  totalAmount += taxAmount;
  
  return {
    processedItems,
    totalAmount: Math.round(totalAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    itemCount,
  };
};

const createOrder = async (tableId, tableNumber, sessionToken, items, customerNote = '') => {
  // Validate and calculate
  const { processedItems, totalAmount, taxAmount, itemCount } = 
    await calculateOrderTotal(items);
  
  // Get item names for snapshot
  const itemIds = items.map(item => item.menuItemId);
  const menuItems = await MenuItem.find({ _id: { $in: itemIds } });
  const nameMap = {};
  menuItems.forEach(item => {
    nameMap[item._id.toString()] = item.name;
  });
  
  // Create order with snapshots
  const order = new Order({
    tableId,
    tableNumber,
    sessionToken,  // This must be set
    items: processedItems.map(item => ({
      menuItemId: item.menuItemId,
      itemName: nameMap[item.menuItemId.toString()] || 'Unknown Item',
      itemPrice: item.itemPrice,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions || '',
    })),
    customerNote,
    totalAmount,
    taxAmount,
    itemCount,
    status: 'pending',
    createdAt: new Date(),
  });
  
  await order.save();
  return order;
};

const getOrderById = async (orderId, sessionToken = null, tableId = null) => {
  const query = { _id: orderId };
  
  // If sessionToken provided, verify it matches
  if (sessionToken) {
    query.sessionToken = sessionToken;
  }
  
  // If tableId provided, verify it matches
  if (tableId) {
    query.tableId = tableId;
  }
  
  const order = await Order.findOne(query);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  return order;
};

const getActiveOrdersForTable = async (tableId, sessionToken) => {
  return await Order.find({
    tableId,
    sessionToken,
    status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] },
  }).sort({ createdAt: -1 });
};

const getOrderHistoryForTable = async (tableId, sessionToken) => {
  return await Order.find({
    tableId,
    sessionToken,
    status: { $in: ['served', 'cancelled', 'rejected'] },
  }).sort({ createdAt: -1 });
};

module.exports = {
  calculateOrderTotal,
  createOrder,
  getOrderById,
  getActiveOrdersForTable,
  getOrderHistoryForTable,
};