# ⚠️ 安全警告

## 重要提示

`cloudbaserc.json` 文件现在包含敏感信息：
- SecretId
- SecretKey
- JWT_SECRET

## 安全建议

### 1. 不要提交到 Git

如果要将代码提交到 Git 仓库，请确保：

**方法一：添加到 .gitignore（推荐）**

在项目根目录的 `.gitignore` 文件中添加：
```
cloud-functions/cloudbaserc.json
```

**方法二：使用 Git 本地配置**

```bash
git update-index --assume-unchanged cloud-functions/cloudbaserc.json
```

### 2. 创建示例文件

已创建 `cloudbaserc.json.example` 作为模板，不包含敏感信息。

### 3. 最佳实践

- ✅ 敏感信息通过腾讯云控制台设置（推荐）
- ✅ 使用环境变量文件（.env），并添加到 .gitignore
- ✅ 使用子账号密钥（更安全）
- ❌ 不要将密钥提交到公开仓库

## 当前配置状态

✅ 所有环境变量已配置完成：
- TCB_ENV
- JWT_SECRET
- TENCENT_SECRET_ID
- TENCENT_SECRET_KEY
- TENCENT_REGION
- COS_BUCKET
- COS_REGION

部署云函数时，这些环境变量会自动设置。


