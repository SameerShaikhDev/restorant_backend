const socketIO = require('socket.io');
const { verifyTableSession } = require('../services/tableSession.service');

let io = null;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // For staff connections, we can allow with staff auth
      // For this implementation, we'll handle it differently
      socket.isStaff = false;
      return next();
    }
    
    try {
      const decoded = verifyTableSession(token);
      socket.tableSession = decoded;
      socket.tableId = decoded.tableId;
      socket.tableNumber = decoded.tableNumber;
      socket.isStaff = false;
      next();
    } catch (error) {
      // If token is invalid, allow connection but mark as unauthenticated
      socket.isStaff = false;
      socket.isAuthenticated = false;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Handle joining table room
    socket.on('join-table', (data) => {
      const { token } = data;
      
      try {
        const decoded = verifyTableSession(token);
        const room = `table-${decoded.tableId}`;
        
        // Leave all previous rooms
        socket.rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });
        
        // Join the table room
        socket.join(room);
        socket.tableId = decoded.tableId;
        socket.isAuthenticated = true;
        
        socket.emit('joined-table', {
          success: true,
          tableId: decoded.tableId,
          tableNumber: decoded.tableNumber,
        });
        
        console.log(`Socket ${socket.id} joined room: ${room}`);
      } catch (error) {
        socket.emit('join-error', {
          success: false,
          message: 'Invalid table session',
        });
      }
    });
    
    // Handle staff connection
    socket.on('staff-join', (data) => {
      // For staff, we might want to verify JWT here
      // For simplicity, we'll allow staff to join staff rooms
      socket.join('staff');
      socket.join('kitchen');
      socket.isStaff = true;
      
      socket.emit('staff-joined', {
        success: true,
        message: 'Joined staff channel',
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};