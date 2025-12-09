# 数据库初始化指南

## 一、概述

本项目使用腾讯云 CloudBase 云开发数据库（MongoDB），需要创建 16 个集合。

## 二、需要创建的集合列表

| 集合名 | 说明 | 权限设置 |
|--------|------|----------|
| `users` | 用户表 | 读取全部数据，修改本人数据 |
| `videos` | 视频表 | 读取全部数据，修改本人数据 |
| `orders` | 订单表 | 读取全部数据，修改本人数据 |
| `works` | 作品表 | 读取全部数据，修改本人数据 |
| `comments` | 评论表 | 读取全部数据，修改本人数据 |
| `likes` | 点赞表 | 读取全部数据，修改本人数据 |
| `collections` | 收藏表 | 读取全部数据，修改本人数据 |
| `follows` | 关注表 | 读取全部数据，修改本人数据 |
| `point_records` | 积分记录表 | 读取全部数据，修改本人数据 |
| `earnings` | 收益表 | 读取全部数据，修改本人数据 |
| `withdrawals` | 提现表 | 读取全部数据，修改本人数据 |
| `messages` | 消息表 | 读取全部数据，修改本人数据 |
| `admin_users` | 管理员表 | 读取全部数据，不可修改数据 |
| `admin_logs` | 管理员日志表 | 无权限（后台流水数据） |
| `system_config` | 系统配置表 | 读取全部数据，不可修改数据 |
| `tasks` | AI 换脸任务表 | 读取全部数据，修改本人数据 |

## 三、创建集合步骤

### 方法一：使用控制台创建（推荐）

1. **访问云开发控制台**
   - 地址：https://console.cloud.tencent.com/tcb
   - 选择环境：`yang0313`（环境ID: `yang0313-7g4dqwd46c63d876`）

2. **进入数据库页面**
   - 点击左侧菜单「数据库」
   - 点击「创建集合」

3. **创建每个集合**
   - 输入集合名称（如 `users`）
   - 选择权限设置（参考上表）
   - 点击「确定」

4. **重复步骤 3**，创建所有 16 个集合

### 方法二：使用初始化脚本

1. **创建临时云函数**
   - 在云函数控制台创建新函数：`db-init`
   - 运行环境：Node.js 16.13
   - 入口文件：`index.js`

2. **复制脚本内容**
   - 将 `cloud-functions/database/init.js` 的内容复制到函数代码中
   - 确保环境变量 `TCB_ENV` 已设置

3. **执行函数**
   - 点击「测试」或「执行」
   - 查看执行结果

4. **删除临时函数**
   - 执行完成后，删除 `db-init` 函数

## 四、创建索引

创建集合后，需要为以下集合创建索引以提高查询性能：

### users 集合
- `phone`（唯一索引）
- `wxOpenId`（唯一索引）
- `createdAt`（降序）

### videos 集合
- `creatorId`
- `category`
- `status`
- `createdAt`（降序）

### orders 集合
- `userId`
- `orderNo`（唯一索引）
- `status`
- `createdAt`（降序）

### works 集合
- `creatorId`
- `videoId`
- `status`

### comments 集合
- `videoId`
- `userId`
- `createdAt`（降序）

### likes 集合
- `userId` + `videoId`（联合唯一索引）

### collections 集合
- `userId` + `videoId`（联合唯一索引）

### follows 集合
- `followerId` + `followingId`（联合唯一索引）
- `followingId`

### point_records 集合
- `userId`
- `createdAt`（降序）

### earnings 集合
- `creatorId`
- `createdAt`（降序）

### withdrawals 集合
- `userId`
- `status`
- `createdAt`（降序）

### messages 集合
- `userId`
- `isRead`
- `createdAt`（降序）

### admin_users 集合
- `username`（唯一索引）

### admin_logs 集合
- `adminId`
- `createdAt`（降序）

### system_config 集合
- `key`（唯一索引）

### tasks 集合
- `taskId`（唯一索引）
- `userId`
- `status`
- `orderId`
- `createdAt`（降序）

**创建索引步骤：**
1. 进入集合详情页
2. 点击「索引」标签
3. 点击「创建索引」
4. 选择字段和排序方向
5. 如果是唯一索引，勾选「唯一」
6. 点击「确定」

## 五、创建默认管理员

### 方法一：使用控制台

1. 进入 `admin_users` 集合
2. 点击「添加记录」
3. 添加以下字段：

```json
{
  "_id": "admin001",
  "username": "admin",
  "password": "需要加密后的密码（见下方说明）",
  "nickname": "超级管理员",
  "role": "super_admin",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**密码加密：**
- 默认密码：`admin123`
- 使用 bcrypt 加密（10轮）
- 可以在初始化脚本中生成，或使用在线工具

### 方法二：使用初始化脚本

运行 `database/init.js` 脚本会自动创建默认管理员：
- 用户名：`admin`
- 密码：`admin123`（已加密）

## 六、创建系统配置

### 方法一：使用控制台

1. 进入 `system_config` 集合
2. 点击「添加记录」
3. 添加以下字段：

```json
{
  "_id": "config001",
  "key": "main",
  "platformName": "嘿哈",
  "platformLogo": "",
  "platformRate": 0.3,
  "minWithdrawAmount": 1000,
  "newUserPoints": 1000,
  "dailyCheckInPoints": 10,
  "enableWechatLogin": true,
  "enableAlipay": true,
  "enableWithdraw": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### 方法二：使用初始化脚本

运行 `database/init.js` 脚本会自动创建系统配置。

## 七、验证初始化

### 检查集合

1. 在数据库页面查看所有集合
2. 确认 16 个集合都已创建

### 检查索引

1. 进入每个集合的「索引」页面
2. 确认必要的索引都已创建

### 检查默认数据

1. 检查 `admin_users` 集合是否有默认管理员
2. 检查 `system_config` 集合是否有系统配置

## 八、常见问题

### Q: 集合创建失败

**A:** 检查：
1. 环境 ID 是否正确
2. 是否有创建集合的权限
3. 集合名称是否符合规范（小写字母、数字、下划线）

### Q: 索引创建失败

**A:** 检查：
1. 字段名是否正确
2. 唯一索引是否有重复数据
3. 索引数量是否超过限制

### Q: 如何修改集合权限？

**A:** 
1. 进入集合详情
2. 点击「权限设置」
3. 修改权限规则
4. 保存

### Q: 如何删除集合？

**A:**
1. 进入集合详情
2. 点击「删除集合」
3. 确认删除（⚠️ 此操作不可恢复）

## 九、下一步

完成数据库初始化后，继续：

1. ✅ **配置 COS 存储** - 设置存储桶和跨域规则
2. ✅ **配置 VOD** - 开通云点播服务
3. ✅ **配置定时触发器** - taskCheck 函数定时任务
4. ✅ **测试 API 接口** - 验证数据库连接

---

**更新时间**: 2025年1月
**状态**: ✅ 数据库初始化指南已就绪

