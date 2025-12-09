# AI视频交易平台 - 一键启动开发环境
# 同时启动开发服务器和实时自动保存服务

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI视频交易平台 - 开发环境启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "1. 检查环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 检查依赖
Write-Host ""
Write-Host "2. 检查依赖..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ 依赖已安装" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  依赖未安装，正在安装..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ 依赖安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ 依赖安装完成" -ForegroundColor Green
}

# 清理缓存
Write-Host ""
Write-Host "3. 清理缓存..." -ForegroundColor Yellow
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force ".vite"
    Write-Host "   ✅ Vite 缓存已清理" -ForegroundColor Green
}

# 创建日志目录
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  正在启动服务..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 启动实时保存服务（后台）
Write-Host "🔄 启动实时自动保存服务..." -ForegroundColor Yellow
$realtimeSaveJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run realtime-save
}
Write-Host "   ✅ 实时保存服务已启动 (Job ID: $($realtimeSaveJob.Id))" -ForegroundColor Green

# 等待1秒
Start-Sleep -Seconds 1

# 启动开发服务器（前台）
Write-Host ""
Write-Host "🚀 启动开发服务器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  服务已启动！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 访问地址: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 实时保存: " -NoNewline
Write-Host "已启用 (500ms延迟)" -ForegroundColor Green
Write-Host "   - 文件变化自动提交到Git" -ForegroundColor Gray
Write-Host "   - 保留最近5个提交历史" -ForegroundColor Gray
Write-Host "   - 日志文件: logs/realtime-save.log" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Yellow
Write-Host "   - 修改代码会自动保存并热更新" -ForegroundColor Gray
Write-Host "   - 按 Ctrl+C 停止所有服务" -ForegroundColor Gray
Write-Host "   - 使用 'npm run rollback' 回退更改" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 启动开发服务器
try {
    npm run dev
} finally {
    # 停止实时保存服务
    Write-Host ""
    Write-Host "正在停止实时保存服务..." -ForegroundColor Yellow
    Stop-Job -Job $realtimeSaveJob
    Remove-Job -Job $realtimeSaveJob
    Write-Host "✅ 所有服务已停止" -ForegroundColor Green
}



