#!/bin/bash

# 微信提现API服务 - 快速启动脚本

echo "🚀 微信提现API服务 - 启动脚本"
echo "================================"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到Node.js，请先安装Node.js"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

# 检查配置文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env配置文件"
    echo "📝 正在从示例创建.env..."
    cp .env.example .env
    echo "✅ 已创建.env文件"
    echo "⚠️  请编辑.env文件，填入真实的配置信息"
    echo ""
fi

# 检查证书文件
if [ ! -f "config/apiclient_key.pem" ] || [ ! -f "config/apiclient_cert.pem" ]; then
    echo "⚠️  未找到证书文件"
    echo "请将以下文件放到 config/ 目录："
    echo "  - apiclient_key.pem"
    echo "  - apiclient_cert.pem"
    echo ""
fi

# 设置私钥权限
if [ -f "config/apiclient_key.pem" ]; then
    chmod 600 config/apiclient_key.pem
    echo "✅ 私钥文件权限已设置"
fi

# 启动服务
echo ""
echo "🚀 正在启动服务..."
echo "================================"

if [ "$1" == "dev" ]; then
    echo "开发模式（自动重启）"
    npm run dev
else
    echo "生产模式"
    npm start
fi
