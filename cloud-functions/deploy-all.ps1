# 部署所有云函数脚本
# 使用方法：.\deploy-all.ps1

$envId = "yang0313-7g4dqwd46c63d876"

Write-Host "开始部署所有云函数..." -ForegroundColor Green

$functions = @("user", "video", "order", "upload", "payment", "taskCheck", "admin")

foreach ($funcName in $functions) {
    Write-Host "`n部署函数: $funcName" -ForegroundColor Yellow
    tcb fn deploy $funcName --envId $envId --runtime Nodejs16.13
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $funcName 部署成功" -ForegroundColor Green
    } else {
        Write-Host "❌ $funcName 部署失败" -ForegroundColor Red
    }
    
    # 等待一下，避免并发限制
    Start-Sleep -Seconds 3
}

Write-Host "`n✅ 所有函数部署完成！" -ForegroundColor Green
Write-Host "`n注意：环境变量需要通过 Framework 部署或控制台手动设置" -ForegroundColor Yellow


