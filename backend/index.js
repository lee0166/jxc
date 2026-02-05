const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoe-inventory');
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error.message);
    console.warn('服务器将在没有数据库连接的情况下继续运行，某些功能可能不可用');
  }
};

// 连接数据库
connectDB();

// 路由导入和配置
const productRoutes = require('./routes/products');
const inboundRoutes = require('./routes/inbound');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const backupRoutes = require('./routes/backup');
const exportRoutes = require('./routes/export');

// 路由使用
app.use('/api/products', productRoutes);
app.use('/api/inbound', inboundRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/export', exportRoutes);

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '服务运行正常' });
});

// 清空数据库路由（需要管理员权限）
const authMiddleware = require('./middleware/auth');
app.post('/api/system/clear-database', authMiddleware, async (req, res) => {
  try {
    // 检查是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: '只有管理员可以清空数据库' });
    }

    // 获取所有模型并清空
    const Product = require('./models/Product');
    const Inbound = require('./models/Inbound');
    const Sales = require('./models/Sales');
    const Inventory = require('./models/Inventory');

    await Product.deleteMany({});
    await Inbound.deleteMany({});
    await Sales.deleteMany({});
    await Inventory.deleteMany({});

    res.json({ status: 'success', message: '数据库已清空' });
  } catch (error) {
    console.error('清空数据库失败:', error);
    res.status(500).json({ status: 'error', message: '清空数据库失败: ' + error.message });
  }
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: '路由不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err.message);
  res.status(500).json({ 
    status: 'error', 
    message: err.message || '服务器内部错误' 
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;