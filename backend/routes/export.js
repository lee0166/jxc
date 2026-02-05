const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const contentDisposition = require('content-disposition');
const Product = require('../models/Product');
const Sales = require('../models/Sales');
const Inbound = require('../models/Inbound');
const Inventory = require('../models/Inventory');
const auth = require('../middleware/auth');

// 导出库存数据
router.get('/inventory', auth, async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    
    // 计算时间范围
    const now = new Date();
    let startDate = null;
    let endDate = null;
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const dayOfWeek = now.getDay() || 7;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      case 'all':
      default:
        // 不限制时间范围
        break;
    }
    
    // 构建查询条件
    const productQuery = {};
    
    // 如果有时间范围，只导出在该时间范围内有入库记录的商品
    if (startDate && endDate) {
      const inboundProductIds = await Inbound.distinct('productId', {
        createdAt: { $gte: startDate, $lt: endDate }
      });
      productQuery._id = { $in: inboundProductIds };
    }
    
    // 获取商品
    const products = await Product.find(productQuery).lean();
    
    // 获取销售统计数据（累计销量 - 限制在时间范围内）
    const salesQuery = {};
    if (startDate && endDate) {
      salesQuery.createdAt = { $gte: startDate, $lt: endDate };
    }
    const salesStats = await Sales.aggregate([
      { $match: salesQuery },
      {
        $group: {
          _id: '$productId',
          totalSales: { $sum: '$quantity' }
        }
      }
    ]);
    const salesMap = {};
    salesStats.forEach(stat => {
      salesMap[stat._id.toString()] = stat.totalSales;
    });

    // 获取入库统计数据（最后入库日期 - 限制在时间范围内）
    const inboundQuery = {};
    if (startDate && endDate) {
      inboundQuery.createdAt = { $gte: startDate, $lt: endDate };
    }
    const inboundStats = await Inbound.aggregate([
      { $match: inboundQuery },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$productId',
          lastInboundDate: { $first: '$createdAt' }
        }
      }
    ]);
    const inboundMap = {};
    inboundStats.forEach(stat => {
      inboundMap[stat._id.toString()] = stat.lastInboundDate;
    });

    // 构建导出数据
    const exportData = products.map(product => {
      const productId = product._id.toString();
      const totalSales = salesMap[productId] || 0;
      const lastInboundDate = inboundMap[productId];

      return {
        商品编码: product.barcode || product.customCode || '-',
        商品名称: product.productName || product.name || '-',
        品类: product.name || '-',
        颜色: product.color || '-',
        尺码: product.size || '-',
        库存数量: product.stock || 0,
        进货成本: product.costPrice || 0,
        销售单价: product.price || 0,
        供应商: product.supplier || '-',
        库存预警值: product.stockAlert || 10,
        商品备注: product.description || '',
        累计销量: totalSales,
        最后入库日期: lastInboundDate ? formatDate(lastInboundDate) : '-'
      };
    });

    // 生成CSV
    const fields = [
      '商品编码', '商品名称', '品类', '颜色', '尺码', 
      '库存数量', '进货成本', '销售单价', '供应商',
      '库存预警值', '商品备注', '累计销量', '最后入库日期'
    ];
    const parser = new Parser({ fields });
    const csv = '\uFEFF' + parser.parse(exportData);
    
    // 生成文件名并使用content-disposition库处理编码
    const filename = `inventory_data_${timeRange}_${formatDate(new Date())}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', contentDisposition(filename));
    res.send(csv);

  } catch (error) {
    console.error('导出库存数据失败:', error);
    res.status(500).json({
      status: 'error',
      message: '导出库存数据失败: ' + error.message
    });
  }
});

// 导出销售数据
router.get('/sales', auth, async (req, res) => {
  try {
    // 获取所有销售记录并关联商品信息
    const sales = await Sales.find({})
      .populate('productId', 'name productName color size barcode customCode')
      .sort({ createdAt: -1 })
      .lean();

    // 构建导出数据
    const exportData = sales.map((sale, index) => {
      const product = sale.productId || {};
      return {
        序号: index + 1,
        销售单号: `XS${sale._id.toString().slice(-8).toUpperCase()}`,
        销售日期: formatDateTime(sale.createdAt),
        商品编码: product.barcode || product.customCode || '-',
        商品名称: product.productName || product.name || '-',
        品类: product.name || '-',
        颜色: product.color || '-',
        尺码: product.size || '-',
        销售数量: sale.quantity || 0,
        销售单价: sale.unitPrice || 0,
        销售金额: sale.totalAmount || 0,
        客户名称: sale.customerName || '-',
        收款方式: formatPaymentMethod(sale.paymentMethod)
      };
    });

    // 生成CSV
    const fields = [
      '序号', '销售单号', '销售日期', '商品编码', '商品名称', 
      '品类', '颜色', '尺码', '销售数量', '销售单价', 
      '销售金额', '客户名称', '收款方式'
    ];
    const parser = new Parser({ fields });
    const csv = '\uFEFF' + parser.parse(exportData);

    // 设置响应头
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=销售数据_${formatDate(new Date())}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('导出销售数据失败:', error);
    res.status(500).json({
      status: 'error',
      message: '导出销售数据失败: ' + error.message
    });
  }
});

// 格式化日期
function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 格式化日期时间
function formatDateTime(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 格式化收款方式
function formatPaymentMethod(method) {
  const methodMap = {
    'cash': '现金',
    'wechat': '微信',
    'alipay': '支付宝',
    'card': '银行卡'
  };
  return methodMap[method] || method || '-';
}

module.exports = router;
