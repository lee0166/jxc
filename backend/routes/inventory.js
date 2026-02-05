const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// 获取库存列表
router.get('/', async (req, res) => {
  try {
    const { category, minStock, maxStock, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (minStock) query.stock = { ...query.stock, $gte: parseInt(minStock) };
    if (maxStock) query.stock = { ...query.stock, $lte: parseInt(maxStock) };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const inventory = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ stock: 1 });
    
    res.status(200).json({
      status: 'success',
      data: inventory,
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

// 获取库存不足的商品
router.get('/low', async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    
    const lowStockProducts = await Product.find({ stock: { $lt: parseInt(threshold) } })
      .sort({ stock: 1 });
    
    res.status(200).json({
      status: 'success',
      data: lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取库存统计
router.get('/stats', async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $count: {} },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
          totalCost: { $sum: { $multiply: ['$stock', '$costPrice'] } }
        }
      }
    ]);
    
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          productCount: { $count: {} },
          stockCount: { $sum: '$stock' },
          stockValue: { $sum: { $multiply: ['$stock', '$price'] } }
        }
      },
      { $sort: { stockValue: -1 } }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        summary: stats[0] || {
          totalProducts: 0,
          totalStock: 0,
          totalValue: 0,
          totalCost: 0
        },
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 批量更新库存
router.put('/batch', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ status: 'error', message: '更新数据必须是数组格式' });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { productId, stock } = update;
      if (!productId || stock === undefined) {
        continue;
      }
      
      const product = await Product.findById(productId);
      if (product) {
        product.stock = stock;
        await product.save();
        results.push({
          productId,
          success: true,
          updatedStock: product.stock
        });
      } else {
        results.push({
          productId,
          success: false,
          message: '商品不存在'
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      message: '批量更新完成',
      data: results
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;