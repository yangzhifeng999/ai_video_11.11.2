@echo off
REM 设置自动提交任务的批处理脚本
REM 设置每2小时执行一次自动提交

echo 设置自动提交任务...
echo.

REM 获取当前目录
set "CURRENT_DIR=%~dp0"
set "PROJECT_DIR=%CURRENT_DIR%.."

REM 删除已存在的任务（如果存在）
schtasks /delete /tn "AI视频平台-自动保存" /f >nul 2>&1

REM 创建新的任务计划
schtasks /create /tn "AI视频平台-自动保存" /tr "powershell.exe -ExecutionPolicy Bypass -File \"%CURRENT_DIR%auto-commit-task.ps1\"" /sc hourly /mo 2 /st 00:00 /ru "%USERNAME%" /rl highest /f

if %errorlevel% equ 0 (
    echo ✅ 自动提交任务设置成功！
    echo.
    echo 任务详情：
    echo - 任务名称：AI视频平台-自动保存
    echo - 执行频率：每2小时一次
    echo - 脚本路径：%CURRENT_DIR%auto-commit-task.ps1
    echo - 日志路径：%PROJECT_DIR%\logs\auto-commit-task.log
    echo.
    echo 下次执行时间：查看任务计划程序或运行 'schtasks /query /tn "AI视频平台-自动保存"'
) else (
    echo ❌ 自动提交任务设置失败！
    echo 请检查权限或手动运行任务计划程序。
)

echo.
pause







