@echo off
REM Git回退脚本启动器

echo ====================================
echo Git 回退工具
echo ====================================
echo.

REM 切换到项目根目录
cd /d "%~dp0.."

REM 传递参数给Node.js脚本
node scripts/git-rollback.js %*

pause




