# RunningHub API 对接指南

## 一、概述

本文档说明如何对接 RunningHub API 实现 AI 视频换脸功能。

**RunningHub 官方文档**：https://www.runninghub.cn/runninghub-api-doc-cn/

## 二、功能说明

### 2.1 业务流程

```
用户购买模板 → 上传照片(COS) → 创建任务 → 上传照片(RH) → 创建RH任务 → 轮询状态 → 下载视频 → 完成
```

### 2.2 相关文件

| 文件 | 说明 |
|------|------|
| `shared/runninghub.js` | RunningHub API 封装模块 |
| `shared/taskManager.js` | 任务管理模块 |
| `upload/index.js` | 任务创建接口 |
| `taskCheck/index.js` | 任务状态轮询 |

## 三、RunningHub API 封装

### 3.1 主要方法

```javascript
const { runningHubService } = require('./shared/runninghub');

// 1. 上传资源
const result = await runningHubService.uploadResource(fileBuffer, fileName);
// 返回: { fileName: "api/xxx.png", fileType: "input" }

// 2. 创建任务（简易模式）
const task = await runningHubService.createTaskSimple(workflowId);
// 返回: { taskId: "xxx", taskStatus: "RUNNING" }

// 3. 创建任务（高级模式，带参数）
const nodeInfoList = [
  { nodeId: "10", fieldName: "image", fieldValue: "api/xxx.png" }
];
const task = await runningHubService.createTask(workflowId, nodeInfoList);

// 4. 查询任务状态
const status = await runningHubService.getTaskStatus(taskId);
// 返回: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED"

// 5. 获取任务结果
const outputs = await runningHubService.getTaskOutputs(taskId);
// 返回: [{ fileUrl: "https://xxx", fileType: "mp4", taskCostTime: "83" }]
```

### 3.2 任务状态

| 状态 | 说明 |
|------|------|
| `QUEUED` | 排队中 |
| `RUNNING` | 处理中 |
| `SUCCESS` | 成功 |
| `FAILED` | 失败 |

## 四、任务管理

### 4.1 任务状态流转

```
PENDING → UPLOADING → PROCESSING → DOWNLOADING → COMPLETED
                 ↓           ↓            ↓
               FAILED     FAILED       FAILED
                 ↓
              TIMEOUT
```

### 4.2 数据库结构（tasks 集合）

```javascript
{
  taskId: "task_xxx",              // 任务 ID
  userId: "user_xxx",              // 用户 ID
  orderId: "order_xxx",            // 订单 ID
  videoId: "video_xxx",            // 视频模板 ID
  workflowId: "1850925505116598274", // RunningHub 工作流 ID
  type: "face_swap",               // 任务类型
  
  status: "processing",            // 任务状态
  progress: 50,                    // 进度（0-100）
  
  inputPhotoUrl: "https://cos/xxx.jpg",  // 用户照片 URL
  runningHubFileName: "api/xxx.jpg",     // RH 上传后的文件名
  runningHubTaskId: "1904737800233889793", // RH 任务 ID
  runningHubStatus: "RUNNING",           // RH 任务状态
  
  outputVideoUrl: "https://rh/xxx.mp4",  // 输出视频 URL
  outputFileType: "mp4",                 // 输出文件类型
  taskCostTime: "83",                    // 任务耗时（秒）
  
  errorMessage: null,              // 错误信息
  errorCode: null,                 // 错误码
  retryCount: 0,                   // 重试次数
  maxRetries: 3,                   // 最大重试次数
  
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  startedAt: "2025-01-01T00:00:00Z",
  completedAt: "2025-01-01T00:00:00Z",
  
  timeoutMs: 1800000,              // 超时时间（毫秒）
}
```

## 五、API 接口

### 5.1 创建 AI 换脸任务

**POST** `/api/upload/create-task`

**请求参数**：
```json
{
  "orderId": "order_xxx",      // 已支付的订单 ID
  "videoId": "video_xxx",      // 视频模板 ID
  "inputPhotoUrl": "https://cos.xxx/photo.jpg"  // 用户照片 URL
}
```

**响应**：
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "taskId": "task_xxx",
    "status": "pending",
    "estimatedTime": 180,  // 预估秒数
    "message": "任务已创建，正在排队处理"
  }
}
```

### 5.2 查询任务状态

**POST** `/api/upload/task-status`

**请求参数**：
```json
{
  "taskId": "task_xxx"
}
```

**响应**：
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "taskId": "task_xxx",
    "status": "completed",
    "progress": 100,
    "outputVideoUrl": "https://rh-images.xxx/output.mp4",
    "createdAt": "2025-01-01T00:00:00Z",
    "completedAt": "2025-01-01T00:05:00Z",
    "taskCostTime": "180"
  }
}
```

