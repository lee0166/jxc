# 部署指南

## 系统要求

- Node.js >= 18.0.0
- MongoDB Atlas 账号（或自建 MongoDB）
- Linux/Windows 服务器

## 部署步骤

### 1. 环境准备

```bash
# 克隆代码
git clone <your-repo-url>
cd JXC

# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑 .env 文件，填入实际配置
nano backend/.env
```

**必须修改的配置项：**

```env
# MongoDB 连接字符串（从 MongoDB Atlas 获取）
MONGODB_URI=mongodb+srv://用户名:密码@cluster.mongodb.net/shoe-inventory

# JWT 密钥（生成强密钥）
# 执行: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=生成的64位十六进制字符串

# 生产环境 CORS 配置（改为你的前端域名）
CORS_ORIGIN=https://your-domain.com

# 环境模式
NODE_ENV=production
```

### 3. 构建前端

```bash
# 在项目根目录执行
npm run build

# 构建输出在 dist/ 目录
```

### 4. 启动后端服务

#### 方式一：直接启动（测试用）

```bash
cd backend
npm start
```

#### 方式二：PM2 启动（推荐用于生产）

```bash
# 安装 PM2
npm install -g pm2

# 使用 PM2 启动
cd backend
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs jxc-backend

# 重启
pm2 restart jxc-backend

# 停止
pm2 stop jxc-backend
```

### 5. Nginx 配置（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/JXC/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. 配置 HTTPS（使用 Certbot）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

## 目录结构

```
JXC/
├── backend/           # 后端代码
│   ├── index.js      # 入口文件
│   ├── routes/       # API 路由
│   ├── models/       # 数据模型
│   ├── middleware/   # 中间件
│   ├── .env          # 环境变量（不提交到Git）
│   └── package.json
├── dist/             # 前端构建输出
├── src/              # 前端源码
├── .gitignore
├── package.json
└── DEPLOY.md         # 本文件
```

## 常见问题

### 1. 数据库连接失败

- 检查 MongoDB Atlas 白名单是否包含服务器IP
- 确认用户名密码正确
- 检查网络连接

### 2. 前端无法访问后端

- 确认 CORS_ORIGIN 配置正确
- 检查 Nginx 代理配置
- 查看后端日志

### 3. JWT 验证失败

- 确认 JWT_SECRET 已设置且前后端一致
- 检查 token 是否过期

## 备份策略

建议定期备份数据库：

```bash
# 使用 mongodump
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/shoe-inventory" --out=/backup/$(date +%Y%m%d)
```

或使用系统内置的备份功能（管理员登录后，系统配置 → 数据备份）

## 更新部署

```bash
# 拉取最新代码
git pull

# 安装新依赖
npm install
cd backend && npm install && cd ..

# 重新构建前端
npm run build

# 重启后端
pm2 restart jxc-backend
```
