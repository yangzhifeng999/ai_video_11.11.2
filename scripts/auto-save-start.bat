@echo off
REM Windows批处理脚本 - 启动自动保存服务
echo 正在启动自动保存版本服务...
echo.

REM 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 切换到脚本目录
cd /d "%~dp0.."

REM 启动服务
node scripts/auto-save.js

pause

