const Order = require('../models/Order.model');
const Table = require('../models/Table.model');
const DailySalesSummary = require('../models/DailySalesSummary.model');
const { createOrder, getOrderById, getActiveOrdersForTable } = require('../services/order.service');
const { notifyOrderUpdate } = require('../services/notification.service');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ORDER_STATUS_TRANSITIONS } = require('../config/constants');

// Customer - Create order (table-session protected)
const createCustomerOrder = asyncHandler(async (req, res) => {
  const { items, customerNote } = req.body;
  const { tableId, tableNumber } = req.tableSession;
  
  // Get the raw session token from the request
  const sessionToken = req.rawSessionToken || req.headers.authorization.split(' ')[1];
  
  // Verify table exists
  const table = await Table.findById(tableId);
  if (!table) {
    throw new AppError('Table not found', 404);
  }
  
  // Create order - pass sessionToken explicitly
  const order = await createOrder(
    tableId,
    tableNumber,
    sessionToken,
    items,
    customerNote || ''
  );
  
  // Notify via socket
  notifyOrderUpdate(order);
  
  return successResponse(res, order, 'Order created successfully', 201);
});

// Customer - Get active orders for current table session
const getActiveOrders = asyncHandler(async (req, res) => {
  const { tableId } = req.tableSession;
  const sessionToken = req.rawSessionToken || req.headers.authorization.split(' ')[1];
  
  const orders = await Order.find({
    tableId,
    sessionToken: sessionToken,
    status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] },
  }).sort({ createdAt: -1 });
  
  return successResponse(res, orders, 'Active orders retrieved successfully');
});

// Customer/Staff - Get single order with proper authorization
const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let order;
  
  // Check if this is a customer request (has table session)
  if (req.tableSession) {
    const { tableId } = req.tableSession;
    const sessionToken = req.rawSessionToken || req.headers.authorization.split(' ')[1];
    order = await Order.findOne({
      _id: id,
      tableId,
      sessionToken: sessionToken,
    });
    if (!order) {
      throw new AppError('Order not found', 404);
    }
  } 
  // Check if this is a staff request (has user)
  else if (req.user) {
    order = await Order.findById(id).populate('tableId', 'tableNumber floorSection');
    if (!order) {
      throw new AppError('Order not found', 404);
    }
  } 
  else {
    throw new AppError('Authentication required', 401);
  }
  
  return successResponse(res, order, 'Order retrieved successfully');
});

// Staff only - Get all orders with filters
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, tableId, startDate, endDate, limit = 50, page = 1 } = req.query;
  
  const filter = {};
  
  if (status) {
    filter.status = status;
  }
  
  if (tableId) {
    filter.tableId = tableId;
  }
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }
  
  const skip = (page - 1) * limit;
  
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('tableId', 'tableNumber floorSection')
      .populate('items.menuItemId', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments(filter),
  ]);
  
  return successResponse(res, {
    orders,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  }, 'Orders retrieved successfully');
});

// Staff only - Update order status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  // Check if order can transition to this status
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status] || [];
  if (!allowedTransitions.includes(status)) {
    throw new AppError(`Cannot transition from ${order.status} to ${status}`, 400);
  }
  
  // Special handling for specific statuses
  if (status === 'confirmed' && !order.confirmedAt) {
    order.confirmedAt = new Date();
  }
  
  order.status = status;
  await order.save();
  
  // Notify via socket
  notifyOrderUpdate(order);
  
  // Update daily sales summary if order is completed
  if (status === 'served' || status === 'rejected') {
    await updateDailySales(order);
  }
  
  return successResponse(res, order, `Order ${status} successfully`);
});

// Manager only - Reject order
const rejectOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  // Check if order can be rejected
  if (['served', 'rejected', 'cancelled'].includes(order.status)) {
    throw new AppError(`Cannot reject order with status: ${order.status}`, 400);
  }
  
  order.status = 'rejected';
  order.rejectionReason = reason;
  await order.save();
  
  // Notify via socket
  notifyOrderUpdate(order);
  
  // Update daily sales
  await updateDailySales(order);
  
  return successResponse(res, order, 'Order rejected successfully');
});

// Staff only - Cancel order
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  if (['served', 'rejected', 'cancelled'].includes(order.status)) {
    throw new AppError(`Cannot cancel order with status: ${order.status}`, 400);
  }
  
  order.status = 'cancelled';
  await order.save();
  
  notifyOrderUpdate(order);
  
  return successResponse(res, order, 'Order cancelled successfully');
});

// Helper function to update daily sales summary
const updateDailySales = async (order) => {
  // Only update for completed orders
  if (!['served', 'rejected'].includes(order.status)) {
    return;
  }
  
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  
  let summary = await DailySalesSummary.findOne({ date });
  if (!summary) {
    summary = new DailySalesSummary({
      date,
      totalOrders: 0,
      totalItems: 0,
      totalRevenue: 0,
      totalTax: 0,
      averageOrderValue: 0,
      topItems: [],
      orderStatusCounts: new Map(),
    });
  }
  
  // Update counts
  summary.totalOrders += 1;
  summary.totalItems += order.itemCount || 0;
  
  if (order.status === 'served') {
    summary.totalRevenue += order.totalAmount || 0;
    summary.totalTax += order.taxAmount || 0;
  }
  
  // Update top items
  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      const existingItem = summary.topItems.find(ti => ti.itemName === item.itemName);
      if (existingItem) {
        existingItem.quantity += item.quantity;
        existingItem.revenue += item.itemPrice * item.quantity;
      } else {
        summary.topItems.push({
          itemName: item.itemName,
          quantity: item.quantity,
          revenue: item.itemPrice * item.quantity,
        });
      }
    });
    
    // Sort top items
    summary.topItems.sort((a, b) => b.quantity - a.quantity);
    if (summary.topItems.length > 10) {
      summary.topItems = summary.topItems.slice(0, 10);
    }
  }
  
  // Update order status counts
  const statusCount = summary.orderStatusCounts.get(order.status) || 0;
  summary.orderStatusCounts.set(order.status, statusCount + 1);
  
  // Recalculate average order value
  const servedOrders = await Order.countDocuments({ 
    status: 'served',
    createdAt: {
      $gte: date,
      $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
    }
  });
  
  if (servedOrders > 0) {
    summary.averageOrderValue = summary.totalRevenue / servedOrders;
  }
  
  await summary.save();
};

module.exports = {
  createCustomerOrder,
  getActiveOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  rejectOrder,
  cancelOrder,
};