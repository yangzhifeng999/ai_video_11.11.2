# API 网关配置指南

本文档说明如何在腾讯云配置 API 网关，将请求路由到对应的云函数。

## 一、创建 API 网关服务

1. 登录 [腾讯云 API 网关控制台](https://console.cloud.tencent.com/apigateway)
2. 点击「创建服务」
3. 填写信息：
   - 服务名称：`heiha-api`
   - 协议：`HTTPS`
   - 访问方式：`公网`
   - 备注：嘿哈 AI 视频平台 API

## 二、创建 API 分组

建议按模块创建 API 分组：

| 分组名 | 路径前缀 | 说明 |
|--------|----------|------|
| auth | /api/auth | 认证相关 |
| user | /api/user | 用户相关 |
| videos | /api/videos | 视频相关 |
| creators | /api/creators | 创作者相关 |
| orders | /api/orders | 订单相关 |
| upload | /api/upload | 上传相关 |
| payment | /api/payment | 支付相关 |
| admin | /api/admin | 后台管理 |

## 三、创建 API

### 通用配置

每个 API 的基本配置：

1. **前端配置**
   - 请求方法：根据接口选择 GET/POST/PUT/DELETE
   - 路径：如 `/auth/login`
   - 参数配置：根据需要添加

2. **后端配置**
   - 后端类型：`云函数 SCF`
   - 云函数：选择对应的函数（如 `auth`）
   - 后端超时：`10000`（10秒）

3. **响应结果**
   - 响应类型：`JSON`

### 详细 API 配置

#### 认证模块 (auth)

```yaml
# 登录
- path: /api/auth/login
  method: POST
  function: auth

# 注册
- path: /api/auth/register
  method: POST
  function: auth

# 微信登录
- path: /api/auth/wechat
  method: POST
  function: auth

# 刷新Token
- path: /api/auth/refresh
  method: POST
  function: auth

# 发送验证码
- path: /api/auth/send-code
  method: POST
  function: auth

# 验证码登录
- path: /api/auth/login-code
  method: POST
  function: auth
```

#### 用户模块 (user)

```yaml
# 获取个人信息
- path: /api/user/profile
  method: GET
  function: user

# 更新个人信息
- path: /api/user/profile
  method: PUT
  function: user

# 其他用户接口...
```

#### 视频模块 (video)

使用通配符路由简化配置：

```yaml
# 视频列表和详情
- path: /api/videos
  method: GET
  function: video

- path: /api/videos/{videoId}
  method: GET
  function: video

# 点赞
- path: /api/videos/{videoId}/like
  method: POST
  function: video

- path: /api/videos/{videoId}/like
  method: DELETE
  function: video

# 评论
- path: /api/videos/{videoId}/comments
  method: GET
  function: video

- path: /api/videos/{videoId}/comments
  method: POST
  function: video
```

## 四、配置跨域 (CORS)

在每个 API 上启用 CORS：

1. 进入 API 详情
2. 点击「跨域访问CORS」
3. 启用 CORS
4. 配置：
   - 允许来源：`*` 或具体域名
   - 允许方法：`GET, POST, PUT, DELETE, OPTIONS`
   - 允许头部：`Content-Type, Authorization`
   - 有效期：`86400`

## 五、配置认证

### JWT 认证（推荐）

在云函数内部验证 JWT Token，不使用 API 网关的认证插件。

优点：
- 更灵活
- 可以区分公开接口和需要登录的接口
- 错误信息更友好

### API 网关认证（可选）

如需在网关层验证：

1. 进入「插件」页面
2. 创建「JWT校验」插件
3. 配置密钥和验证规则
4. 绑定到需要认证的 API

## 六、配置限流

防止接口被恶意调用：

1. 进入「插件」页面
2. 创建「流量控制」插件
3. 配置：
   - 限流策略：`每秒`
   - 限流阈值：`100`（根据实际调整）
4. 绑定到所有 API

## 七、配置支付回调白名单

微信/支付宝回调接口不需要认证：

1. 找到支付回调 API
2. 关闭认证
3. 配置 IP 白名单（可选）

## 八、发布服务

1. 点击「发布服务」
2. 选择环境：
   - `release`：生产环境
   - `prepub`：预发布环境
   - `test`：测试环境
3. 填写版本描述
4. 点击「提交发布」

## 九、获取访问地址

发布后，在服务详情页获取：

- 公网访问地址：`https://service-xxx.gz.apigw.tencentcs.com`
- 内网访问地址：`http://service-xxx.gz.apigw.tencentcs.com`

## 十、配置自定义域名（可选）

1. 进入「自定义域名」
2. 添加域名（如 `api.yourdomain.com`）
3. 配置 CNAME 解析
4. 配置 SSL 证书

## 十一、最终 API 地址

配置完成后，前端请求地址格式：

```
https://api.yourdomain.com/api/auth/login
https://api.yourdomain.com/api/videos
https://api.yourdomain.com/api/orders
...
```

## 十二、测试

使用 curl 或 Postman 测试：

```bash
# 测试登录
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'

# 测试视频列表
curl https://api.yourdomain.com/api/videos

# 测试需要认证的接口
curl https://api.yourdomain.com/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 常见问题

### Q: 返回 404 Not Found
A: 检查 API 路径是否正确配置，是否已发布

### Q: 返回 500 Internal Error
A: 检查云函数是否正常，查看云函数日志

### Q: 返回 CORS 错误
A: 检查跨域配置是否正确

### Q: 请求超时
A: 检查云函数执行时间，适当增加超时时间

