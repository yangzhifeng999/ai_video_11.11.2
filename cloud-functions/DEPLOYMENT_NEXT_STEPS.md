# 云函数部署完成 - 后续配置步骤

## ✅ 已部署的函数

所有 8 个云函数已成功部署：
- ✅ auth
- ✅ user
- ✅ video
- ✅ order
- ✅ upload
- ✅ payment
- ✅ taskCheck
- ✅ admin

## ⚠️ 需要完成的配置

由于 Framework 部署遇到"构建中"的限制，函数已使用默认配置部署。需要手动完成以下配置：

### 1. 更新运行时版本

当前所有函数使用 `Nodejs10.15`，需要更新为 `Nodejs16.13`：

**操作步骤：**
1. 访问：https://console.cloud.tencent.com/tcb/scf?envId=yang0313-7g4dqwd46c63d876
2. 对每个函数：
   - 点击函数名称进入详情
   - 点击「函数配置」
   - 修改「运行环境」为 `Nodejs16.13`
   - 保存

### 2. 设置环境变量

所有函数需要设置以下环境变量：

| 变量名 | 值 |
|--------|-----|
| `TCB_ENV` | `yang0313-7g4dqwd46c63d876` |
| `JWT_SECRET` | `306f9b145624e3a46f7f6335ea8f4364e660bed9f17c2a0f281d877304f2ad24` |
| `TENCENT_SECRET_ID` | `你的实际SecretId`（从腾讯云控制台获取） |
| `TENCENT_SECRET_KEY` | `你的实际SecretKey`（从腾讯云控制台获取） |
| `TENCENT_REGION` | `ap-shanghai` |
| `COS_BUCKET` | `yang0313-storage-1318057968` |
| `COS_REGION` | `ap-shanghai` |

**操作步骤：**
1. 访问：https://console.cloud.tencent.com/tcb/scf?envId=yang0313-7g4dqwd46c63d876
2. 对每个函数：
   - 点击函数名称进入详情
   - 点击「函数配置」→「环境变量」
   - 逐个添加上述环境变量
   - 保存

### 3. 配置定时触发器（taskCheck 函数）

`taskCheck` 函数需要配置定时触发器：

**操作步骤：**
1. 进入 `taskCheck` 函数详情
2. 点击「触发管理」
3. 添加触发器：
   - 触发方式：定时触发
   - Cron 表达式：`0 */1 * * * * *`（每分钟）
   - 启用：是

### 4. 配置 HTTP 触发器（可选）

如果需要通过 HTTP 访问云函数：

**操作步骤：**
1. 进入函数详情
2. 点击「触发管理」
3. 添加触发器：
   - 触发方式：HTTP 触发器
   - 路径：根据需要设置（如 `/api/auth`）
   - 方法：GET、POST、PUT、DELETE、OPTIONS

## 🔄 或者：等待 Framework 构建完成后重新部署

如果 Framework 项目构建完成，可以使用以下命令重新部署（会自动应用所有配置）：

```bash
tcb framework deploy
```

这会自动：
- 更新运行时为 Nodejs16.13
- 设置所有环境变量
- 配置触发器

## 📝 下一步

完成上述配置后，可以：
1. ✅ 初始化数据库（创建集合）
2. ✅ 测试 API 接口
3. ✅ 配置前端 API 地址

---

**部署时间**: 2025年1月
**状态**: ✅ 函数代码已部署，需要完成运行时和环境变量配置


