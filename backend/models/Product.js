const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  productName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  stockAlert: {
    type: Number,
    default: 10
  },
  supplier: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  customCode: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: '启用'
  },
  genderType: {
    type: String,
    enum: ['adult_male', 'adult_female', 'boy', 'girl', 'unisex'],
    default: 'unisex'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
productSchema.pre('save', async function() {
  this.updatedAt = Date.now();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;