# 设置云函数环境变量脚本
# 使用方法：在 PowerShell 中运行 .\setup-env.ps1

$envId = "yang0313-7g4dqwd46c63d876"

# 已生成的环境变量
$envVars = @{
    "TCB_ENV" = "yang0313-7g4dqwd46c63d876"
    "JWT_SECRET" = "306f9b145624e3a46f7f6335ea8f4364e660bed9f17c2a0f281d877304f2ad24"
    "TENCENT_REGION" = "ap-shanghai"
    "COS_BUCKET" = "yang0313-storage-1318057968"
    "COS_REGION" = "ap-shanghai"
}

# 需要用户提供的环境变量（请替换为实际值）
# 如果已获取，请取消注释并填入实际值
# $envVars["TENCENT_SECRET_ID"] = "你的SecretId"
# $envVars["TENCENT_SECRET_KEY"] = "你的SecretKey"
# $envVars["VOD_SUB_APP_ID"] = "你的VOD子应用ID"  # 可选

Write-Host "开始设置云函数环境变量..." -ForegroundColor Green

# 获取所有云函数名称
$functions = @("auth", "user", "video", "order", "upload", "payment", "taskCheck", "admin")

foreach ($funcName in $functions) {
    Write-Host "`n设置函数: $funcName" -ForegroundColor Yellow
    
    foreach ($key in $envVars.Keys) {
        $value = $envVars[$key]
        if ($value) {
            Write-Host "  设置 $key = $value" -ForegroundColor Cyan
            # 使用 CloudBase CLI 设置环境变量
            tcb fn env set $key $value --name $funcName --envId $envId
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  ⚠️  设置失败，请检查函数 $funcName 是否存在" -ForegroundColor Red
            }
        }
    }
}

Write-Host "`n✅ 环境变量设置完成！" -ForegroundColor Green
Write-Host "`n注意：如果 SecretId 和 SecretKey 未设置，请先获取后更新脚本并重新运行。" -ForegroundColor Yellow


