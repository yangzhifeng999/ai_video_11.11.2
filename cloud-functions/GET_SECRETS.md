# 获取腾讯云 SecretId 和 SecretKey 指南

## 步骤

### 1. 访问 API 密钥管理页面

访问：https://console.cloud.tencent.com/cam/capi

或者：
1. 登录腾讯云控制台
2. 点击右上角头像 → 「访问管理」
3. 左侧菜单选择「API密钥管理」

### 2. 创建密钥

1. 点击「新建密钥」按钮
2. 如果提示需要验证，完成身份验证（手机验证码等）
3. 创建成功后，会显示：
   - **SecretId**：类似 `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`（示例格式）
   - **SecretKey**：类似 `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`（示例格式）

⚠️ **重要**：SecretKey 只显示一次，请立即保存！

### 3. 更新环境变量

获取到 SecretId 和 SecretKey 后：

1. 编辑 `setup-env.ps1` 文件
2. 取消注释并填入实际值：
   ```powershell
   $envVars["TENCENT_SECRET_ID"] = "你的实际SecretId"
   $envVars["TENCENT_SECRET_KEY"] = "你的实际SecretKey"
   ```
3. 重新运行脚本：`.\setup-env.ps1`

### 4. 安全提示

- ⚠️ 不要将 SecretKey 提交到 Git
- ⚠️ 不要分享给他人
- ⚠️ 定期轮换密钥
- ✅ 使用子账号密钥（更安全）


