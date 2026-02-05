const mongoose = require('mongoose');

const inboundSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  supplier: {
    type: String,
    required: true,
    trim: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  operator: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Inbound = mongoose.model('Inbound', inboundSchema);

module.exports = Inbound;