# COS 存储配置指南

## 一、概述

本项目使用腾讯云对象存储（COS）存储用户上传的图片、视频等文件。

**存储桶信息：**
- 存储桶名称：`yang0313-storage-1318057968`
- 所属地域：上海（ap-shanghai）

## 二、配置步骤

### 1. 访问 COS 控制台

**地址**：https://console.cloud.tencent.com/cos

### 2. 进入存储桶

1. 找到存储桶：`yang0313-storage-1318057968`
2. 点击存储桶名称进入详情

### 3. 配置访问权限

#### 3.1 设置存储桶访问权限

1. 进入「**基础配置**」→「**访问权限**」
2. 选择「**私有读写**」（推荐）或「**公有读私有写**」
   - **私有读写**：更安全，需要签名访问
   - **公有读私有写**：文件可直接访问，适合公开资源

#### 3.2 配置 CDN 加速（可选）

如果需要 CDN 加速：
1. 进入「**域名管理**」
2. 开启「**默认 CDN 加速域名**」或配置「**自定义 CDN 加速域名**」
3. 配置 CDN 缓存规则

### 4. 配置跨域规则（CORS）

**重要**：前端需要直接上传文件到 COS，必须配置跨域规则。

#### 4.1 进入跨域配置

1. 进入「**安全管理**」→「**跨域访问 CORS**」
2. 点击「**添加规则**」

#### 4.2 配置跨域规则

**规则 1：允许所有来源（开发环境）**

```
来源 Origin: *
操作方法: GET, POST, PUT, DELETE, HEAD
Allow-Headers: *
Expose-Headers: ETag, x-cos-request-id
最大存活时间: 3600
```

**规则 2：仅允许指定域名（生产环境）**

```
来源 Origin: https://yourdomain.com, https://www.yourdomain.com
操作方法: GET, POST, PUT, DELETE, HEAD
Allow-Headers: *
Expose-Headers: ETag, x-cos-request-id
最大存活时间: 3600
```

#### 4.3 保存配置

点击「**确定**」保存跨域规则。

### 5. 配置存储类型

1. 进入「**基础配置**」→「**存储类型**」
2. 选择存储类型：
   - **标准存储**：适合频繁访问的文件（推荐）
   - **低频存储**：适合不频繁访问的文件
   - **归档存储**：适合长期保存的文件

### 6. 配置生命周期规则（可选）

1. 进入「**基础配置**」→「**生命周期**」
2. 创建规则：
   - 临时文件（如上传失败的文件）30天后自动删除
   - 旧版本文件自动删除

### 7. 配置防盗链（可选）

1. 进入「**安全管理**」→「**防盗链设置**」
2. 配置：
   - 白名单：允许访问的域名
   - 黑名单：禁止访问的域名

## 三、目录结构建议

建议按以下目录结构组织文件：

```
yang0313-storage-1318057968/
├── avatars/          # 用户头像
│   └── {userId}.jpg
├── videos/           # 视频文件（上传到 COS 后转 VOD）
│   └── {videoId}.mp4
├── images/           # 图片文件
│   ├── works/        # 作品图片
│   └── covers/       # 封面图片
├── uploads/          # 临时上传文件
│   └── {timestamp}_{filename}
└── temp/             # 临时文件
    └── {taskId}/
```

## 四、获取访问密钥

### 1. 获取 SecretId 和 SecretKey

1. 访问：https://console.cloud.tencent.com/cam/capi
2. 查看或创建 API 密钥
3. 记录：
   - SecretId: `AKIDiPuCHZkiZDet1zkJfrulRp45tXyBAvVs`
   - SecretKey: `EE1bzEF3e2OXSAgy2yhCTZUCgwzpRq2z`

> **注意**：密钥已配置在云函数环境变量中。

## 五、前端上传配置

### 1. 获取上传签名

前端需要调用云函数获取 COS 上传签名：

```typescript
// 调用上传接口获取签名
const response = await api.post('/api/upload/sign', {
  fileName: file.name,
  fileType: 'image',
  path: 'avatars/'
});

// 使用签名上传到 COS
const cos = new COS({
  SecretId: response.data.secretId,
  SecretKey: response.data.secretKey,
  // ...
});
```

### 2. 直接上传到 COS

```typescript
cos.putObject({
  Bucket: 'yang0313-storage-1318057968',
  Region: 'ap-shanghai',
  Key: 'avatars/user123.jpg',
  Body: file,
  onProgress: (progressData) => {
    console.log('上传进度:', progressData.percent);
  }
}, (err, data) => {
  if (err) {
    console.error('上传失败:', err);
  } else {
    console.log('上传成功:', data.Location);
  }
});
```

## 六、测试配置

### 1. 测试跨域配置

使用浏览器控制台测试：

```javascript
fetch('https://yang0313-storage-1318057968.cos.ap-shanghai.myqcloud.com/test.txt', {
  method: 'GET',
  headers: {
    'Origin': 'https://yourdomain.com'
  }
})
.then(res => console.log('CORS 配置成功'))
.catch(err => console.error('CORS 配置失败:', err));
```

### 2. 测试上传

1. 调用云函数获取上传签名
2. 使用签名上传测试文件
3. 检查文件是否成功上传

## 七、常见问题

### Q: 跨域请求失败

**A:** 检查：
1. 跨域规则是否正确配置
2. 来源域名是否在允许列表中
3. 请求方法是否在允许列表中

### Q: 上传签名失败

**A:** 检查：
1. SecretId 和 SecretKey 是否正确
2. 存储桶名称和地域是否正确
3. 云函数环境变量是否配置

### Q: 文件访问 403

**A:** 检查：
1. 存储桶访问权限设置
2. 文件是否设置了正确的 ACL
3. 签名是否过期

### Q: 如何设置文件为公开访问？

**A:** 
1. 上传时设置 ACL 为 `public-read`
2. 或使用存储桶策略允许公开读取

## 八、安全建议

1. **使用私有读写**：默认所有文件私有，需要签名访问
2. **配置 CDN**：使用 CDN 加速并配置防盗链
3. **限制上传大小**：在云函数中限制文件大小
4. **文件类型验证**：只允许上传指定类型的文件
5. **定期清理**：清理临时文件和过期文件

## 九、下一步

完成 COS 配置后，继续：

1. ✅ **配置 VOD** - 开通云点播服务
2. ✅ **配置定时触发器** - taskCheck 函数定时任务
3. ✅ **测试上传功能** - 验证文件上传是否正常

---

**更新时间**: 2025年1月
**状态**: ✅ COS 配置指南已就绪

