const express = require('express');
const Sales = require('../models/Sales');
const Product = require('../models/Product');
const router = express.Router();

// 创建销售记录
router.post('/', async (req, res) => {
  try {
    const { productId, quantity, unitPrice, totalAmount, customerName, paymentMethod, notes, operator } = req.body;
    
    if (!productId || !quantity || !unitPrice || !totalAmount) {
      return res.status(400).json({ status: 'error', message: '商品ID、数量、单价和总金额不能为空' });
    }
    
    // 检查商品是否存在
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: '商品不存在' });
    }
    
    // 检查库存是否充足
    if (product.stock < quantity) {
      return res.status(400).json({ status: 'error', message: '库存不足' });
    }
    
    // 创建销售记录
    const sales = new Sales({
      productId,
      quantity,
      unitPrice,
      totalAmount,
      customerName,
      paymentMethod,
      notes,
      operator
    });
    
    await sales.save();
    
    // 更新商品库存
    product.stock -= quantity;
    await product.save();
    
    res.status(201).json({
      status: 'success',
      message: '销售成功',
      data: {
        sales,
        updatedStock: product.stock
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取销售记录列表
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, productId, customerName, paymentMethod, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (startDate) query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    if (productId) query.productId = productId;
    if (customerName) query.customerName = customerName;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Sales.countDocuments(query);
    const salesRecords = await Sales.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('productId', 'name category size color')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: salesRecords,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取单个销售记录
router.get('/:id', async (req, res) => {
  try {
    const sales = await Sales.findById(req.params.id)
      .populate('productId', 'name category size color price');
    
    if (!sales) {
      return res.status(404).json({ status: 'error', message: '销售记录不存在' });
    }
    
    res.status(200).json({
      status: 'success',
      data: sales
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取销售统计
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate) query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    
    const stats = await Sales.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' },
          totalRecords: { $count: {} }
        }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: stats[0] || {
        totalQuantity: 0,
        totalAmount: 0,
        totalRecords: 0
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取按日期分组的销售统计
router.get('/stats/daily', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate) query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    
    const stats = await Sales.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' },
          totalRecords: { $count: {} }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;