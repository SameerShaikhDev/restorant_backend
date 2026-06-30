const DailySalesSummary = require('../models/DailySalesSummary.model');
const Order = require('../models/Order.model');
const Table = require('../models/Table.model');
const MenuItem = require('../models/MenuItem.model');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Get daily sales summary
const getDailySales = asyncHandler(async (req, res) => {
  const { date } = req.query;
  
  let startDate;
  if (date) {
    startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
  }
  
  let summary = await DailySalesSummary.findOne({ date: startDate });
  
  if (!summary) {
    // Calculate from orders if not aggregated yet
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    const orders = await Order.find({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
      status: 'served',
    });
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalItems = orders.reduce((sum, order) => sum + (order.itemCount || 0), 0);
    const totalTax = orders.reduce((sum, order) => sum + (order.taxAmount || 0), 0);
    
    summary = {
      date: startDate,
      totalOrders: orders.length,
      totalItems,
      totalRevenue,
      totalTax,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      topItems: [],
      orderStatusCounts: {},
    };
  }
  
  return successResponse(res, summary, 'Daily sales retrieved successfully');
});

// Get sales overview (last 7 days, month, etc.)
const getSalesOverview = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query;
  
  let startDate = new Date();
  let groupBy = {};
  
  switch(period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      groupBy = { $dayOfMonth: '$createdAt' };
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      groupBy = { $dayOfMonth: '$createdAt' };
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      groupBy = { $month: '$createdAt' };
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
      groupBy = { $dayOfMonth: '$createdAt' };
  }
  
  startDate.setHours(0, 0, 0, 0);
  
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate },
        status: 'served',
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
        items: { $sum: '$itemCount' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
    },
  ];
  
  const salesData = await Order.aggregate(pipeline);
  
  return successResponse(res, {
    period,
    startDate,
    data: salesData,
    summary: {
      totalRevenue: salesData.reduce((sum, d) => sum + d.revenue, 0),
      totalOrders: salesData.reduce((sum, d) => sum + d.orders, 0),
      totalItems: salesData.reduce((sum, d) => sum + d.items, 0),
    },
  }, 'Sales overview retrieved successfully');
});

// Get top selling items
const getTopItems = asyncHandler(async (req, res) => {
  const { limit = 10, period = 'week' } = req.query;
  
  let startDate = new Date();
  
  switch(period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }
  
  startDate.setHours(0, 0, 0, 0);
  
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate },
        status: 'served',
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.itemName',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.itemPrice', '$items.quantity'] } },
        orders: { $sum: 1 },
      },
    },
    {
      $sort: { totalRevenue: -1 },
    },
    {
      $limit: parseInt(limit),
    },
  ];
  
  const topItems = await Order.aggregate(pipeline);
  
  // Get additional item details
  const itemNames = topItems.map(item => item._id);
  const menuItems = await MenuItem.find({
    name: { $in: itemNames },
  }).select('name imageUrl isVeg categoryId');
  
  const itemsWithDetails = topItems.map(item => {
    const menuItem = menuItems.find(m => m.name === item._id);
    return {
      ...item,
      details: menuItem || null,
    };
  });
  
  return successResponse(res, itemsWithDetails, 'Top items retrieved successfully');
});

// Get table utilization
const getTableUtilization = asyncHandler(async (req, res) => {
  const totalTables = await Table.countDocuments();
  const tablesByStatus = await Table.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
  
  const statusMap = {};
  tablesByStatus.forEach(item => {
    statusMap[item._id] = item.count;
  });
  
  const utilization = {
    total: totalTables,
    available: statusMap.available || 0,
    occupied: statusMap.occupied || 0,
    reserved: statusMap.reserved || 0,
    cleaning: statusMap.cleaning || 0,
    utilizationRate: totalTables > 0 
      ? ((statusMap.occupied || 0) / totalTables * 100).toFixed(1) 
      : 0,
  };
  
  return successResponse(res, utilization, 'Table utilization retrieved successfully');
});

// Get order statistics
const getOrderStats = asyncHandler(async (req, res) => {
  const { period = 'today' } = req.query;
  
  let startDate = new Date();
  
  switch(period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setHours(0, 0, 0, 0);
  }
  
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
      },
    },
  ];
  
  const stats = await Order.aggregate(pipeline);
  
  const statsMap = {};
  stats.forEach(item => {
    statsMap[item._id] = {
      count: item.count,
      revenue: item.totalRevenue || 0,
    };
  });
  
  // Get total orders in period
  const totalOrders = await Order.countDocuments({
    createdAt: { $gte: startDate },
  });
  
  const response = {
    period,
    startDate,
    totalOrders,
    byStatus: statsMap,
    summary: {
      totalRevenue: stats.reduce((sum, s) => sum + (s.totalRevenue || 0), 0),
      pending: statsMap.pending?.count || 0,
      confirmed: statsMap.confirmed?.count || 0,
      preparing: statsMap.preparing?.count || 0,
      ready: statsMap.ready?.count || 0,
      served: statsMap.served?.count || 0,
      rejected: statsMap.rejected?.count || 0,
      cancelled: statsMap.cancelled?.count || 0,
    },
  };
  
  return successResponse(res, response, 'Order statistics retrieved successfully');
});

module.exports = {
  getDailySales,
  getSalesOverview,
  getTopItems,
  getTableUtilization,
  getOrderStats,
};