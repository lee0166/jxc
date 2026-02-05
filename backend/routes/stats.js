const express = require('express');
const Product = require('../models/Product');
const Sales = require('../models/Sales');
const Inbound = require('../models/Inbound');
const User = require('../models/User');
const router = express.Router();

// 获取系统概览统计
router.get('/overview', async (req, res) => {
  try {
    // 获取今日和昨日日期范围
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    // 同时执行多个统计查询
    const [productStats, salesStats, inboundStats, userStats, todaySales, yesterdaySales, weekSales, monthSales, yearSales] = await Promise.all([
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $count: {} },
            totalStock: { $sum: '$stock' },
            totalValue: { $sum: { $multiply: ['$stock', '$price'] } }
          }
        }
      ]),
      Sales.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $count: {} },
            totalSalesAmount: { $sum: '$totalAmount' },
            totalSalesQuantity: { $sum: '$quantity' }
          }
        }
      ]),
      Inbound.aggregate([
        {
          $group: {
            _id: null,
            totalInbound: { $count: {} },
            totalInboundCost: { $sum: '$totalCost' },
            totalInboundQuantity: { $sum: '$quantity' }
          }
        }
      ]),
      User.countDocuments(),
      // 今日销售
      Sales.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]),
      // 昨日销售
      Sales.aggregate([
        { $match: { createdAt: { $gte: yesterday, $lt: today } } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]),
      // 本周销售
      Sales.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]),
      // 本月销售
      Sales.aggregate([
        { $match: { createdAt: { $gte: monthAgo } } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]),
      // 本年销售
      Sales.aggregate([
        { $match: { createdAt: { $gte: yearAgo } } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ])
    ]);
    
    // 计算库存状态（正常、预警、缺货）
    const products = await Product.find({});
    let normalCount = 0;
    let lowCount = 0;
    let zeroCount = 0;
    
    products.forEach(product => {
      const stock = product.stock || 0;
      // 假设预警值为10，可以根据实际需求调整
      const alertThreshold = 10;
      
      if (stock === 0) {
        zeroCount++;
      } else if (stock < alertThreshold) {
        lowCount++;
      } else {
        normalCount++;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        products: {
          ...(productStats[0] || { totalProducts: 0, totalStock: 0, totalValue: 0 }),
          normal: normalCount,
          low: lowCount,
          zero: zeroCount
        },
        sales: {
          totalSales: salesStats[0]?.totalSales || 0,
          totalSalesAmount: salesStats[0]?.totalSalesAmount || 0,
          totalSalesQuantity: salesStats[0]?.totalSalesQuantity || 0,
          today: todaySales[0]?.totalAmount || 0,
          yesterday: yesterdaySales[0]?.totalAmount || 0,
          week: weekSales[0]?.totalAmount || 0,
          month: monthSales[0]?.totalAmount || 0,
          year: yearSales[0]?.totalAmount || 0
        },
        inbound: inboundStats[0] || {
          totalInbound: 0,
          totalInboundCost: 0,
          totalInboundQuantity: 0
        },
        users: userStats
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取销售趋势统计
router.get('/sales/trend', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // 根据days参数计算开始时间
    let startDate;
    const now = new Date();
    
    switch (parseInt(days)) {
      case 1: // 今日：当天0点
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 7: // 本周：本周一0点
        const dayOfWeek = now.getDay() || 7;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1);
        break;
      case 30: // 本月：本月1号0点
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 365: // 本年：本年1月1号0点
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    const salesTrend = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          salesCount: { $count: {} },
          salesAmount: { $sum: '$totalAmount' },
          salesQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: salesTrend
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取热门商品统计
router.get('/products/top', async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;
    
    // 根据days参数计算开始时间
    let startDate;
    const now = new Date();
    
    switch (parseInt(days)) {
      case 1: // 今日：当天0点
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 7: // 本周：本周一0点
        const dayOfWeek = now.getDay() || 7;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1);
        break;
      case 30: // 本月：本月1号0点
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 365: // 本年：本年1月1号0点
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    const topProducts = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$productId',
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' },
          salesCount: { $count: {} }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$productInfo.name',
          customCode: '$productInfo.customCode',
          category: '$productInfo.category',
          size: '$productInfo.size',
          color: '$productInfo.color',
          totalQuantity: 1,
          totalAmount: 1,
          salesCount: 1
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: topProducts
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取分类销售统计
router.get('/categories/sales', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // 根据days参数计算开始时间
    let startDate;
    const now = new Date();
    
    switch (parseInt(days)) {
      case 1: // 今日：当天0点
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 7: // 本周：本周一0点
        const dayOfWeek = now.getDay() || 7; // 周日是0，转为7
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1);
        break;
      case 30: // 本月：本月1号0点
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 365: // 本年：本年1月1号0点
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    const categorySales = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $group: {
          _id: '$productInfo.category',
          totalSales: { $count: {} },
          totalAmount: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: categorySales
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取毛利率统计
router.get('/profit/margin', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    
    // 获取销售数据
    const [todaySales, weekSales, monthSales, yearSales] = await Promise.all([
      Sales.aggregate([
        {
          $match: {
            createdAt: { $gte: today }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          $unwind: '$productInfo'
        },
        {
          $group: {
            _id: null,
            salesAmount: { $sum: '$totalAmount' },
            costAmount: { $sum: { $multiply: ['$quantity', '$productInfo.costPrice'] } }
          }
        }
      ]),
      Sales.aggregate([
        {
          $match: {
            createdAt: { $gte: weekAgo }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          $unwind: '$productInfo'
        },
        {
          $group: {
            _id: null,
            salesAmount: { $sum: '$totalAmount' },
            costAmount: { $sum: { $multiply: ['$quantity', '$productInfo.costPrice'] } }
          }
        }
      ]),
      Sales.aggregate([
        {
          $match: {
            createdAt: { $gte: monthAgo }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          $unwind: '$productInfo'
        },
        {
          $group: {
            _id: null,
            salesAmount: { $sum: '$totalAmount' },
            costAmount: { $sum: { $multiply: ['$quantity', '$productInfo.costPrice'] } }
          }
        }
      ]),
      Sales.aggregate([
        {
          $match: {
            createdAt: { $gte: yearAgo }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          $unwind: '$productInfo'
        },
        {
          $group: {
            _id: null,
            salesAmount: { $sum: '$totalAmount' },
            costAmount: { $sum: { $multiply: ['$quantity', '$productInfo.costPrice'] } }
          }
        }
      ])
    ]);
    
    const calculateMargin = (sales, cost) => {
      if (!sales || sales === 0) return { marginAmount: 0, margin: 0 };
      const marginAmount = sales - cost;
      const margin = (marginAmount / sales) * 100;
      return { marginAmount, margin };
    };
    
    const todayData = todaySales[0] || { salesAmount: 0, costAmount: 0 };
    const weekData = weekSales[0] || { salesAmount: 0, costAmount: 0 };
    const monthData = monthSales[0] || { salesAmount: 0, costAmount: 0 };
    const yearData = yearSales[0] || { salesAmount: 0, costAmount: 0 };
    
    const todayMargin = calculateMargin(todayData.salesAmount, todayData.costAmount);
    const weekMargin = calculateMargin(weekData.salesAmount, weekData.costAmount);
    const monthMargin = calculateMargin(monthData.salesAmount, monthData.costAmount);
    const yearMargin = calculateMargin(yearData.salesAmount, yearData.costAmount);
    
    const marginData = {
      today: {
        salesAmount: todayData.salesAmount,
        costAmount: todayData.costAmount,
        marginAmount: todayMargin.marginAmount,
        margin: parseFloat(todayMargin.margin.toFixed(1))
      },
      week: {
        salesAmount: weekData.salesAmount,
        costAmount: weekData.costAmount,
        marginAmount: weekMargin.marginAmount,
        margin: parseFloat(weekMargin.margin.toFixed(1))
      },
      month: {
        salesAmount: monthData.salesAmount,
        costAmount: monthData.costAmount,
        marginAmount: monthMargin.marginAmount,
        margin: parseFloat(monthMargin.margin.toFixed(1))
      },
      year: {
        salesAmount: yearData.salesAmount,
        costAmount: yearData.costAmount,
        marginAmount: yearMargin.marginAmount,
        margin: parseFloat(yearMargin.margin.toFixed(1))
      }
    };
    
    res.status(200).json({
      status: 'success',
      data: marginData
    });
  } catch (error) {
    console.error('获取毛利率统计失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取毛利率统计失败: ' + error.message
    });
  }
});

// 获取毛利率趋势
router.get('/profit/trend', async (req, res) => {
  try {
    const { period = 'week', days = 30 } = req.query;
    const now = new Date();
    let startDate, groupFormat;
    
    if (period === 'week') {
      // 周趋势
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      // 按天分组
      groupFormat = '%Y-%m-%d';
    } else if (period === 'month') {
      // 月趋势
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      // 按周分组
      groupFormat = '%Y-%U'; // ISO周数
    } else {
      // 年趋势
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
      // 按季度分组
      groupFormat = '%Y-%m';
    }
    
    // 获取销售趋势数据
    const trendData = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$createdAt'
            }
          },
          salesAmount: { $sum: '$totalAmount' },
          costAmount: { $sum: { $multiply: ['$quantity', '$productInfo.costPrice'] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // 转换数据格式
    const formattedData = trendData.map(item => {
      let label = item._id;
      // 格式化标签
      if (period === 'week') {
        // 转换为星期几
        const date = new Date(item._id);
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        label = weekdays[date.getDay()];
      } else if (period === 'month') {
        // 转换为第n周
        const [year, week] = item._id.split('-');
        label = `第${parseInt(week) - parseInt(new Date(year, 0, 1).getDay() === 0 ? 0 : 1) + 1}周`;
      } else {
        // 转换为季度
        const [year, month] = item._id.split('-');
        const quarter = Math.floor((parseInt(month) - 1) / 3) + 1;
        label = `Q${quarter}`;
      }
      
      // 计算毛利率
      const margin = item.salesAmount > 0 ? ((item.salesAmount - item.costAmount) / item.salesAmount) * 100 : 0;
      
      return {
        label,
        salesAmount: item.salesAmount,
        costAmount: item.costAmount,
        margin: parseFloat(margin.toFixed(1))
      };
    });
    
    // 如果没有数据，返回空数组
    if (formattedData.length === 0) {
      res.status(200).json({
        status: 'success',
        data: []
      });
      return;
    }
    
    res.status(200).json({
      status: 'success',
      data: formattedData
    });
  } catch (error) {
    console.error('获取毛利率趋势失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取毛利率趋势失败: ' + error.message
    });
  }
});

// 获取最近记录（用于首页展示）
router.get('/recent-records', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // 获取最近的销售记录
    const recentSales = await Sales.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('productId', 'name category size color');
    
    // 获取最近的入库记录
    const recentInbound = await Inbound.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('productId', 'name category size color');
    
    // 合并并格式化记录
    const records = [];
    
    // 处理销售记录
    recentSales.forEach(sale => {
      records.push({
        type: 'outbound',
        icon: 'sales',
        title: '商品销售',
        time: sale.createdAt,
        quantity: sale.quantity,
        value: sale.totalAmount,
        productName: sale.productId?.name || '未知商品',
        operator: sale.operator || '未知用户'
      });
    });
    
    // 处理入库记录
    recentInbound.forEach(inbound => {
      records.push({
        type: 'inbound',
        icon: 'inbound',
        title: '商品入库',
        time: inbound.createdAt,
        quantity: inbound.quantity,
        value: inbound.totalCost,
        productName: inbound.productId?.name || '未知商品',
        operator: inbound.operator || '未知用户'
      });
    });
    
    // 按时间排序并限制数量
    records.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedRecords = records.slice(0, parseInt(limit));
    
    // 格式化时间
    const formattedRecords = limitedRecords.map(record => ({
      ...record,
      time: new Date(record.time).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/\//g, '-')
    }));
    
    res.status(200).json({
      status: 'success',
      data: formattedRecords
    });
  } catch (error) {
    console.error('获取最近记录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取最近记录失败: ' + error.message
    });
  }
});

module.exports = router;