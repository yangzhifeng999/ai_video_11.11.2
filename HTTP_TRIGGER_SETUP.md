# HTTP 触发器配置指南

## 📌 当前状态

- ✅ **云函数已部署**：auth, user, video, order, upload, payment, admin, taskCheck
- ⚠️ **HTTP 触发器需要手动配置**：需要在腾讯云控制台配置才能使 API 正常工作

## 🛠️ 配置 HTTP 触发器

### 访问控制台

打开：https://console.cloud.tencent.com/tcb/scf?envId=yang0313-7g4dqwd46c63d876

### 为每个函数配置触发器

按照以下步骤为每个函数配置 HTTP 触发器：

#### 1. admin 函数
1. 点击 `admin` 函数进入详情
2. 点击「触发管理」→「创建触发器」
3. 配置：
   - **触发方式**：HTTP 触发器
   - **路径**：`/api/admin`
   - **方法**：全选（GET、POST、PUT、DELETE、OPTIONS）
   - **鉴权方式**：免鉴权
4. 点击「提交」

#### 2. auth 函数
- **路径**：`/api/auth`
- **方法**：全选

#### 3. user 函数
- **路径**：`/api/user`
- **方法**：全选

#### 4. video 函数
- **路径**：`/api/videos`
- **方法**：全选

#### 5. order 函数
- **路径**：`/api/orders`
- **方法**：全选

#### 6. upload 函数
- **路径**：`/api/upload`
- **方法**：全选

#### 7. payment 函数
- **路径**：`/api/payment`
- **方法**：全选

### 配置完成后

1. 修改 `src/services/adminService.ts`：
```typescript
// 将这行
const ADMIN_USE_MOCK = true;

// 改为
const ADMIN_USE_MOCK = USE_MOCK_DATA;
```

2. 刷新页面测试 API 是否正常工作

## 📝 验证配置

配置完成后，可以使用以下命令测试：

```bash
# 测试管理后台 API
curl https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/admin/dashboard

# 测试登录 API
curl -X POST https://yang0313-7g4dqwd46c63d876.ap-shanghai.app.tcloudbase.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'
```

## 🔧 当前开发模式

在 HTTP 触发器配置完成前，系统使用 **Mock 数据** 进行开发测试：

- 内容审核页面：显示模拟的审核数据
- 视频管理页面：显示模拟的视频数据
- 所有操作都是模拟的，不会影响真实数据

---

**创建时间**：2025年12月7日



