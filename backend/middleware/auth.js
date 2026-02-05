const jwt = require('jsonwebtoken');

// JWT认证中间件
const authMiddleware = (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error', 
        message: '未提供认证令牌' 
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        status: 'error',
        message: '服务器配置错误'
      });
    }
    const decoded = jwt.verify(token, secret);
    
    // 将用户信息附加到请求对象
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('认证失败:', error.message);
    return res.status(401).json({ 
      status: 'error', 
      message: '认证失败: ' + error.message 
    });
  }
};

module.exports = authMiddleware;
