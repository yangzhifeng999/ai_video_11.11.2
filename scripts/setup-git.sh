#!/bin/bash
# Git配置和GitHub连接脚本（Linux/Mac）

echo "===================================="
echo "Git配置和GitHub连接向导"
echo "===================================="
echo ""

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "[错误] 未检测到Git！"
    echo ""
    echo "请先安装Git："
    echo "  Ubuntu/Debian: sudo apt-get install git"
    echo "  macOS: brew install git"
    echo "  或访问: https://git-scm.com/download"
    exit 1
fi

echo "[√] Git已安装"
echo ""

# 配置Git用户信息
echo "正在配置Git用户信息..."
git config --global user.name "yangzhifeng999"
git config --global user.email "yangzhifeng999@gmail.com"
echo "[√] Git用户信息已配置"
echo ""

# 检查是否已初始化Git仓库
if [ ! -d ".git" ]; then
    echo "正在初始化Git仓库..."
    git init
    echo "[√] Git仓库已初始化"
    echo ""
    
    echo "正在添加所有文件..."
    git add .
    echo "[√] 文件已添加"
    echo ""
    
    echo "正在创建初始提交..."
    git commit -m "chore: 初始提交 - AI视频交易平台"
    echo "[√] 初始提交已创建"
    echo ""
else
    echo "[√] Git仓库已存在"
    echo ""
fi

# 检查是否已配置远程仓库
if ! git remote get-url origin &> /dev/null; then
    echo "===================================="
    echo "下一步：连接GitHub仓库"
    echo "===================================="
    echo ""
    echo "请先到GitHub创建仓库："
    echo "1. 访问 https://github.com/new"
    echo "2. 创建新仓库（名称：ai-video-platform 或自定义）"
    echo "3. 不要初始化README"
    echo ""
    read -p "请输入GitHub仓库地址: " REPO_URL
    
    if [ ! -z "$REPO_URL" ]; then
        echo ""
        echo "正在连接远程仓库..."
        git remote add origin "$REPO_URL"
        git branch -M main
        echo "[√] 远程仓库已连接"
        echo ""
        
        read -p "是否立即推送到GitHub? (y/n): " PUSH_NOW
        if [[ $PUSH_NOW =~ ^[Yy]$ ]]; then
            echo ""
            echo "正在推送到GitHub..."
            git push -u origin main
            if [ $? -eq 0 ]; then
                echo "[√] 推送成功！"
            else
                echo "[警告] 推送失败，请检查网络连接和权限设置"
            fi
        fi
    else
        echo "[跳过] 未输入仓库地址，稍后可以手动连接"
    fi
else
    echo "[√] 远程仓库已配置"
    git remote -v
fi

echo ""
echo "===================================="
echo "配置完成！"
echo "===================================="
echo ""
echo "下一步："
echo "1. 启动自动保存服务: npm run auto-save"
echo "2. 或手动测试一次: npm run auto-commit"
echo ""


