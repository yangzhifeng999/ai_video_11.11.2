# 第十四步：API 接口测试

## 📋 测试说明

由于 PowerShell 脚本执行遇到一些问题，我为您创建了一个测试指南，您可以通过浏览器或其他工具测试 API。

---

## 🚀 方法一：使用浏览器测试（最简单）

### 测试 1：视频列表接口

1. 打开浏览器
2. 访问以下地址：
   ```
   https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/videos?page=1&pageSize=10
   ```

**预期结果：**
- 看到 JSON 格式的响应
- `code` 字段为 `0` 表示成功
- 或者看到错误信息（如果数据库未初始化）

---

## 🚀 方法二：使用 Postman 测试（推荐）

### 下载 Postman

如果没有安装，访问：https://www.postman.com/downloads/

### 测试步骤：

#### 测试 1：CORS 预检请求

1. 新建请求
2. 方法：`OPTIONS`
3. URL：`https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login`
4. Headers 添加：
   - `Origin`: `http://localhost:3000`
5. 发送请求

**预期响应头：**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

#### 测试 2：获取视频列表

1. 方法：`GET`
2. URL：`https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/videos?page=1&pageSize=10`
3. 发送请求

**预期响应：**
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "list": [],
    "total": 0,
    "page": 1,
    "pageSize": 10
  }
}
```

#### 测试 3：用户登录

1. 方法：`POST`
2. URL：`https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login`
3. Headers：
   - `Content-Type`: `application/json`
4. Body（选择 raw → JSON）：
```json
{
  "phone": "13800138000",
  "password": "123456"
}
```
5. 发送请求

**预期响应：**
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": "...",
      "phone": "13800138000",
      "nickname": "..."
    }
  }
}
```

**如果返回"用户不存在"：** 需要先注册或在数据库中创建用户。

#### 测试 4：获取用户信息（需要认证）

1. 方法：`GET`
2. URL：`https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/user/profile`
3. Headers：
   - `Authorization`: `Bearer YOUR_TOKEN`（替换为上一步获取的 token）
4. 发送请求

**预期响应：**
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "user": {
      "id": "...",
      "phone": "13800138000",
      ...
    }
  }
}
```

---

## 🚀 方法三：使用在线工具测试

### 使用 Reqbin.com

1. 访问：https://reqbin.com/
2. 输入 URL 和方法
3. 添加 Headers 和 Body
4. 点击 Send

---

## ✅ 测试清单

完成以下测试：

- [ ] CORS 预检请求（OPTIONS）- 检查跨域配置
- [ ] 视频列表接口（GET）- 测试公开接口
- [ ] 用户登录接口（POST）- 测试 POST 请求和数据库连接
- [ ] 用户信息接口（GET）- 测试认证功能

---

## 💡 常见问题

### Q1：所有接口都返回 404？

**原因**：HTTP 触发器未配置

**解决**：
1. 检查第九步是否完成
2. 确认每个函数都配置了 HTTP 访问服务
3. 路径是否正确（`/api/auth`、`/api/user` 等）

### Q2：登录返回"用户不存在"？

**原因**：数据库中没有用户数据

**解决方案 A**：先注册
```
POST /api/auth/register
{
  "phone": "13800138000",
  "password": "123456",
  "code": "123456"
}
```

**解决方案 B**：在数据库中手动添加用户
1. 进入云开发控制台
2. 选择 `users` 集合
3. 添加记录（密码需要 bcrypt 加密）

### Q3：接口返回 500 错误？

**原因**：云函数执行出错

**解决**：
1. 查看云函数日志
2. 检查环境变量是否配置
3. 检查数据库集合是否创建

### Q4：CORS 错误？

**原因**：跨域配置未生效

**解决**：
1. 检查云函数代码中是否有 OPTIONS 处理
2. 重新部署云函数
3. 检查响应头是否包含 CORS 字段

---

## 📝 测试结果记录

请记录测试结果：

| 接口 | 状态 | 响应码 | 备注 |
|------|------|--------|------|
| OPTIONS /api/auth/login | ⬜ | | |
| GET /api/videos | ⬜ | | |
| POST /api/auth/login | ⬜ | | |
| GET /api/user/profile | ⬜ | | |

---

## ⏭️ 下一步

测试完成后，进入**第十五步：配置前端 API 地址**

---

**更新时间**: 2025年1月
**状态**: ✅ 测试指南已就绪

