# HTTP 触发器配置指南

> **重要说明**：由于腾讯云 API 网关产品已停服（2025年6月30日），本项目使用云函数的 **HTTP 触发器** 来替代 API 网关功能。

## 一、HTTP 触发器 vs API 网关

### 区别对比

| 特性 | API 网关 | HTTP 触发器 |
|------|----------|-------------|
| 统一入口 | ✅ 一个域名访问所有接口 | ❌ 每个函数独立地址 |
| 路径路由 | ✅ 自动路由到对应函数 | ⚠️ 需要在函数内手动路由 |
| 跨域配置 | ✅ 统一配置 | ⚠️ 需要在函数内处理 |
| 限流 | ✅ 网关层限流 | ⚠️ 需要在函数内实现 |
| 认证 | ✅ 插件支持 | ⚠️ 需要在函数内验证 |
| 成本 | 💰 按调用次数收费 | 💰 按函数调用收费 |
| 维护 | ✅ 统一管理 | ⚠️ 需要逐个配置 |

### 本项目方案

由于云函数内部已经实现了路径路由（通过 `getPath()` 和 `getMethod()`），我们可以为每个函数配置 HTTP 触发器，使用统一的路径前缀。

## 二、配置 HTTP 触发器

### 方案一：为每个函数配置独立 HTTP 触发器（推荐）

每个函数配置一个 HTTP 触发器，路径设置为 `/api/{模块名}`，函数内部根据完整路径路由。

#### 1. 配置 auth 函数

**操作步骤：**
1. 访问：https://console.cloud.tencent.com/tcb/scf?envId=yang0313-7g4dqwd46c63d876
2. 点击 `auth` 函数进入详情
3. 点击「触发管理」→「创建触发器」
4. 配置：
   - **触发方式**：HTTP 触发器
   - **路径**：`/api/auth`
   - **方法**：`GET`、`POST`、`PUT`、`DELETE`、`OPTIONS`（全选）
   - **启用**：是
   - **鉴权方式**：免鉴权（函数内部会验证 JWT）
5. 点击「提交」

**访问地址示例：**
```
https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login
https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/register
```

#### 2. 配置 user 函数

- **路径**：`/api/user`
- **方法**：`GET`、`POST`、`PUT`、`DELETE`、`OPTIONS`

#### 3. 配置 video 函数

- **路径**：`/api/videos`
- **方法**：`GET`、`POST`、`PUT`、`DELETE`、`OPTIONS`

#### 4. 配置 order 函数

- **路径**：`/api/orders`
- **方法**：`GET`、`POST`、`PUT`、`DELETE`、`OPTIONS`

#### 5. 配置 upload 函数

- **路径**：`/api/upload`
- **方法**：`GET`、`POST`、`PUT`、`DELETE`、`OPTIONS`

#### 6. 配置 payment 函数

- **路径**：`/api/payment`
- **方法**：`GET`、`POST`、`PUT`、`DELETE`、`OPTIONS`

#### 7. 配置 admin 函数

- **路径**：`/api/admin`
- **方法**：`GET`、`POST`、`PUT`、`DELETE`、`OPTIONS`

#### 8. taskCheck 函数

`taskCheck` 函数不需要 HTTP 触发器，它使用定时触发器。

### 方案二：使用 CloudBase Framework 配置（自动化）

在 `cloudbaserc.json` 中为每个函数添加 HTTP 触发器配置：

```json
{
  "name": "auth",
  "triggers": [
    {
      "name": "http",
      "type": "http",
      "config": {
        "path": "/api/auth",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      }
    }
  ]
}
```

然后执行：
```bash
tcb framework deploy
```

## 三、处理跨域（CORS）

由于没有 API 网关的统一跨域配置，需要在每个云函数中处理 CORS。

### 在云函数中添加 CORS 支持

每个函数的入口处添加 CORS 处理：

```javascript
// 在 exports.main 函数开始处添加
exports.main = async (event, context) => {
  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  // ... 原有逻辑 ...

  // 在所有响应中添加 CORS 头
  return {
    ...response,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  };
};
```

### 创建共享 CORS 工具函数

在 `cloud-functions/functions/shared/utils.js` 中添加：

```javascript
/**
 * 添加 CORS 响应头
 */
function addCorsHeaders(response) {
  return {
    ...response,
    headers: {
      ...(response.headers || {}),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  };
}

/**
 * 处理 OPTIONS 预检请求
 */
function handleOptionsRequest() {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    },
    body: ''
  };
}
```

## 四、获取访问地址

