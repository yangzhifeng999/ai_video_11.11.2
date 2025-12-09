@echo off
REM 启动实时文件监控和自动保存服务

echo ====================================
echo 启动实时文件监控和自动保存服务
echo ====================================
echo.

REM 检查Node.js是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 切换到项目根目录
cd /d "%~dp0.."

echo 正在启动实时保存服务...
echo 提示: 按 Ctrl+C 可以停止服务
echo.

REM 启动Node.js脚本
node scripts/realtime-save.js

pause




