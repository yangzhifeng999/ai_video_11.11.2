@echo off
chcp 65001 >nul
REM AI视频交易平台 - 一键启动脚本 (Windows批处理版本)

echo.
echo ========================================
echo   AI视频交易平台 - 开发环境启动
echo ========================================
echo.

REM 检查 PowerShell
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 PowerShell
    pause
    exit /b 1
)

REM 执行 PowerShell 脚本
powershell -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1"

pause



