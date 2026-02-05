const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
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
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  customerName: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    default: 'cash'
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

const Sales = mongoose.model('Sales', salesSchema);

module.exports = Sales;