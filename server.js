// Load environment variables FIRST - before anything else
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initializeSocket } = require('./src/sockets/socket');
const { cleanupReservations } = require('./src/services/reservationExpiry.service');
const env = require('./src/config/env');
const http = require('http');

const PORT = env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Connect to MongoDB
connectDB();

// Start cleanup service for reservations
cleanupReservations().then(cleanup => {
  console.log('✅ Reservation cleanup service started');
  // Store cleanup function for graceful shutdown
  process.on('SIGTERM', () => {
    cleanup();
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${env.FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('👋 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Gracefully shutdown
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Gracefully shutdown
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;