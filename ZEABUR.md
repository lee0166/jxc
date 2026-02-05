# Zeabur 部署指南

本指南介绍如何将 JXC 进销存管理系统部署到 [Zeabur](https://zeabur.com) 平台。

## 🚀 快速部署

### 1. 准备代码

确保代码已推送到 GitHub：
```bash
git add .
git commit -m "Add Zeabur deployment config"
git push origin main
```

### 2. 在 Zeabur 创建项目

1. 登录 [Zeabur Dashboard](https://dash.zeabur.com)
2. 点击 "Create Project"
3. 选择 "Deploy from GitHub"
4. 授权并选择 `jxc` 仓库

### 3. 部署后端服务

1. 点击 "Add Service" → "Git"
2. 选择 `jxc` 仓库
3. 在 "Root Directory" 中输入 `backend`
4. Zeabur 会自动识别为 Node.js 项目
5. 点击 "Deploy"

#### 配置后端环境变量

部署完成后，在服务设置中添加以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `MONGODB_URI` | MongoDB 连接字符串 | `mongodb+srv://user:pass@cluster.mongodb.net/shoe-inventory` |
| `JWT_SECRET` | JWT 签名密钥 | 使用 `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` 生成 |
| `JWT_EXPIRES_IN` | Token 过期时间 | `24h` |
| `CORS_ORIGIN` | 允许的前端域名 | `https://jxc-frontend.zeabur.app` |
| `NODE_ENV` | 环境模式 | `production` |

**注意**：`PORT` 不需要设置，Zeabur 会自动分配。

### 4. 部署前端服务

1. 再次点击 "Add Service" → "Git"
2. 选择 `jxc` 仓库
3. Root Directory 保持为空（使用根目录）
4. 在 "Build Command" 中输入：`npm install && npm run build`
5. 在 "Output Directory" 中输入：`dist`
6. 点击 "Deploy"

#### 配置前端环境变量

在前端服务设置中添加：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `https://jxc-backend.zeabur.app/api` |

**注意**：需要先部署后端，获取后端域名后再配置前端。

### 5. 更新 CORS 配置

获取前端域名后（如 `https://jxc-frontend.zeabur.app`），更新后端服务的 `CORS_ORIGIN` 环境变量。

### 6. 验证部署

- 后端健康检查：`https://your-backend.zeabur.app/api/health`
- 前端页面：`https://your-frontend.zeabur.app`

## 📁 部署配置文件

### zeabur.json

项目根目录的 `zeabur.json` 定义了两个服务：

```json
{
  "services": [
    {
      "name": "backend",
      "type": "node",
      "path": "backend",
      "build": { "command": "npm install" },
      "run": { "command": "npm start" }
    },
    {
      "name": "frontend",
      "type": "node",
      "path": ".",
      "build": { "command": "npm install && npm run build" },
      "run": { "command": "npx serve -s dist -l $PORT" }
    }
  ]
}
```

## 🔧 常见问题

### 1. 后端无法连接数据库

- 检查 `MONGODB_URI` 是否正确
- 确认 MongoDB Atlas 白名单已添加 Zeabur 的 IP 段
- 检查用户名密码是否正确

### 2. 前端无法访问后端 API

- 检查 `VITE_API_BASE_URL` 是否正确设置为后端域名
- 检查后端 `CORS_ORIGIN` 是否设置为前端域名
- 确认后端服务已正常运行

### 3. 构建失败

- 检查 Node.js 版本是否为 18+
- 查看构建日志排查错误
- 确认 `package.json` 中的依赖完整

### 4. 环境变量未生效

- 修改环境变量后需要重新部署服务
- 确认变量名拼写正确

## 📝 更新部署

代码更新后，Zeabur 会自动重新部署：

```bash
git add .
git commit -m "Update features"
git push origin main
```

Zeabur 会自动检测代码变更并重新构建部署。

## 🔒 安全建议

1. **JWT_SECRET**: 使用强随机字符串，不要泄露
2. **MongoDB 密码**: 使用强密码，定期更换
3. **CORS 配置**: 生产环境不要设置为 `*`，应指定前端域名
4. **数据库白名单**: 仅允许 Zeabur 的 IP 段访问 MongoDB

## 💡 使用自定义域名

1. 在 Zeabur 服务设置中找到 "Domain"
2. 点击 "Add Domain"
3. 输入你的域名（如 `jxc.yourdomain.com`）
4. 按照提示配置 DNS 记录
5. 等待 DNS 生效

## 📚 相关文档

- [Zeabur 官方文档](https://docs.zeabur.com)
- [MongoDB Atlas 文档](https://docs.atlas.mongodb.com)
- [Vue 3 部署指南](https://vitejs.dev/guide/static-deploy.html)

---

如有问题，请查看 Zeabur 官方文档或提交 Issue。
