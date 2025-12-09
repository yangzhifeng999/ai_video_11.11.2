@echo off
chcp 65001 >nul
title AI视频交易平台 - 开发服务器

echo.
echo ========================================
echo   AI视频交易平台 - 开发环境启动
echo ========================================
echo.

REM 检查 Node.js
echo 1. 检查环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo    ✅ Node.js 版本: %NODE_VERSION%

REM 检查依赖
echo.
echo 2. 检查依赖...
if exist "node_modules" (
    echo    ✅ 依赖已安装
) else (
    echo    ⚠️  依赖未安装，正在安装...
    call npm install
    if %errorlevel% neq 0 (
        echo    ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo    ✅ 依赖安装完成
)

REM 清理缓存
echo.
echo 3. 清理缓存...
if exist ".vite" (
    rmdir /s /q ".vite"
    echo    ✅ Vite 缓存已清理
)

REM 创建日志目录
if not exist "logs" mkdir "logs"

echo.
echo ========================================
echo   正在启动服务...
echo ========================================
echo.
echo 📱 访问地址: http://localhost:3000
echo.
echo 💡 提示:
echo    - 修改代码会自动热更新
echo    - 按 Ctrl+C 停止服务
echo    - 如需自动保存，请在新窗口运行: npm run realtime-save
echo.
echo ========================================
echo.

REM 启动开发服务器
npm run dev

pause



