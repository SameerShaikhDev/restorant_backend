const { getIO } = require('../sockets/socket');

const notifyTable = (tableId, event, data) => {
  const io = getIO();
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }
  
  const room = `table-${tableId}`;
  io.to(room).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

const notifyStaff = (event, data) => {
  const io = getIO();
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }
  
  io.to('staff').emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

const notifyKitchen = (event, data) => {
  const io = getIO();
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }
  
  io.to('kitchen').emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

const notifyOrderUpdate = (order) => {
  // Notify the table
  notifyTable(order.tableId, 'order-update', {
    orderId: order._id,
    status: order.status,
    order,
  });
  
  // Notify staff
  notifyStaff('order-update', {
    orderId: order._id,
    tableNumber: order.tableNumber,
    status: order.status,
    order,
  });
  
  // Notify kitchen specifically for food prep statuses
  if (['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)) {
    notifyKitchen('order-update', {
      orderId: order._id,
      tableNumber: order.tableNumber,
      status: order.status,
      order,
    });
  }
};

module.exports = {
  notifyTable,
  notifyStaff,
  notifyKitchen,
  notifyOrderUpdate,
};