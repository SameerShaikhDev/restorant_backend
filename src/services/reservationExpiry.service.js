const Table = require('../models/Table.model');
const Order = require('../models/Order.model');

const checkAndClearExpiredReservations = async () => {
  try {
    const now = new Date();
    
    // Clear expired reservations
    const result = await Table.updateMany(
      {
        status: 'reserved',
        reservedUntil: { $lte: now },
      },
      {
        status: 'available',
        reservedUntil: null,
        reservedFor: '',
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Cleared ${result.modifiedCount} expired reservations`);
    }
    
    // Release tables with no active orders but marked as occupied
    const occupiedTables = await Table.find({ status: 'occupied' });
    for (const table of occupiedTables) {
      const activeOrders = await Order.countDocuments({
        tableId: table._id,
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
      });
      
      if (activeOrders === 0) {
        // No active orders, release the table
        table.status = 'available';
        await table.save();
        console.log(`Released table ${table.tableNumber} (no active orders)`);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error cleaning up tables:', error);
    throw error;
  }
};

const cleanupReservations = async () => {
  // Run cleanup immediately
  await checkAndClearExpiredReservations();
  
  // Set up interval to run every 30 seconds (more frequent)
  const interval = setInterval(async () => {
    await checkAndClearExpiredReservations();
  }, 30 * 1000); // 30 seconds
  
  return () => clearInterval(interval);
};

const isTableReserved = (table) => {
  if (!table.reservedUntil) return false;
  return new Date() < table.reservedUntil;
};

module.exports = {
  checkAndClearExpiredReservations,
  cleanupReservations,
  isTableReserved,
};