### 5.3 获取任务列表

**GET** `/api/upload/my-tasks?page=1&pageSize=20&status=completed`

**响应**：
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "list": [
      {
        "taskId": "task_xxx",
        "videoId": "video_xxx",
        "status": "completed",
        "progress": 100,
        "outputVideoUrl": "https://xxx/output.mp4",
        "createdAt": "2025-01-01T00:00:00Z",
        "completedAt": "2025-01-01T00:05:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

### 5.4 取消任务

**POST** `/api/upload/tasks/{taskId}/cancel`

**响应**：
```json
{
  "code": 0,
  "message": "任务已取消"
}
```

## 六、视频模板配置

### 6.1 videos 集合新增字段

```javascript
{
  // ... 原有字段 ...
  
  // RunningHub 配置
  runningHubWorkflowId: "1850925505116598274",  // 工作流 ID（必填）
  imageNodeId: "10",                             // 图片输入节点 ID（默认 10）
  imageFieldName: "image",                       // 图片字段名（默认 image）
  
  // 支付配置
  paymentPageId: "payment_page_001",             // 支付页面 ID
}
```

### 6.2 配置工作流

1. 登录 RunningHub 控制台
2. 打开目标工作流
3. 记录地址栏中的 workflow ID
4. 确保工作流已手动运行成功过
5. 记录图片输入节点的 nodeId 和 fieldName

## 七、定时任务配置

### 7.1 taskCheck 定时触发器

**配置**：每分钟执行一次

```json
{
  "name": "timer",
  "type": "timer",
  "config": "0 */1 * * * * *"
}
```

### 7.2 任务处理流程

```
1. 获取待处理任务（status in [pending, uploading, processing, downloading]）
2. 根据任务状态执行相应处理：
   - pending: 开始上传资源到 RunningHub
   - uploading: 检查是否卡住
   - processing: 查询 RunningHub 任务状态
   - downloading: 下载结果视频
3. 检查超时任务
4. 更新订单状态
5. 发送通知
```

## 八、环境变量配置

在 `cloudbaserc.json` 中添加：

```json
{
  "envVariables": {
    "RUNNINGHUB_API_KEY": "your_api_key_here"
  }
}
```

或在腾讯云控制台为云函数配置环境变量。

## 九、获取 API Key

1. 登录 https://www.runninghub.cn
2. 点击右上角头像
3. 进入「API 控制台」
4. 复制 32 位 API KEY

**注意**：
- 需要基础版及以上会员才能使用 API
- 免费用户无法使用 API
- API 调用消耗 RH 币

## 十、错误处理

### 10.1 常见错误码

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| `START_FAILED` | 任务启动失败 | 重试或退款 |
| `RH_FAILED` | RunningHub 处理失败 | 检查工作流 |
| `DOWNLOAD_FAILED` | 下载结果失败 | 重试下载 |
| `RETRY_EXCEEDED` | 重试次数超限 | 退款 |

### 10.2 自动重试

- 任务失败自动重试 3 次
- 超时自动标记失败
- 失败自动退款

## 十一、测试

### 11.1 本地测试 API

```javascript
const { runningHubService } = require('./shared/runninghub');

// 测试获取账户信息
const account = await runningHubService.getAccountInfo();
console.log(account);

// 测试创建任务
const task = await runningHubService.createTaskSimple('your_workflow_id');
console.log(task);
```

### 11.2 在线测试

使用 RunningHub 官方调试工具：
https://www.runninghub.cn/runninghub-api-doc-cn/

## 十二、注意事项

1. **文件大小限制**：单文件不超过 30MB
2. **支持格式**：
   - 图片：JPG, PNG, JPEG, WEBP
   - 视频：MP4, AVI, MOV, MKV
   - 音频：MP3, WAV, FLAC
3. **工作流要求**：必须手动运行成功过才能 API 调用
4. **并发限制**：消费级账号每个账号一个并发，需要多账号实现并发
5. **费用**：API 调用消耗 RH 币，与网页运行相同

## 十三、下一步

1. ✅ 配置 RunningHub API Key
2. ✅ 为视频模板添加 workflowId 配置
3. ✅ 测试完整流程
4. ✅ 部署云函数

---

**更新时间**: 2025年12月
**状态**: ✅ RunningHub 对接模块已就绪

