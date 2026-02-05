const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 用户Schema定义
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// 数据库连接
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoe-inventory');
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error.message);
    process.exit(1);
  }
};

// 初始化默认用户
const initDefaultUser = async () => {
  try {
    // 检查是否已存在用户
    const existingUser = await User.findOne({ username: 'admin' });
    
    if (existingUser) {
      console.log('默认用户已存在，无需创建');
      console.log('用户名: admin');
      console.log('密码: 123456');
      return;
    }
    
    // 手动加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    // 创建默认用户
    const defaultUser = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });
    
    await defaultUser.save();
    console.log('默认用户创建成功！');
    console.log('用户名: admin');
    console.log('密码: 123456');
    
  } catch (error) {
    console.error('创建默认用户失败:', error.message);
    console.error(error);
  }
};

// 执行初始化
const run = async () => {
  await connectDB();
  await initDefaultUser();
  
  // 关闭数据库连接
  await mongoose.connection.close();
  console.log('数据库连接已关闭');
  process.exit(0);
};

run();
