const express = require('express');
const Inbound = require('../models/Inbound');
const Product = require('../models/Product');
const router = express.Router();

// 创建入库记录
router.post('/', async (req, res) => {
  try {
    const { productId, quantity, supplier, batchNumber, totalCost, notes, operator } = req.body;
    
    if (!productId || !quantity || !supplier || !totalCost) {
      return res.status(400).json({ status: 'error', message: '商品ID、数量、供应商和总成本不能为空' });
    }
    
    // 检查商品是否存在
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: '商品不存在' });
    }
    
    // 创建入库记录
    const inbound = new Inbound({
      productId,
      quantity,
      supplier,
      batchNumber,
      totalCost,
      notes,
      operator
    });
    
    await inbound.save();
    
    // 更新商品库存
    product.stock += quantity;
    await product.save();
    
    res.status(201).json({
      status: 'success',
      message: '入库成功',
      data: {
        inbound,
        updatedStock: product.stock
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取入库记录列表
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, productId, supplier, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (startDate) query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    if (productId) query.productId = productId;
    if (supplier) query.supplier = supplier;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Inbound.countDocuments(query);
    const inboundRecords = await Inbound.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('productId', 'name category size color')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: inboundRecords,
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

// 获取单个入库记录
router.get('/:id', async (req, res) => {
  try {
    const inbound = await Inbound.findById(req.params.id)
      .populate('productId', 'name category size color price');
    
    if (!inbound) {
      return res.status(404).json({ status: 'error', message: '入库记录不存在' });
    }
    
    res.status(200).json({
      status: 'success',
      data: inbound
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取入库统计
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate) query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    
    const stats = await Inbound.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$totalCost' },
          totalRecords: { $count: {} }
        }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: stats[0] || {
        totalQuantity: 0,
        totalCost: 0,
        totalRecords: 0
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;