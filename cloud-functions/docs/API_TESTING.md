# API 接口测试指南

## 一、概述

本文档说明如何测试云函数的 HTTP 触发器接口。

## 二、获取 API 地址

### 基础地址

```
https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com
```

### 各模块地址

- 认证：`/api/auth/*`
- 用户：`/api/user/*`
- 视频：`/api/videos/*`
- 订单：`/api/orders/*`
- 上传：`/api/upload/*`
- 支付：`/api/payment/*`
- 管理：`/api/admin/*`

## 三、测试工具

### 1. curl（命令行）

```bash
# 测试登录
curl -X POST \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'
```

### 2. Postman

1. 创建新请求
2. 选择方法（GET/POST/PUT/DELETE）
3. 输入 URL
4. 添加 Headers
5. 添加 Body（如需要）
6. 发送请求

### 3. 浏览器控制台

```javascript
// 测试登录
fetch('https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '13800138000',
    password: '123456'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

## 四、测试用例

### 1. 认证模块

#### 1.1 用户注册

```bash
curl -X POST \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "123456",
    "code": "123456"
  }'
```

#### 1.2 用户登录

```bash
curl -X POST \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "123456"
  }'
```

**预期响应**：
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": "user123",
      "phone": "13800138000",
      "nickname": "用户"
    }
  }
}
```

#### 1.3 刷新 Token

```bash
curl -X POST \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token"
  }'
```

### 2. 用户模块

#### 2.1 获取用户信息（需要认证）

```bash
curl -X GET \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2.2 更新用户信息

```bash
curl -X PUT \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "新昵称",
    "avatar": "https://..."
  }'
```

### 3. 视频模块

#### 3.1 获取视频列表

```bash
curl -X GET \
  "https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/videos?page=1&pageSize=10"
```

#### 3.2 获取视频详情

```bash
curl -X GET \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/videos/{videoId}
```

#### 3.3 点赞视频

```bash
curl -X POST \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/videos/{videoId}/like \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. 订单模块

#### 4.1 创建订单

```bash
curl -X POST \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "video123",
    "type": "single"
  }'
```

#### 4.2 获取订单列表

```bash
curl -X GET \
  "https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/orders?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. 上传模块

#### 5.1 获取上传签名

```bash
curl -X POST \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/upload/sign \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.jpg",
    "fileType": "image",
    "path": "avatars/"
  }'
```

### 6. 支付模块

#### 6.1 创建支付订单

```bash
curl -X POST \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/payment/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order123",
    "payType": "wechat"
  }'
```

## 五、测试跨域（CORS）

### 测试 OPTIONS 预检请求

```bash
curl -X OPTIONS \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**预期响应头**：
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## 六、常见错误

### 1. 401 Unauthorized

**原因**：未提供 Token 或 Token 无效

**解决**：
- 检查 Authorization 头是否正确
- 确认 Token 未过期
- 重新登录获取新 Token

### 2. 404 Not Found

**原因**：接口路径错误或未配置 HTTP 触发器

**解决**：
- 检查 URL 路径是否正确
- 确认 HTTP 触发器已配置
- 检查函数内部路由是否匹配

### 3. 500 Internal Server Error

**原因**：服务器内部错误

**解决**：
- 查看云函数日志
- 检查环境变量是否配置
- 检查数据库连接是否正常

### 4. CORS 错误

**原因**：跨域配置不正确

**解决**：
- 检查函数是否处理 OPTIONS 请求
- 检查响应头是否包含 CORS 字段
- 检查浏览器控制台错误信息

## 七、查看日志

### 使用 CLI

```bash
# 查看 auth 函数日志
tcb fn log auth --envId yang0313-7g4dqwd46c63d876 --limit 50

# 查看所有函数日志
tcb fn log --envId yang0313-7g4dqwd46c63d876 --limit 50
```

### 使用控制台

1. 进入云函数控制台
2. 选择函数
3. 点击「日志查询」
4. 查看执行日志

## 八、性能测试

### 1. 响应时间

使用 curl 测试响应时间：

```bash
curl -w "@curl-format.txt" -o /dev/null -s \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/videos
```

`curl-format.txt`：
```
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

### 2. 并发测试

使用 Apache Bench：

```bash
ab -n 100 -c 10 \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/videos
```

## 九、下一步

完成 API 测试后，继续：

1. ✅ **配置前端 API 地址** - 更新前端环境变量
2. ✅ **配置监控与告警** - 设置监控规则

---

**更新时间**: 2025年1月
**状态**: ✅ API 测试指南已就绪

