const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  itemPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 20,
  },
  specialInstructions: {
    type: String,
    trim: true,
    default: '',
    maxlength: 200,
  },
}, {
  _id: false,
});

const orderSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true,
  },
  tableNumber: {
    type: String,
    required: true,
  },
  sessionToken: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'rejected', 'cancelled'],
    default: 'pending',
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item',
    },
  },
  customerNote: {
    type: String,
    trim: true,
    default: '',
    maxlength: 300,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  itemCount: {
    type: Number,
    required: true,
    min: 1,
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: '',
  },
  confirmedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// TTL Index - auto-delete orders after 30 days
orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Additional indexes for queries
orderSchema.index({ tableId: 1, sessionToken: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ tableId: 1, status: 1 });

// Pre-save middleware to set itemCount
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;