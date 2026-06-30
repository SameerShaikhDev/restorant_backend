const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: [true, 'Table number is required'],
    unique: true,
    trim: true,
  },
  capacity: {
    type: Number,
    default: 4,
    min: [1, 'Capacity must be at least 1'],
  },
  floorSection: {
    type: String,
    default: 'Main',
    trim: true,
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'cleaning'],
    default: 'available',
  },
  reservedUntil: {
    type: Date,
    default: null,
  },
  reservedFor: {
    type: String,
    trim: true,
    default: '',
  },
  qrCodeUrl: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Indexes
tableSchema.index({ tableNumber: 1 });
tableSchema.index({ status: 1 });
tableSchema.index({ reservedUntil: 1 });

// Virtual for checking if table is currently reserved
tableSchema.virtual('isReserved').get(function() {
  if (!this.reservedUntil) return false;
  return new Date() < this.reservedUntil;
});

// Ensure virtuals are included in JSON output
tableSchema.set('toJSON', { virtuals: true });
tableSchema.set('toObject', { virtuals: true });

const Table = mongoose.model('Table', tableSchema);
module.exports = Table;