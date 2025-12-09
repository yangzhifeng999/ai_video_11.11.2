# 第十四步：测试 API 接口

## 🚀 快速测试步骤

### 1. 获取 API 基础地址

```
https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com
```

### 2. 测试登录接口

```bash
curl -X POST \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'
```

**预期响应**：
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

### 3. 测试跨域（CORS）

```bash
curl -X OPTIONS \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### 4. 测试需要认证的接口

```bash
# 先登录获取 Token
TOKEN="your_jwt_token"

# 获取用户信息
curl -X GET \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/user/profile \
  -H "Authorization: Bearer $TOKEN"
```

## 📝 详细文档

参考：[API_TESTING.md](./docs/API_TESTING.md)

## ✅ 测试清单

- [ ] 登录接口正常
- [ ] 注册接口正常
- [ ] 获取用户信息正常
- [ ] 视频列表接口正常
- [ ] 创建订单接口正常
- [ ] 上传签名接口正常
- [ ] 跨域请求正常
- [ ] 认证接口正常

---

**下一步**：配置前端 API 地址

