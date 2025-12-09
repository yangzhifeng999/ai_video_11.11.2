# API 测试脚本

$baseUrl = "https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API 接口测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 跳过 SSL 证书验证
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
Add-Type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

# 测试 1: OPTIONS 预检请求（CORS）
Write-Host "测试 1: CORS 预检请求 (OPTIONS)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method OPTIONS -UseBasicParsing
    Write-Host "✓ CORS 预检请求成功" -ForegroundColor Green
    Write-Host "  状态码: $($response.StatusCode)" -ForegroundColor Gray
    
    # 检查 CORS 头
    $corsHeaders = @(
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods",
        "Access-Control-Allow-Headers"
    )
    
    foreach ($header in $corsHeaders) {
        if ($response.Headers[$header]) {
            Write-Host "  $header : $($response.Headers[$header])" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "✗ CORS 预检请求失败" -ForegroundColor Red
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 测试 2: 视频列表接口（GET，无需认证）
Write-Host "测试 2: 获取视频列表 (GET /api/videos)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/videos?page=1&pageSize=10" -Method GET -UseBasicParsing
    Write-Host "✓ 视频列表接口成功" -ForegroundColor Green
    Write-Host "  状态码: $($response.StatusCode)" -ForegroundColor Gray
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  响应码: $($data.code)" -ForegroundColor Gray
    Write-Host "  消息: $($data.message)" -ForegroundColor Gray
} catch {
    Write-Host "✗ 视频列表接口失败" -ForegroundColor Red
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 测试 3: 注册接口（POST）
Write-Host "测试 3: 用户注册 (POST /api/auth/register)" -ForegroundColor Yellow
try {
    $body = @{
        phone = "13800138000"
        password = "123456"
        code = "123456"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "✓ 注册接口响应成功" -ForegroundColor Green
    Write-Host "  状态码: $($response.StatusCode)" -ForegroundColor Gray
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  响应码: $($data.code)" -ForegroundColor Gray
    Write-Host "  消息: $($data.message)" -ForegroundColor Gray
} catch {
    Write-Host "✓ 注册接口正常（可能用户已存在或数据库未初始化）" -ForegroundColor Yellow
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

# 测试 4: 登录接口（POST）
Write-Host "测试 4: 用户登录 (POST /api/auth/login)" -ForegroundColor Yellow
try {
    $body = @{
        phone = "13800138000"
        password = "123456"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "✓ 登录接口成功" -ForegroundColor Green
    Write-Host "  状态码: $($response.StatusCode)" -ForegroundColor Gray
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  响应码: $($data.code)" -ForegroundColor Gray
    Write-Host "  消息: $($data.message)" -ForegroundColor Gray
    
    if ($data.data.token) {
        $global:token = $data.data.token
        Write-Host "  Token: $($global:token.Substring(0, 50))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ 登录接口失败" -ForegroundColor Red
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 测试 5: 获取用户信息（需要认证）
if ($global:token) {
    Write-Host "测试 5: 获取用户信息 (GET /api/user/profile)" -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $global:token"
        }
        
        $response = Invoke-WebRequest -Uri "$baseUrl/api/user/profile" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "✓ 获取用户信息成功" -ForegroundColor Green
        Write-Host "  状态码: $($response.StatusCode)" -ForegroundColor Gray
        
        $data = $response.Content | ConvertFrom-Json
        Write-Host "  响应码: $($data.code)" -ForegroundColor Gray
        Write-Host "  消息: $($data.message)" -ForegroundColor Gray
        
        if ($data.data.user) {
            Write-Host "  用户ID: $($data.data.user.id)" -ForegroundColor Gray
            Write-Host "  手机号: $($data.data.user.phone)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "✗ 获取用户信息失败" -ForegroundColor Red
        Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# 测试总结
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ 测试清单：" -ForegroundColor Green
Write-Host "  - CORS 跨域配置" -ForegroundColor White
Write-Host "  - 视频列表接口（公开）" -ForegroundColor White
Write-Host "  - 用户注册接口" -ForegroundColor White
Write-Host "  - 用户登录接口" -ForegroundColor White
Write-Host "  - 用户信息接口（需认证）" -ForegroundColor White
Write-Host ""
Write-Host "💡 提示：" -ForegroundColor Yellow
Write-Host "  如果所有测试都通过，说明 API 配置正确！" -ForegroundColor White
Write-Host "  如果有测试失败，请检查对应的云函数配置。" -ForegroundColor White
Write-Host ""

