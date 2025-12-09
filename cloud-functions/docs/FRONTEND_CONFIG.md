# 前端配置指南

## 一、概述

本文档说明如何配置前端项目以连接到云函数后端。

## 二、环境变量配置

### 1. 创建环境变量文件

在项目根目录创建 `.env.development`（开发环境）和 `.env.production`（生产环境）。

### 2. 配置 API 地址

#### 开发环境（.env.development）

```env
# API 基础地址（云函数 HTTP 触发器）
VITE_API_BASE_URL=https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com

# 是否使用 Mock 数据
VITE_USE_MOCK_DATA=false
```

#### 生产环境（.env.production）

```env
# API 基础地址（如果配置了自定义域名，使用自定义域名）
VITE_API_BASE_URL=https://api.yourdomain.com

# 生产环境不使用 Mock 数据
VITE_USE_MOCK_DATA=false
```

### 3. 配置 COS（如果需要前端直传）

```env
# 腾讯云 COS 配置
VITE_COS_SECRET_ID=your_cos_secret_id
VITE_COS_SECRET_KEY=your_cos_secret_key
VITE_COS_BUCKET=yang0313-storage-1318057968
VITE_COS_REGION=ap-shanghai
```

> **注意**：如果使用云函数获取上传签名，前端不需要配置 COS SecretId 和 SecretKey。

### 4. 完整环境变量示例

参考项目根目录的 `.env.example` 文件。

## 三、API 配置说明

### 1. API 基础地址

前端代码中，API 基础地址从环境变量读取：

```typescript
// src/constants/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
```

### 2. API 端点

所有 API 端点定义在 `src/constants/api.ts` 中：

```typescript
export const API_ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  // ...
};
```

### 3. 完整 API URL

前端请求时，会自动拼接：

```
完整 URL = VITE_API_BASE_URL + API_ENDPOINTS.AUTH_LOGIN
= https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login
```

> **注意**：API 端点以 `/auth/login` 开头，但实际 HTTP 触发器路径是 `/api/auth`，所以完整路径是 `/api/auth/login`。

## 四、更新 API 端点配置

### 问题

当前 API 端点定义中，路径不包含 `/api` 前缀，但实际 HTTP 触发器路径包含 `/api`。

### 解决方案

#### 方案一：修改 API 端点（推荐）

在 `src/constants/api.ts` 中，为所有端点添加 `/api` 前缀：

```typescript
export const API_ENDPOINTS = {
  // 认证
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  // ...
};
```

#### 方案二：修改 API_BASE_URL

在 `.env` 文件中，API_BASE_URL 包含 `/api` 前缀：

```env
VITE_API_BASE_URL=https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api
```

然后 API 端点保持原样：

```typescript
export const API_ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  // ...
};
```

## 五、Mock 数据配置

### 1. 开发环境使用 Mock

```env
VITE_USE_MOCK_DATA=true
```

### 2. 生产环境使用真实 API

```env
VITE_USE_MOCK_DATA=false
```

### 3. 代码中的使用

```typescript
// src/constants/api.ts
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !import.meta.env.VITE_API_BASE_URL;
```

## 六、测试配置

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 检查环境变量

在浏览器控制台检查：

```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
console.log(import.meta.env.VITE_USE_MOCK_DATA);
```

### 3. 测试 API 调用

1. 打开浏览器开发者工具
2. 切换到「Network」标签
3. 执行登录操作
4. 检查请求 URL 是否正确

## 七、常见问题

### Q: API 请求 404

**A:** 检查：
1. `VITE_API_BASE_URL` 是否正确
2. API 端点路径是否正确（是否包含 `/api` 前缀）
3. HTTP 触发器是否已配置

### Q: CORS 错误

**A:** 检查：
1. 云函数是否处理了 OPTIONS 请求
2. 响应头是否包含 CORS 字段
3. 浏览器控制台查看具体错误

### Q: 环境变量不生效

**A:** 检查：
1. 环境变量是否以 `VITE_` 开头
2. 是否重启了开发服务器
3. `.env` 文件是否在项目根目录

### Q: 如何切换开发/生产环境？

**A:** 
- 开发环境：使用 `.env.development`
- 生产环境：使用 `.env.production`
- Vite 会根据 `npm run dev` 或 `npm run build` 自动选择

## 八、生产环境部署

### 1. 构建项目

```bash
npm run build
```

### 2. 配置生产环境变量

在部署平台（如 Vercel、Netlify）配置环境变量：
- `VITE_API_BASE_URL`
- `VITE_USE_MOCK_DATA=false`
- 其他必要的环境变量

### 3. 部署

将 `dist` 目录部署到静态托管服务。

## 九、下一步

完成前端配置后，继续：

1. ✅ **配置监控与告警** - 设置监控规则
2. ✅ **测试完整流程** - 验证前后端联调

---

**更新时间**: 2025年1月
**状态**: ✅ 前端配置指南已就绪

