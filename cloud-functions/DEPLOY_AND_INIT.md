# 云函数部署与初始化指南

## 快速开始

### 1. 安装腾讯云 CLI（如已安装跳过）

```bash
npm install -g @cloudbase/cli
```

### 2. 登录腾讯云

```bash
tcb login
```

### 3. 部署云函数

进入 cloud-functions 目录后执行：

```bash
# 部署所有云函数
tcb fn deploy --all --envId yang0313-7g4dqwd46c63d876

# 或单独部署特定函数
tcb fn deploy admin --envId yang0313-7g4dqwd46c63d876
tcb fn deploy init --envId yang0313-7g4dqwd46c63d876
```

### 4. 初始化数据库和管理员账号

在腾讯云控制台执行 `init` 云函数：

**方法1：控制台执行**
1. 进入 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)
2. 选择环境 `yang0313-7g4dqwd46c63d876`
3. 进入 云函数 → init
4. 点击 "云端测试" 或 "立即执行"
5. 函数会创建所有数据库集合和管理员账号

**方法2：命令行执行**
```bash
tcb fn invoke init --envId yang0313-7g4dqwd46c63d876
```

### 5. 配置 HTTP 触发器

在腾讯云控制台为以下云函数配置 HTTP 触发器：

| 云函数 | HTTP 路径 | 方法 |
|--------|-----------|------|
| auth   | /api/auth | ANY  |
| user   | /api/user | ANY  |
| video  | /api/videos | ANY |
| order  | /api/orders | ANY |
| upload | /api/upload | ANY |
| payment | /api/payment | ANY |
| admin  | /api/admin | ANY |

**注意**：每个触发器都需要开启 **路径透传**。

### 6. 验证部署

执行以下命令测试登录接口：

```bash
curl -X POST https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yang0313"}'
```

预期返回：
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "token": "...",
    "admin": {
      "id": "...",
      "username": "admin",
      "nickname": "超级管理员",
      "role": "super_admin"
    }
  }
}
```

## 管理员账号

初始化后的管理员账号：
- **用户名**: `admin`
- **密码**: `yang0313`

## 常见问题

### Q1: "Function code exception caught" 错误

可能原因：
1. 数据库集合未创建 - 执行 `init` 云函数
2. 云函数依赖未安装 - 重新部署云函数
3. 环境变量未配置 - 检查 cloudbaserc.json

### Q2: 登录返回 404

可能原因：
1. HTTP 触发器未配置
2. 路径透传未开启
3. 路径配置错误

### Q3: CORS 跨域错误

检查云函数代码是否正确设置了 CORS 响应头。

## 部署检查清单

- [ ] 腾讯云 CLI 已安装
- [ ] 已登录腾讯云
- [ ] 所有云函数已部署
- [ ] init 云函数已执行
- [ ] HTTP 触发器已配置
- [ ] 路径透传已开启
- [ ] 前端 .env.development 已配置

## API 地址

- 基础地址：`https://yang0313-7g4dqwd46c63d876-1318057968.ap-shanghai.app.tcloudbase.com`
- API 前缀：`/api`
- 完整地址：`https://yang0313-7g4dqwd46c63d876-1318057968.ap-shanghai.app.tcloudbase.com/api`

**注意**：域名中包含环境ID和AppID（`-1318057968`），不要遗漏！

