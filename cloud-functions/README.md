# 嘿哈 云函数后端

基于腾讯云 CloudBase 的 Serverless 后端服务。

## 项目结构

```
cloud-functions/
├── functions/                # 云函数目录
│   ├── shared/              # 共享模块
│   │   ├── database.js      # 数据库操作
│   │   ├── response.js      # 统一响应格式
│   │   ├── auth.js          # JWT 认证
│   │   ├── utils.js         # 工具函数
│   │   └── tencent.js       # 腾讯云服务集成
│   ├── auth/                # 认证云函数
│   │   └── index.js
│   ├── user/                # 用户云函数
│   │   └── index.js
│   ├── video/               # 视频云函数
│   │   └── index.js
│   ├── order/               # 订单云函数
│   │   └── index.js
│   ├── upload/              # 上传云函数
│   │   └── index.js
│   ├── payment/             # 支付云函数
│   │   └── index.js
│   ├── taskCheck/           # 定时任务云函数
│   │   └── index.js
│   └── admin/               # 后台管理云函数
│       └── index.js
├── cloudbaserc.json         # CloudBase 配置
├── package.json
└── README.md
```

## 云函数说明

| 函数名 | 职责 | 触发方式 |
|--------|------|----------|
| auth | 登录、注册、微信登录、Token刷新 | API 网关 |
| user | 用户信息、积分、收藏、关注 | API 网关 |
| video | 视频列表、详情、点赞、评论 | API 网关 |
| order | 订单创建、查询、取消、退款 | API 网关 |
| upload | 文件上传签名、创建作品 | API 网关 |
| payment | 创建支付、支付回调 | API 网关 |
| taskCheck | 检查VOD任务状态、更新订单 | 定时触发器（每分钟）|
| admin | 后台管理（用户、视频、订单、配置） | API 网关 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 安装 CloudBase CLI

```bash
npm install -g @cloudbase/cli
```

### 3. 登录腾讯云

```bash
tcb login
```

### 4. 修改配置

编辑 `cloudbaserc.json`，将 `envId` 改为你的云开发环境 ID。

### 5. 部署云函数

```bash
# 部署所有函数
npm run deploy

# 部署单个函数
npm run deploy:auth
npm run deploy:user
# ...
```

## 环境变量

在腾讯云控制台设置云函数环境变量：

```
# 通用
TCB_ENV=你的环境ID
JWT_SECRET=你的JWT密钥

# 腾讯云
TENCENT_SECRET_ID=你的SecretId
TENCENT_SECRET_KEY=你的SecretKey
TENCENT_REGION=ap-guangzhou

# COS
COS_BUCKET=你的存储桶名称
COS_REGION=ap-guangzhou

# VOD
VOD_SUB_APP_ID=你的VOD子应用ID

# 微信支付
WECHAT_PAY_APP_ID=你的AppId
WECHAT_PAY_MCH_ID=你的商户号
WECHAT_PAY_API_KEY=你的API密钥
WECHAT_PAY_NOTIFY_URL=https://你的域名/api/payment/wechat/notify

# 支付宝
ALIPAY_APP_ID=你的AppId
ALIPAY_PRIVATE_KEY=你的私钥
ALIPAY_PUBLIC_KEY=支付宝公钥
ALIPAY_NOTIFY_URL=https://你的域名/api/payment/alipay/notify
```

## API 路由

### 认证模块 (auth)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 手机号密码登录 |
| POST | /api/auth/register | 注册 |
| POST | /api/auth/wechat | 微信登录 |
| POST | /api/auth/refresh | 刷新Token |
| POST | /api/auth/send-code | 发送验证码 |
| POST | /api/auth/login-code | 验证码登录 |

### 用户模块 (user)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/user/profile | 获取个人信息 |
| PUT | /api/user/profile | 更新个人信息 |
| GET | /api/user/points | 获取积分 |
| GET | /api/user/points/records | 获取积分记录 |
| POST | /api/user/check-in | 每日签到 |
| GET | /api/user/collections | 获取收藏列表 |
| POST | /api/user/collections | 添加收藏 |
| DELETE | /api/user/collections/:videoId | 取消收藏 |
| GET | /api/user/following | 获取关注列表 |
| POST | /api/user/follow | 关注用户 |
| POST | /api/user/unfollow | 取消关注 |
| GET | /api/user/followers | 获取粉丝列表 |
| POST | /api/user/become-creator | 申请成为创作者 |
| GET | /api/user/stats | 获取用户统计数据 |

