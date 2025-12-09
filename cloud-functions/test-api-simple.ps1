# 简化的 API 测试脚本

$baseUrl = "https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com"

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "API 接口测试" -ForegroundColor Cyan
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""

# 跳过 SSL 证书验证
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
if (-not ([System.Management.Automation.PSTypeName]'ServerCertificateValidationCallback').Type)
{
$certCallback = @"
    using System;
    using System.Net;
    using System.Net.Security;
    using System.Security.Cryptography.X509Certificates;
    public class ServerCertificateValidationCallback
    {
        public static void Ignore()
        {
            if(ServicePointManager.ServerCertificateValidationCallback ==null)
            {
                ServicePointManager.ServerCertificateValidationCallback += 
                    delegate
                    (
                        Object obj, 
                        X509Certificate certificate, 
                        X509Chain chain, 
                        SslPolicyErrors errors
                    )
                    {
                        return true;
                    };
            }
        }
    }
"@
    Add-Type $certCallback
 }
[ServerCertificateValidationCallback]::Ignore()

# 测试 1: OPTIONS 预检请求
Write-Host "测试 1: CORS 预检请求 (OPTIONS)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method OPTIONS -UseBasicParsing
    Write-Host "✓ CORS 预检请求成功 (状态码: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ CORS 预检请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试 2: 视频列表
Write-Host ""
Write-Host "测试 2: 获取视频列表 (GET /api/videos)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/videos?page=1&pageSize=10" -Method GET -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ 视频列表接口成功 (响应码: $($data.code), 消息: $($data.message))" -ForegroundColor Green
} catch {
    Write-Host "✗ 视频列表接口失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试 3: 登录
Write-Host ""
Write-Host "测试 3: 用户登录 (POST /api/auth/login)" -ForegroundColor Yellow
try {
    $body = @{
        phone = "13800138000"
        password = "123456"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ 登录接口成功 (响应码: $($data.code), 消息: $($data.message))" -ForegroundColor Green
    
    if ($data.data.token) {
        $global:token = $data.data.token
        Write-Host "  Token 已获取: $($global:token.Substring(0, 30))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ 登录接口失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试 4: 获取用户信息（需要认证）
if ($global:token) {
    Write-Host ""
    Write-Host "测试 4: 获取用户信息 (GET /api/user/profile)" -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $global:token"
        }
        
        $response = Invoke-WebRequest -Uri "$baseUrl/api/user/profile" -Method GET -Headers $headers -UseBasicParsing
        $data = $response.Content | ConvertFrom-Json
        Write-Host "✓ 获取用户信息成功 (响应码: $($data.code))" -ForegroundColor Green
    } catch {
        Write-Host "✗ 获取用户信息失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 总结
Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "测试完成！" -ForegroundColor Cyan
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""

