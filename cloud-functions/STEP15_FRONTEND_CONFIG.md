# 第十五步：配置前端 API 地址

## 🚀 快速操作步骤

### 1. 创建环境变量文件

在项目根目录创建 `.env.development` 文件：

```env
# API 基础地址（云函数 HTTP 触发器）
VITE_API_BASE_URL=https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api

# 是否使用 Mock 数据
VITE_USE_MOCK_DATA=false
```

> **注意**：API_BASE_URL 需要包含 `/api` 前缀，因为 HTTP 触发器路径是 `/api/{模块名}`

### 2. 更新 API 配置（可选）

如果不想在 API_BASE_URL 中包含 `/api`，可以修改 `src/constants/api.ts`，为所有端点添加 `/api` 前缀。

**当前配置**：
```typescript
export const API_ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',  // 实际路径: /api/auth/login
  // ...
};
```

**推荐配置**（在 API_BASE_URL 中包含 `/api`）：
```env
VITE_API_BASE_URL=https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api
```

### 3. 重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
npm run dev
```

### 4. 验证配置

1. 打开浏览器控制台
2. 检查环境变量：
```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
// 应该输出: https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api
```

3. 测试 API 调用：
   - 尝试登录
   - 检查 Network 标签中的请求 URL
   - 确认请求发送到正确的地址

## 📝 详细文档

参考：[FRONTEND_CONFIG.md](./docs/FRONTEND_CONFIG.md)

## ✅ 验证清单

- [ ] `.env.development` 文件已创建
- [ ] `VITE_API_BASE_URL` 已配置（包含 `/api` 前缀）
- [ ] `VITE_USE_MOCK_DATA=false`
- [ ] 开发服务器已重启
- [ ] API 请求 URL 正确
- [ ] 登录功能正常

---

**下一步**：配置监控与告警

