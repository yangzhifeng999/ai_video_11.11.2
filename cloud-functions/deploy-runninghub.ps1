# RunningHub 对接部署脚本
# 使用方法: .\deploy-runninghub.ps1

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         RunningHub 对接部署脚本                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 检查是否在正确的目录
if (-not (Test-Path "build.js")) {
    Write-Host "❌ 错误: 请在 cloud-functions 目录下运行此脚本" -ForegroundColor Red
    exit 1
}

# 步骤 1: 构建项目
Write-Host "📦 步骤 1: 构建项目..." -ForegroundColor Yellow
node build.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 构建完成" -ForegroundColor Green
Write-Host ""

# 步骤 2: 部署 upload 函数
Write-Host "🚀 步骤 2: 部署 upload 函数..." -ForegroundColor Yellow
tcb fn deploy upload --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 部署 upload 函数失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ upload 函数部署完成" -ForegroundColor Green
Write-Host ""

# 步骤 3: 部署 taskCheck 函数
Write-Host "🚀 步骤 3: 部署 taskCheck 函数..." -ForegroundColor Yellow
tcb fn deploy taskCheck --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 部署 taskCheck 函数失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ taskCheck 函数部署完成" -ForegroundColor Green
Write-Host ""

# 步骤 4: 验证部署
Write-Host "🔍 步骤 4: 验证部署..." -ForegroundColor Yellow
Write-Host "查看 upload 函数日志（最近 3 条）:" -ForegroundColor Gray
tcb fn log upload --limit 3
Write-Host ""
Write-Host "查看 taskCheck 函数日志（最近 3 条）:" -ForegroundColor Gray
tcb fn log taskCheck --limit 3
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    部署完成！                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 下一步操作:" -ForegroundColor Yellow
Write-Host "1. 在腾讯云控制台创建 tasks 集合和索引" -ForegroundColor White
Write-Host "2. 配置 RUNNINGHUB_API_KEY 环境变量" -ForegroundColor White
Write-Host "3. 运行脚本更新视频模板: node scripts/update-video-templates.js" -ForegroundColor White
Write-Host "4. 测试 API 接口" -ForegroundColor White
Write-Host ""
Write-Host "详细文档: docs/DEPLOY_RUNNINGHUB.md" -ForegroundColor Gray

