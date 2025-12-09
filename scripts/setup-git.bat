@echo off
REM Git配置和GitHub连接脚本
echo ====================================
echo Git配置和GitHub连接向导
echo ====================================
echo.

REM 检查Git是否安装
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到Git！
    echo.
    echo 请先安装Git：
    echo 1. 访问 https://git-scm.com/download/win
    echo 2. 下载并安装Git
    echo 3. 安装完成后，重启命令行窗口
    echo 4. 然后重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo [√] Git已安装
echo.

REM 配置Git用户信息
echo 正在配置Git用户信息...
git config --global user.name "yangzhifeng999"
git config --global user.email "yangzhifeng999@gmail.com"
echo [√] Git用户信息已配置
echo.

REM 检查是否已初始化Git仓库
if not exist ".git" (
    echo 正在初始化Git仓库...
    git init
    echo [√] Git仓库已初始化
    echo.
    
    echo 正在添加所有文件...
    git add .
    echo [√] 文件已添加
    echo.
    
    echo 正在创建初始提交...
    git commit -m "chore: 初始提交 - AI视频交易平台"
    echo [√] 初始提交已创建
    echo.
) else (
    echo [√] Git仓库已存在
    echo.
)

REM 检查是否已配置远程仓库
git remote get-url origin >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ====================================
    echo 下一步：连接GitHub仓库
    echo ====================================
    echo.
    echo 请先到GitHub创建仓库：
    echo 1. 访问 https://github.com/new
    echo 2. 创建新仓库（名称：ai-video-platform 或自定义）
    echo 3. 不要初始化README
    echo.
    set /p REPO_URL="请输入GitHub仓库地址（例如：https://github.com/yangzhifeng999/ai-video-platform.git）: "
    
    if not "%REPO_URL%"=="" (
        echo.
        echo 正在连接远程仓库...
        git remote add origin %REPO_URL%
        git branch -M main
        echo [√] 远程仓库已连接
        echo.
        
        echo 是否立即推送到GitHub? (Y/N)
        set /p PUSH_NOW="请输入: "
        if /i "%PUSH_NOW%"=="Y" (
            echo.
            echo 正在推送到GitHub...
            git push -u origin main
            if %ERRORLEVEL% EQU 0 (
                echo [√] 推送成功！
            ) else (
                echo [警告] 推送失败，请检查网络连接和权限设置
            )
        )
    ) else (
        echo [跳过] 未输入仓库地址，稍后可以手动连接
    )
) else (
    echo [√] 远程仓库已配置
    git remote -v
)

echo.
echo ====================================
echo 配置完成！
echo ====================================
echo.
echo 下一步：
echo 1. 启动自动保存服务: npm run auto-save
echo 2. 或手动测试一次: npm run auto-commit
echo.
pause


