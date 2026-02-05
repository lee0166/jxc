const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// 获取所有商品
router.get('/', async (req, res) => {
  try {
    const { category, size, color, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (size) query.size = size;
    if (color) query.color = color;
    if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ status: 'error', message: '获取商品列表失败: ' + error.message });
  }
});

// 获取商品分类列表
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    console.error('获取商品分类列表失败:', error);
    res.status(500).json({ status: 'error', message: '获取商品分类列表失败: ' + error.message });
  }
});

// 更新商品状态 - 必须在 /:id 路由之前定义
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: '商品不存在' });
    }
    product.status = status;
    await product.save();
    res.status(200).json({
      status: 'success',
      message: '状态更新成功',
      data: product
    });
  } catch (error) {
    console.error('更新商品状态失败:', error);
    res.status(500).json({ status: 'error', message: '更新商品状态失败: ' + error.message });
  }
});

// 获取单个商品
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: '商品不存在' });
    }
    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ status: 'error', message: '获取商品详情失败: ' + error.message });
  }
});

// 创建新商品
router.post('/', async (req, res) => {
  try {
    const { name, productName, category, size, color, price, costPrice, supplier, barcode, customCode, description, image, stockAlert, status } = req.body;

    if (!name || !category || !size || !color || !price || !costPrice) {
      return res.status(400).json({ status: 'error', message: '商品名称、分类、尺寸、颜色、售价和成本价不能为空' });
    }

    const product = new Product({
      name,
      productName,
      category,
      size,
      color,
      price,
      costPrice,
      supplier,
      barcode,
      customCode,
      description,
      image,
      stockAlert: stockAlert || 10,
      status: status || '启用'
    });

    await product.save();

    res.status(201).json({
      status: 'success',
      message: '商品创建成功',
      data: product
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 更新商品
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: '商品不存在' });
    }

    const { name, productName, category, size, color, price, costPrice, supplier, barcode, customCode, description, image, stockAlert, status } = req.body;

    // 更新商品信息
    if (name) product.name = name;
    if (productName !== undefined) product.productName = productName;
    if (category) product.category = category;
    if (size) product.size = size;
    if (color) product.color = color;
    if (price) product.price = price;
    if (costPrice) product.costPrice = costPrice;
    if (supplier) product.supplier = supplier;
    if (barcode !== undefined) product.barcode = barcode;
    if (customCode !== undefined) product.customCode = customCode;
    if (description) product.description = description;
    if (image) product.image = image;
    if (stockAlert !== undefined) product.stockAlert = stockAlert;
    if (status) product.status = status;

    await product.save();

    res.status(200).json({
      status: 'success',
      message: '商品更新成功',
      data: product
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 删除商品
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: '商品不存在' });
    }
    
    await product.deleteOne();
    
    res.status(200).json({
      status: 'success',
      message: '商品删除成功'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
