@echo off
chcp 65001 >nul
title AI视频交易平台 - 实时保存服务

echo.
echo ========================================
echo   实时自动保存服务
echo ========================================
echo.
echo 🔄 功能说明:
echo    - 监控文件变化
echo    - 自动提交到 Git
echo    - 500ms 防抖延迟
echo    - 保留最近 5 个提交历史
echo.
echo 📝 日志文件: logs\realtime-save.log
echo.
echo 💡 提示:
echo    - 按 Ctrl+C 停止服务
echo    - 使用 npm run rollback 可回退更改
echo.
echo ========================================
echo.

REM 创建日志目录
if not exist "logs" mkdir "logs"

REM 启动实时保存服务
npm run realtime-save

pause



