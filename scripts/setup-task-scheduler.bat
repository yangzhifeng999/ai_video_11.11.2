@echo off
chcp 65001 >nul
echo ====================================
echo 设置 Windows 任务计划程序
echo ====================================
echo.

set PROJECT_PATH=%~dp0..
set TASK_NAME=AI视频平台-自动保存
set SCRIPT_PATH=%PROJECT_PATH%\scripts\auto-commit-task.ps1
set NODE_PATH=C:\Program Files\nodejs\node.exe

echo 项目路径: %PROJECT_PATH%
echo 脚本路径: %SCRIPT_PATH%
echo 任务名称: %TASK_NAME%
echo.

REM 检查任务是否已存在
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if %errorlevel% == 0 (
    echo 任务已存在，正在删除旧任务...
    schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
    echo 旧任务已删除
    echo.
)

echo 正在创建新任务...
echo.

REM 创建任务计划程序
REM /sc hourly: 每小时执行
REM /mo 2: 每2小时执行一次
REM /st 00:00: 从00:00开始
REM /ru SYSTEM: 以系统账户运行（需要管理员权限）
schtasks /create ^
    /tn "%TASK_NAME%" ^
    /tr "powershell.exe -ExecutionPolicy Bypass -File \"%SCRIPT_PATH%\"" ^
    /sc hourly ^
    /mo 2 ^
    /st 00:00 ^
    /ru SYSTEM ^
    /rl HIGHEST ^
    /f

if %errorlevel% == 0 (
    echo.
    echo ====================================
    echo 任务计划程序设置成功！
    echo ====================================
    echo 任务名称: %TASK_NAME%
    echo 执行频率: 每2小时一次
    echo 开始时间: 00:00
    echo.
    echo 查看任务: schtasks /query /tn "%TASK_NAME%"
    echo 测试任务: schtasks /run /tn "%TASK_NAME%"
    echo 删除任务: schtasks /delete /tn "%TASK_NAME%" /f
) else (
    echo.
    echo ====================================
    echo 任务创建失败！
    echo ====================================
    echo 可能的原因:
    echo 1. 需要管理员权限
    echo 2. PowerShell 执行策略限制
    echo.
    echo 请以管理员身份运行此脚本
    echo 或者手动在任务计划程序中创建任务
)

pause

