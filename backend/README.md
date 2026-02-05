# 鞋店库存管理系统 - 后端部署指南

## 项目结构

```
backend/
├── models/           # MongoDB数据库模型
│   ├── User.js       # 用户模型
│   ├── Product.js    # 商品模型
│   ├── Inbound.js    # 入库记录模型
│   └── Sales.js      # 销售记录模型
├── routes/           # API路由
│   ├── users.js      # 用户管理路由
│   ├── products.js   # 商品管理路由
│   ├── inbound.js    # 入库管理路由
│   ├── sales.js      # 销售管理路由
│   ├── inventory.js  # 库存管理路由
│   └── stats.js      # 统计数据路由
├── .env              # 环境变量配置
├── index.js          # 主服务器文件
├── package.json      # 项目配置和依赖
└── README.md         # 部署指南
```

## 本地部署步骤

### 1. 前置条件

- Node.js 16.x 或更高版本
- npm 7.x 或更高版本
- MongoDB 4.x 或更高版本（可选，用于完整功能测试）

### 2. 安装依赖

```bash
# 进入backend目录
cd backend

# 安装依赖
npm install
```

### 3. 环境配置

复制 `.env` 文件并根据实际情况修改配置：

```bash
# 复制环境变量配置文件（如果不存在）
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000

# MongoDB数据库连接配置
# 本地MongoDB连接字符串（默认端口）
MONGODB_URI=mongodb://localhost:27017/shoe-inventory

# JWT认证配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS配置
CORS_ORIGIN=http://localhost:5173

# 日志级别
LOG_LEVEL=info

# 环境模式
NODE_ENV=development
```

### 4. 启动服务器

#### 开发模式（带热重载）

```bash
npm run dev
```

#### 生产模式

```bash
npm start
```

服务器默认运行在 `http://localhost:3000`

## API测试指南

### 健康检查

```bash
# 测试服务器是否正常运行
curl http://localhost:3000/api/health
```

预期响应：
```json
{
  "status": "ok",
  "message": "服务运行正常"
}
```

### 主要API端点

#### 用户管理
- `POST /api/users/login` - 用户登录
- `GET /api/users/me` - 获取当前用户信息
- `GET /api/users` - 获取所有用户（仅管理员）
- `POST /api/users` - 创建新用户（仅管理员）

#### 商品管理
- `GET /api/products` - 获取商品列表
- `GET /api/products/:id` - 获取单个商品详情
- `POST /api/products` - 创建新商品
- `PUT /api/products/:id` - 更新商品信息
- `DELETE /api/products/:id` - 删除商品
- `GET /api/products/categories/list` - 获取商品分类列表

#### 入库管理
- `POST /api/inbound` - 创建入库记录
- `GET /api/inbound` - 获取入库记录列表
- `GET /api/inbound/:id` - 获取单个入库记录详情
- `GET /api/inbound/stats/summary` - 获取入库统计

#### 销售管理
- `POST /api/sales` - 创建销售记录
- `GET /api/sales` - 获取销售记录列表
- `GET /api/sales/:id` - 获取单个销售记录详情
- `GET /api/sales/stats/summary` - 获取销售统计
- `GET /api/sales/stats/daily` - 获取按日期分组的销售统计

#### 库存管理
- `GET /api/inventory` - 获取库存列表
- `GET /api/inventory/low` - 获取库存不足的商品
- `GET /api/inventory/stats` - 获取库存统计
- `PUT /api/inventory/batch` - 批量更新库存

#### 统计分析
- `GET /api/stats/overview` - 获取系统概览统计
- `GET /api/stats/sales/trend` - 获取销售趋势统计
- `GET /api/stats/products/top` - 获取热门商品统计
- `GET /api/stats/categories/sales` - 获取分类销售统计

## 测试示例

### 1. 创建商品

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nike Air Max",
    "category": "运动鞋",
    "size": "42",
    "color": "黑色",
    "price": 899,
    "costPrice": 599,
    "supplier": "Nike官方",
    "description": "经典运动鞋",
    "image": ""
  }'
```

### 2. 商品入库

```bash
curl -X POST http://localhost:3000/api/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "商品ID",
    "quantity": 10,
    "supplier": "Nike官方",
    "batchNumber": "20240101",
    "totalCost": 5990,
    "notes": "新品入库"
  }'
```

### 3. 创建销售记录

```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "商品ID",
    "quantity": 2,
    "unitPrice": 899,
    "totalAmount": 1798,
    "customerName": "张三",
    "paymentMethod": "cash",
    "notes": "零售销售"
  }'
```

## 常见问题解决

### 1. MongoDB连接失败

**问题**：服务器启动时显示 "MongoDB连接失败"

**解决方案**：
- 确保MongoDB服务已启动
- 检查MongoDB连接字符串是否正确
- 如果不需要完整功能测试，可以忽略此错误，服务器会在没有数据库连接的情况下继续运行

### 2. 端口被占用

**问题**：启动时显示 "端口被占用"

**解决方案**：
- 修改 `.env` 文件中的 `PORT` 配置，使用其他端口
- 或者停止占用该端口的其他进程

### 3. 依赖安装失败

**问题**：`npm install` 命令执行失败

**解决方案**：
- 确保网络连接正常
- 尝试使用 `npm install --legacy-peer-deps` 命令
- 检查Node.js版本是否符合要求

### 4. API请求失败

**问题**：发送API请求时返回错误

**解决方案**：
- 检查请求URL是否正确
- 确保请求方法（GET/POST/PUT/DELETE）正确
- 验证请求体格式是否为JSON
- 检查请求参数是否完整

## 功能说明

- **用户认证**：基于JWT的用户认证系统
- **商品管理**：完整的商品CRUD操作
- **库存管理**：实时库存跟踪和管理
- **入库管理**：记录商品入库信息
- **销售管理**：记录商品销售信息
- **统计分析**：提供销售趋势、库存统计等数据

## 技术栈

- Express.js - Web服务器框架
- MongoDB + Mongoose - 数据库和ODM
- JWT - 用户认证
- CORS - 跨域资源共享
- Dotenv - 环境变量管理
- Nodemon - 开发模式热重载

## 后续步骤

1. **完整功能测试**：启动MongoDB服务，测试完整的数据库操作功能
2. **前端集成**：将后端API与前端Vue应用集成
3. **部署到生产环境**：配置生产环境变量，部署到云服务器或本地服务器
4. **监控和维护**：设置日志监控，定期备份数据库

## 联系信息

如有任何问题或建议，请联系开发团队。