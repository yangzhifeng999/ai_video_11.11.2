# 环境变量设置完成说明

## ✅ 已自动设置的环境变量

以下环境变量已通过 `cloudbaserc.json` 配置，部署时会自动设置：

- ✅ `TCB_ENV` = `yang0313-7g4dqwd46c63d876`
- ✅ `JWT_SECRET` = `306f9b145624e3a46f7f6335ea8f4364e660bed9f17c2a0f281d877304f2ad24` (已生成)
- ✅ `TENCENT_REGION` = `ap-shanghai`
- ✅ `COS_BUCKET` = `yang0313-storage-1318057968`
- ✅ `COS_REGION` = `ap-shanghai`

## ⚠️ 需要手动设置的环境变量

以下环境变量需要你获取后手动设置（敏感信息，建议通过控制台设置）：

### 1. 获取 SecretId 和 SecretKey

**步骤：**
1. 访问：https://console.cloud.tencent.com/cam/capi
2. 点击「新建密钥」
3. 完成身份验证
4. 复制显示的 SecretId 和 SecretKey（SecretKey 只显示一次，请立即保存！）

### 2. 设置方式（两种方法任选其一）

#### 方法一：通过腾讯云控制台设置（推荐）

1. 访问：https://console.cloud.tencent.com/tcb
2. 选择环境：`yang0313`
3. 进入「云函数」→ 选择任意函数（如 `auth`）
4. 点击「函数配置」→「环境变量」
5. 添加以下环境变量：
   - `TENCENT_SECRET_ID` = 你的 SecretId
   - `TENCENT_SECRET_KEY` = 你的 SecretKey
6. 对每个函数（auth, user, video, order, upload, payment, taskCheck, admin）重复上述步骤

#### 方法二：通过配置文件添加（部署时自动设置）

编辑 `cloudbaserc.json`，在每个函数的 `envVariables` 中添加：

```json
"TENCENT_SECRET_ID": "你的SecretId",
"TENCENT_SECRET_KEY": "你的SecretKey"
```

⚠️ **注意**：此方法会将密钥写入配置文件，如果提交到 Git，请确保已添加到 `.gitignore`

### 3. 可选环境变量

如果需要使用 VOD（视频点播）功能，还需要设置：
- `VOD_SUB_APP_ID` = 你的 VOD 子应用 ID

## 📝 下一步

1. ✅ 获取 SecretId 和 SecretKey
2. ✅ 设置环境变量（通过控制台或配置文件）
3. ⏭️ 部署云函数（下一步）

## 🔒 安全提示

- ⚠️ 不要将 SecretKey 提交到 Git 仓库
- ⚠️ 不要分享 SecretKey 给他人
- ✅ 建议使用子账号密钥（更安全）
- ✅ 定期轮换密钥


