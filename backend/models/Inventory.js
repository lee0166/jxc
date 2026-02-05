const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  type: {
    type: String,
    enum: ['in', 'out', 'adjust'],
    default: 'adjust'
  },
  remark: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
