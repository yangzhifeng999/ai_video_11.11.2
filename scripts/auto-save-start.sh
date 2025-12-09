#!/bin/bash
# Linux/Mac shell脚本 - 启动自动保存服务

echo "正在启动自动保存版本服务..."
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 切换到项目根目录
cd "$(dirname "$0")/.."

# 启动服务
node scripts/auto-save.js

