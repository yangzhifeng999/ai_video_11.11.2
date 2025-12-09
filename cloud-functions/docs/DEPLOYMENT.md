# 部署指南

本文档说明如何部署云函数后端到腾讯云。

## 一、准备工作

### 1. 安装 CloudBase CLI

```bash
npm install -g @cloudbase/cli
```

### 2. 登录腾讯云

```bash
tcb login
```

### 3. 创建云开发环境

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/tcb)
2. 点击「新建环境」
3. 选择「按量计费」（推荐）或「包年包月」
4. 记录环境 ID（如 `heiha-xxx`）

## 二、配置项目

### 1. 修改环境 ID

编辑 `cloudbaserc.json`：

```json
{
  "envId": "你的环境ID"
}
```

### 2. 设置环境变量

在腾讯云控制台为每个云函数设置环境变量：

```
TCB_ENV=你的环境ID
JWT_SECRET=你的JWT密钥（随机字符串）
TENCENT_SECRET_ID=你的SecretId
TENCENT_SECRET_KEY=你的SecretKey
TENCENT_REGION=ap-guangzhou
COS_BUCKET=你的存储桶
COS_REGION=ap-guangzhou
VOD_SUB_APP_ID=你的VOD子应用ID
```

## 三、安装依赖

```bash
cd cloud-functions
npm install
```

## 四、部署云函数

### 部署所有函数

```bash
npm run deploy
```

### 部署单个函数

```bash
npm run deploy:auth
npm run deploy:user
npm run deploy:video
npm run deploy:order
npm run deploy:upload
npm run deploy:payment
npm run deploy:taskCheck
npm run deploy:admin
```

### 使用 CLI 直接部署

```bash
tcb fn deploy auth --envId 你的环境ID
```

## 五、初始化数据库

### 方法一：使用控制台

1. 进入云开发控制台
2. 选择「数据库」
3. 创建集合（参考 `database/init.js`）

### 方法二：运行初始化脚本

1. 创建临时云函数 `init`
2. 复制 `database/init.js` 内容
3. 执行函数
4. 删除临时函数

### 必须创建的集合

- users
- videos
- orders
- works
- comments
- likes
- collections
- follows
- point_records
- earnings
- withdrawals
- messages
- admin_users
- admin_logs
- system_config

## 六、配置 HTTP 触发器（替代 API 网关）

> **重要**：API 网关已停服（2025年6月30日），使用 HTTP 触发器替代。

参考 [HTTP_TRIGGER.md](./HTTP_TRIGGER.md) 配置 HTTP 触发器。

**快速配置步骤：**
1. 访问云函数控制台：https://console.cloud.tencent.com/tcb/scf?envId=yang0313-7g4dqwd46c63d876
2. 为每个函数（auth, user, video, order, upload, payment, admin）配置 HTTP 触发器
3. 路径设置为 `/api/{模块名}`
4. 方法选择：GET, POST, PUT, DELETE, OPTIONS
5. 鉴权方式：免鉴权（函数内部会验证 JWT）

**详细步骤请参考**：[HTTP_TRIGGER.md](./HTTP_TRIGGER.md)

> **注意**：云函数代码已添加 CORS 支持，无需额外配置。

## 七、配置 COS 存储

1. 创建存储桶
2. 设置公有读私有写（或私有读写+CDN）
3. 配置跨域规则

### 跨域配置

```json
{
  "AllowedOrigin": ["*"],
  "AllowedMethod": ["GET", "POST", "PUT", "DELETE", "HEAD"],
  "AllowedHeader": ["*"],
  "ExposeHeader": ["ETag"],
  "MaxAgeSeconds": 3000
}
```

## 八、配置 VOD

1. 开通云点播服务
2. 创建子应用（可选）
3. 配置转码模板
4. 配置事件通知

## 九、配置定时触发器

`taskCheck` 函数需要配置定时触发器：

1. 进入云函数控制台
2. 选择 `taskCheck` 函数
3. 点击「触发管理」
4. 添加触发器：
   - 触发方式：定时触发
   - Cron 表达式：`0 */1 * * * * *`（每分钟）

## 十、验证部署

### 检查云函数

```bash
tcb fn list --envId 你的环境ID
```

### 查看日志

```bash
tcb fn log auth --envId 你的环境ID --limit 50
```

### 测试接口

```bash
# 测试登录
curl -X POST https://你的API地址/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'
```

## 十一、前端配置

修改前端 `.env` 文件：

```env
VITE_API_BASE_URL=https://你的API地址
VITE_USE_MOCK_DATA=false
```

## 十二、监控与告警

### 配置告警

1. 进入「监控告警」
2. 创建告警策略
3. 配置触发条件：
   - 函数错误率 > 5%
   - 函数运行时长 > 5s
   - 函数并发超限

### 查看监控

- 调用次数
- 错误率
- 平均执行时间
- 并发数

## 常见问题

### Q: 部署失败
A: 检查网络连接，确认已登录 `tcb login`

### Q: 函数调用失败
A: 检查环境变量是否正确配置

### Q: 数据库连接失败
A: 确认环境 ID 正确，云函数和数据库在同一环境

### Q: 上传签名失败
A: 检查 COS 配置和密钥

### Q: 支付回调失败
A: 检查回调 URL 是否可访问，签名验证是否正确

## 更新部署

当代码更新后：

```bash
# 更新所有函数
npm run deploy

# 或更新单个函数
npm run deploy:video
```

## 回滚

如需回滚到之前版本：

1. 进入云函数控制台
2. 选择函数
3. 点击「版本」
4. 选择要回滚的版本
5. 点击「发布」

