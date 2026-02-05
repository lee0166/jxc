#!/bin/bash

# 部署脚本
# 用法: ./deploy.sh

set -e

echo "🚀 开始部署 JXC 进销存管理系统..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 步骤 1: 安装前端依赖...${NC}"
npm install

echo -e "${YELLOW}📦 步骤 2: 安装后端依赖...${NC}"
cd backend
npm install
cd ..

echo -e "${YELLOW}🏗️ 步骤 3: 构建前端...${NC}"
npm run build

echo -e "${YELLOW}🔧 步骤 4: 检查环境变量...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}错误: backend/.env 文件不存在${NC}"
    echo "请复制 backend/.env.example 到 backend/.env 并配置"
    exit 1
fi

echo -e "${YELLOW}🚀 步骤 5: 启动/重启后端服务...${NC}"
cd backend

# 检查 PM2 是否安装
if command -v pm2 &> /dev/null; then
    echo "使用 PM2 启动服务..."
    pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
    pm2 save
else
    echo -e "${YELLOW}警告: PM2 未安装，使用 node 直接启动${NC}"
    echo "建议安装 PM2: npm install -g pm2"
    nohup node index.js > app.log 2>&1 &
fi

cd ..

echo -e "${GREEN}✅ 部署完成!${NC}"
echo ""
echo "📋 后续步骤:"
echo "1. 配置 Nginx: 将 nginx.conf 复制到 /etc/nginx/sites-available/"
echo "2. 配置 HTTPS: 运行 certbot --nginx"
echo "3. 检查服务状态: pm2 status"
echo "4. 查看日志: pm2 logs jxc-backend"
echo ""
echo "🌐 访问地址:"
echo "- 前端: http://your-domain.com"
echo "- 后端 API: http://your-domain.com/api"
echo "- 健康检查: http://your-domain.com/api/health"