### 视频模块 (video)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/videos | 获取视频列表 |
| GET | /api/videos/:id | 获取视频详情 |
| POST | /api/videos/:id/like | 点赞视频 |
| DELETE | /api/videos/:id/like | 取消点赞 |
| POST | /api/videos/:id/dislike | 不喜欢视频 |
| GET | /api/videos/:id/comments | 获取评论列表 |
| POST | /api/videos/:id/comments | 发表评论 |
| DELETE | /api/videos/:id/comments/:commentId | 删除评论 |
| GET | /api/creators/:id | 获取创作者信息 |
| GET | /api/creators/:id/videos | 获取创作者视频 |
| GET | /api/videos/search | 搜索视频 |

### 订单模块 (order)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/orders | 获取订单列表 |
| POST | /api/orders | 创建订单 |
| GET | /api/orders/:id | 获取订单详情 |
| POST | /api/orders/:id/cancel | 取消订单 |
| POST | /api/orders/:id/refund | 申请退款 |

### 上传模块 (upload)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/upload/cos-sign | 获取COS上传签名 |
| POST | /api/upload/vod-sign | 获取VOD上传签名 |
| POST | /api/upload/vod-commit | 确认VOD上传 |
| POST | /api/upload/create-video | 创建视频作品 |
| PUT | /api/upload/videos/:id | 更新视频作品 |
| DELETE | /api/upload/videos/:id | 删除视频作品 |
| GET | /api/upload/my-works | 获取我的作品 |
| PUT | /api/upload/videos/:id/status | 上架/下架视频 |

### 支付模块 (payment)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/payment/create | 创建支付 |
| POST | /api/payment/query | 查询支付状态 |
| POST | /api/payment/wechat/notify | 微信支付回调 |
| POST | /api/payment/alipay/notify | 支付宝回调 |

### 后台管理模块 (admin)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/login | 管理员登录 |
| GET | /api/admin/dashboard | 仪表盘数据 |
| GET | /api/admin/users | 用户列表 |
| GET | /api/admin/users/:id | 用户详情 |
| PUT | /api/admin/users/:id | 更新用户 |
| POST | /api/admin/users/:id/ban | 封禁用户 |
| GET | /api/admin/videos | 视频列表 |
| POST | /api/admin/videos/:id/review | 审核视频 |
| DELETE | /api/admin/videos/:id | 删除视频 |
| GET | /api/admin/orders | 订单列表 |
| GET | /api/admin/orders/:id | 订单详情 |
| POST | /api/admin/orders/:id/refund | 管理员退款 |
| GET | /api/admin/withdrawals | 提现列表 |
| POST | /api/admin/withdrawals/:id/approve | 审核通过 |
| POST | /api/admin/withdrawals/:id/reject | 拒绝提现 |
| GET | /api/admin/config | 获取系统配置 |
| PUT | /api/admin/config | 更新系统配置 |
| GET | /api/admin/stats/overview | 统计概览 |
| GET | /api/admin/stats/revenue | 收入统计 |
| GET | /api/admin/logs | 操作日志 |

## 数据库集合

| 集合名 | 说明 |
|--------|------|
| users | 用户信息 |
| videos | 视频/模板 |
| orders | 订单 |
| works | 创作者作品 |
| comments | 评论 |
| likes | 点赞 |
| collections | 收藏 |
| follows | 关注关系 |
| point_records | 积分记录 |
| earnings | 收益记录 |
| withdrawals | 提现记录 |
| messages | 消息通知 |
| admin_users | 管理员 |
| admin_logs | 管理员操作日志 |
| system_config | 系统配置 |

## 开发说明

### 本地调试

使用 CloudBase 本地调试工具：

```bash
tcb fn invoke auth --params '{"path":"/auth/login","httpMethod":"POST","body":"{\"phone\":\"13800138000\",\"password\":\"123456\"}"}'
```

### 查看日志

```bash
tcb fn log auth --limit 50
```

### 注意事项

1. 所有云函数共享 `shared` 目录下的模块
2. 每个云函数需要有自己的 `package.json`（如需额外依赖）
3. 定时任务函数 `taskCheck` 会自动触发
4. 支付回调需要配置 API 网关白名单
5. 敏感配置使用环境变量，不要硬编码

## 部署流程

1. 本地开发测试
2. 提交代码到 Git
3. 在测试环境部署测试
4. 测试通过后部署到生产环境

```bash
# 测试环境
tcb fn deploy --envId test-env-id

# 生产环境
tcb fn deploy --envId prod-env-id
```

## License

MIT

