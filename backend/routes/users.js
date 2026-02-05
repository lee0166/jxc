const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// 生成JWT令牌
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: '用户名和密码不能为空' });
    }
    
    // 数据库连接正常时的逻辑
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ status: 'error', message: '用户名或密码错误' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: '用户名或密码错误' });
    }
    
    const token = generateToken(user);
    
    res.status(200).json({
      status: 'success',
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ status: 'error', message: '未提供认证令牌' });
    }
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ status: 'error', message: '服务器配置错误' });
    }
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: '用户不存在' });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取所有用户（仅管理员）
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 创建新用户（仅管理员）
router.post('/', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: '用户名和密码不能为空' });
    }

    // 检查数据库连接状态
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ status: 'error', message: '数据库未连接，请稍后重试' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: '用户名已存在' });
    }

    const user = new User({
      username,
      password,
      role: role || 'user'
    });

    await user.save();

    res.status(201).json({
      status: 'success',
      message: '用户创建成功',
      data: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ status: 'error', message: error.message || '创建用户失败' });
  }
});

module.exports = router;