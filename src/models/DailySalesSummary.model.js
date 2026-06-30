const mongoose = require('mongoose');

const dailySalesSummarySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true,
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalTax: {
    type: Number,
    default: 0,
    min: 0,
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  topItems: {
    type: [{
      itemName: String,
      quantity: Number,
      revenue: Number,
    }],
    default: [],
  },
  orderStatusCounts: {
    type: Map,
    of: Number,
    default: {},
  },
  // Not subject to TTL - survives order purges
}, {
  timestamps: true,
});

// Index for efficient date queries
dailySalesSummarySchema.index({ date: -1 });

const DailySalesSummary = mongoose.model('DailySalesSummary', dailySalesSummarySchema);
module.exports = DailySalesSummary;