### 1. 查看 HTTP 触发器地址

配置完成后，在函数详情页的「触发管理」中可以看到 HTTP 触发器的访问地址：

```
https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth
https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/user
https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/videos
...
```

### 2. 统一 API 基础地址

虽然每个函数有独立地址，但它们的域名相同，可以统一使用：

```
基础地址：https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com

完整 API 地址：
- https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login
- https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/user/profile
- https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/videos
```

## 五、配置自定义域名（可选，需要备案）

> ⚠️ **注意**：自定义域名需要备案，开发阶段可以跳过此步骤。

如果需要使用自定义域名（如 `api.yourdomain.com`），可以使用 **云函数网关** 或 **负载均衡**。

### 方案一：使用 CloudBase 自定义域名

1. 进入 CloudBase 控制台
2. 选择「云函数」→「HTTP 服务」
3. 配置自定义域名
4. 配置 SSL 证书
5. 设置域名解析

### 方案二：使用负载均衡 + 路径转发

1. 创建负载均衡实例
2. 配置监听器（HTTPS:443）
3. 配置转发规则：
   - `/api/auth/*` → auth 函数的 HTTP 触发器
   - `/api/user/*` → user 函数的 HTTP 触发器
   - `/api/videos/*` → video 函数的 HTTP 触发器
   - ...
4. 配置 SSL 证书
5. 设置域名解析

## 六、前端配置

### 1. 更新 API 基础地址

修改前端 `.env` 文件：

```env
# 开发环境
VITE_API_BASE_URL=https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com

# 生产环境（如果配置了自定义域名）
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 2. 更新 API 服务代码

确保前端 API 调用使用正确的路径：

```typescript
// services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  // 登录
  login: (data: LoginData) => 
    axios.post(`${API_BASE_URL}/api/auth/login`, data),
  
  // 获取用户信息
  getUserProfile: () => 
    axios.get(`${API_BASE_URL}/api/user/profile`),
  
  // 获取视频列表
  getVideos: (params: VideoListParams) => 
    axios.get(`${API_BASE_URL}/api/videos`, { params }),
};
```

## 七、测试 HTTP 触发器

### 1. 测试登录接口

```bash
curl -X POST \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'
```

### 2. 测试跨域（CORS）

```bash
curl -X OPTIONS \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

### 3. 测试需要认证的接口

```bash
curl -X GET \
  https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 八、配置限流（可选）

由于没有 API 网关的统一限流，可以在云函数内部实现限流：

### 方案一：使用云函数并发控制

在函数配置中设置：
- **并发上限**：根据实际需求设置（如 100）
- **保留并发**：设置最小保留并发数

### 方案二：在函数内实现限流

使用 Redis 或内存缓存实现限流逻辑（需要额外配置）。

## 九、监控与告警

### 1. 查看函数调用日志

```bash
# 查看 auth 函数日志
tcb fn log auth --envId yang0313-7g4dqwd46c63d876 --limit 50
```

### 2. 配置告警

在云函数控制台配置告警：
- 函数错误率 > 5%
- 函数运行时长 > 5s
- 函数并发超限

## 十、常见问题

### Q: HTTP 触发器返回 404

**A:** 检查：
1. 触发器路径是否正确配置
2. 函数内部路由是否匹配完整路径（包含 `/api/{模块名}`）
3. HTTP 方法是否匹配

### Q: 跨域请求失败

**A:** 检查：
1. 函数是否处理了 OPTIONS 预检请求
2. 响应头是否包含 CORS 相关字段
3. 浏览器控制台查看具体错误信息

### Q: 如何统一管理所有 API？

**A:** 可以考虑：
1. 使用负载均衡 + 路径转发（推荐）
2. 使用 Nginx 反向代理
3. 使用 CloudBase 自定义域名（如果支持）

### Q: 支付回调地址如何配置？

**A:** 使用 payment 函数的 HTTP 触发器地址：
```
https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/payment/wechat/notify
https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/payment/alipay/notify
```

## 十一、下一步

完成 HTTP 触发器配置后，继续：

1. ✅ **初始化数据库** - 创建 15 个集合
2. ✅ **测试 API 接口** - 验证所有接口正常工作
3. ✅ **配置前端 API 地址** - 更新前端环境变量
4. ✅ **配置 COS 存储** - 设置存储桶和跨域规则
5. ✅ **配置 VOD** - 开通云点播服务
6. ✅ **配置定时触发器** - taskCheck 函数定时任务

---

**更新时间**: 2025年1月
**状态**: ✅ HTTP 触发器替代方案已就绪

