const Table = require('../models/Table.model');
const { generateTableSession, validateStatusTransition } = require('../services/tableSession.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Public - Get all tables (for display)
const getAllTables = asyncHandler(async (req, res) => {
  const tables = await Table.find().sort({ tableNumber: 1 });
  return successResponse(res, tables, 'Tables retrieved successfully');
});

// Public - Get table by number
const getTableByNumber = asyncHandler(async (req, res) => {
  const { tableNumber } = req.params;
  const table = await Table.findOne({ tableNumber });
  
  if (!table) {
    throw new AppError('Table not found', 404);
  }
  
  return successResponse(res, table, 'Table retrieved successfully');
});

// Public - Generate table session (QR code flow)
// Public - Generate table session (QR code flow)
const generateSession = asyncHandler(async (req, res) => {
  const { tableNumber } = req.params;
  
  const table = await Table.findOne({ tableNumber });
  if (!table) {
    throw new AppError('Table not found', 404);
  }
  
  // Check if table is available
  if (table.status === 'occupied') {
    // If occupied, check if it's actually occupied or just stale
    // Check if there are any active orders for this table
    const activeOrders = await Order.countDocuments({
      tableId: table._id,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
    });
    
    if (activeOrders === 0) {
      // No active orders, free the table
      table.status = 'available';
      await table.save();
    } else {
      throw new AppError('This table is currently occupied with active orders', 400);
    }
  }
  
  if (table.status === 'cleaning') {
    throw new AppError('This table is being cleaned', 400);
  }
  
  // If table is reserved, check if reservation is expired
  if (table.status === 'reserved' && table.reservedUntil) {
    if (new Date() > table.reservedUntil) {
      // Reservation expired, free the table
      table.status = 'available';
      table.reservedUntil = null;
      table.reservedFor = '';
      await table.save();
    } else {
      throw new AppError('This table is reserved until ' + new Date(table.reservedUntil).toLocaleTimeString(), 400);
    }
  }
  
  // If table is available, mark as occupied
  if (table.status === 'available') {
    table.status = 'occupied';
    await table.save();
  }
  
  // Generate session token
  const sessionToken = generateTableSession(table._id, table.tableNumber);
  
  return successResponse(res, {
    sessionToken,
    tableId: table._id,
    tableNumber: table.tableNumber,
    tableStatus: table.status,
  }, 'Table session generated');
});

// Staff only - Create table
const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, capacity, floorSection, status } = req.body;
  
  // Check if table number already exists
  const existingTable = await Table.findOne({ tableNumber });
  if (existingTable) {
    throw new AppError('Table number already exists', 409);
  }
  
  const table = new Table({
    tableNumber,
    capacity,
    floorSection,
    status: status || 'available',
  });
  
  await table.save();
  return successResponse(res, table, 'Table created successfully', 201);
});

// Staff only - Update table
const updateTable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const table = await Table.findById(id);
  if (!table) {
    throw new AppError('Table not found', 404);
  }
  
  // Check if table number is being changed and is unique
  if (updates.tableNumber && updates.tableNumber !== table.tableNumber) {
    const existing = await Table.findOne({ tableNumber: updates.tableNumber });
    if (existing) {
      throw new AppError('Table number already exists', 409);
    }
  }
  
  // Validate status transition
  if (updates.status && updates.status !== table.status) {
    const isValid = validateStatusTransition(table.status, updates.status, true);
    if (!isValid) {
      throw new AppError(`Cannot transition from ${table.status} to ${updates.status}`, 400);
    }
  }
  
  // If status is being changed to available, clear reservation data
  if (updates.status === 'available') {
    updates.reservedUntil = null;
    updates.reservedFor = '';
  }
  
  Object.assign(table, updates);
  await table.save();
  
  return successResponse(res, table, 'Table updated successfully');
});

// Staff only - Delete table
const deleteTable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const table = await Table.findById(id);
  if (!table) {
    throw new AppError('Table not found', 404);
  }
  
  await table.deleteOne();
  return successResponse(res, null, 'Table deleted successfully');
});

// Staff only - Update table status
const updateTableStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reservedFor, reservedUntil } = req.body;
  
  const table = await Table.findById(id);
  if (!table) {
    throw new AppError('Table not found', 404);
  }
  
  // Validate status transition
  const isValid = validateStatusTransition(table.status, status, true);
  if (!isValid) {
    throw new AppError(`Cannot transition from ${table.status} to ${status}`, 400);
  }
  
  // Special handling for reserved status
  if (status === 'reserved') {
    if (!reservedFor || !reservedUntil) {
      throw new AppError('Reserved for and reserved until are required for reservation', 400);
    }
    table.reservedFor = reservedFor;
    table.reservedUntil = new Date(reservedUntil);
  } else if (status === 'available' || status === 'occupied') {
    // Clear reservation data when moving out of reserved
    table.reservedUntil = null;
    table.reservedFor = '';
  }
  
  table.status = status;
  await table.save();
  
  return successResponse(res, table, 'Table status updated successfully');
});

// Staff only - Force release table (admin only)
const forceReleaseTable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const table = await Table.findById(id);
  if (!table) {
    throw new AppError('Table not found', 404);
  }
  
  // Check if there are active orders
  const activeOrders = await Order.countDocuments({
    tableId: table._id,
    status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
  });
  
  if (activeOrders > 0) {
    throw new AppError(`Cannot release table with ${activeOrders} active orders`, 400);
  }
  
  table.status = 'available';
  table.reservedUntil = null;
  table.reservedFor = '';
  await table.save();
  
  return successResponse(res, table, 'Table released successfully');
});

module.exports = {
  getAllTables,
  getTableByNumber,
  generateSession,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
  forceReleaseTable, 
};

