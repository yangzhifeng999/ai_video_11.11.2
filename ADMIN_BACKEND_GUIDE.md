# 管理后台使用指南

## 📋 概述

管理后台已集成在现有项目中，使用 Ant Design（PC端UI框架）构建，支持用户管理等功能。

## 🚀 快速开始

### 1. 访问管理后台

- **登录页面**: `http://localhost:5173/admin/login`（开发环境）
- **默认账号**: `admin`
- **默认密码**: `yang0313`

### 2. 功能模块

#### 登录页面 (`/admin/login`)
- 管理员账号密码登录
- 登录成功后跳转到仪表盘

#### 仪表盘 (`/admin/dashboard`)
- 数据统计概览
  - 总用户数
  - 活跃用户数
  - 今日新增用户
  - 总视频数
  - 总订单数
  - 总收入
- 功能菜单入口

#### 用户管理 (`/admin/users`)
- 用户列表展示
- 搜索功能（手机号、昵称）
- 分页显示
- 查看用户详情
- 用户状态标签（正常/已禁用）
- 角色标签（管理员/创作者/普通用户）

## 📁 项目结构

```
src/
├── pages/
│   └── Admin/                    # 管理后台页面
│       ├── AdminLogin.tsx        # 登录页
│       ├── AdminLogin.css
│       ├── AdminDashboard.tsx    # 仪表盘
│       ├── AdminDashboard.css
│       ├── UserManagement.tsx    # 用户管理
│       ├── UserManagement.css
│       └── index.tsx
├── services/
│   └── adminService.ts           # 管理后台API服务
├── types/
│   └── admin.ts                  # 管理后台类型定义
└── constants/
    ├── routes.ts                 # 路由配置（已添加管理后台路由）
    └── api.ts                    # API端点配置（已添加管理后台API）
```

## 🔧 技术栈

### UI框架
- **Ant Design** - PC端UI组件库
- **React** - 前端框架
- **TypeScript** - 类型系统

### 与用户端的区别
| 特性 | 用户端 | 管理后台 |
|------|--------|----------|
| UI框架 | Ant Design Mobile | Ant Design |
| 设备 | 移动端 | PC端 |
| 布局 | 底部导航栏 | 顶部导航栏 |
| 路由前缀 | `/` | `/admin/*` |
| Token | `token` | `admin_token` |

## 🔐 权限说明

### Token管理
- 用户端 Token: 存储在 `localStorage.token`
- 管理员 Token: 存储在 `localStorage.admin_token`
- 两者互不影响，可同时登录

### API认证
- 管理后台API请求自动携带 `admin_token`
- 未登录或Token过期会跳转到登录页

## 📡 API接口

### 后端API（已存在）
后端云函数 `admin` 已部署，提供以下接口：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/login` | 管理员登录 |
| GET | `/api/admin/dashboard` | 获取仪表盘数据 |
| GET | `/api/admin/users` | 获取用户列表 |
| GET | `/api/admin/users/:id` | 获取用户详情 |
| PUT | `/api/admin/users/:id` | 更新用户信息 |
| POST | `/api/admin/users/:id/ban` | 封禁用户 |

### 前端服务层
所有API调用通过 `src/services/adminService.ts`：

```typescript
import { adminService } from '@/services/adminService';

// 登录
await adminService.login('admin', 'admin123');

// 获取用户列表
const users = await adminService.getUserList({
  page: 1,
  pageSize: 20,
  keyword: '搜索关键词',
});

// 获取用户详情
const user = await adminService.getUserDetail('user-id');

// 更新用户
await adminService.updateUser('user-id', { nickname: '新昵称' });

// 封禁用户
await adminService.banUser('user-id', '封禁原因');
```

## 🎨 界面展示

### 登录页
- 居中卡片式布局
- 用户名和密码输入框
- 登录按钮
- 渐变背景

### 仪表盘
- 顶部导航栏（标题 + 退出登录）
- 数据统计卡片（6个）
- 功能菜单卡片

### 用户管理
- 顶部导航栏（返回首页 + 退出登录）
- 搜索框
- 用户列表表格
  - 用户ID
  - 手机号
  - 昵称
  - 积分
  - 余额
  - 状态
  - 角色
  - 注册时间
  - 操作按钮

## 🔨 开发指南

### 添加新功能

1. **创建新页面**
```typescript
// src/pages/Admin/NewFeature.tsx
import { Layout } from 'antd';

export const NewFeature: React.FC = () => {
  return (
    <Layout>
      {/* 页面内容 */}
    </Layout>
  );
};
```

2. **添加路由**
```typescript
// src/constants/routes.ts
export const ROUTES = {
  // ...
  ADMIN_NEW_FEATURE: '/admin/new-feature',
};

// src/App.tsx
<Route path={ROUTES.ADMIN_NEW_FEATURE} element={<NewFeature />} />
```

3. **添加API端点**
```typescript
// src/constants/api.ts
export const API_ENDPOINTS = {
  // ...
  ADMIN_NEW_FEATURE: '/admin/new-feature',
};

// src/services/adminService.ts
export const adminService = {
  // ...
  getNewFeature: async () => {
    const response = await adminApi.get(API_ENDPOINTS.ADMIN_NEW_FEATURE);
    return response.data;
  },
};
```

### 样式定制

管理后台使用 Ant Design 默认主题，可通过以下方式定制：

```typescript
// src/App.tsx
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

<ConfigProvider
  locale={zhCN}
  theme={{
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
    },
  }}
>
  {/* 管理后台路由 */}
</ConfigProvider>
```

## 🐛 常见问题

### 1. 登录后显示"登录已过期"
- 检查后端 `admin` 云函数是否部署
- 检查 HTTP 触发器路径是否为 `/api/admin`
- 检查环境变量是否配置正确

### 2. 用户列表为空
- 检查数据库 `users` 集合是否有数据
- 检查后端API是否正常返回数据
- 打开浏览器控制台查看网络请求

### 3. 样式显示异常
- 确保已安装 `antd` 依赖
- 检查 CSS 文件是否正确导入
- 清除浏览器缓存

### 4. 路由跳转失败
- 检查 `src/constants/routes.ts` 中的路由配置
- 检查 `src/App.tsx` 中的路由注册
- 确保路由路径正确

## 📝 后续扩展

可以继续添加以下功能：

1. **视频管理**
   - 视频列表
   - 视频审核
   - 视频删除

2. **订单管理**
   - 订单列表
   - 订单详情
   - 退款处理

3. **提现管理**
   - 提现申请列表
   - 审核通过/拒绝

4. **系统配置**
   - 系统参数设置
   - 公告管理

5. **数据统计**
   - 收益统计图表
   - 用户增长趋势
   - 视频热度排行

## 🔗 相关文档

- [Ant Design 官方文档](https://ant.design/)
- [React Router 文档](https://reactrouter.com/)
- [后端API文档](./cloud-functions/README.md)

## 📞 技术支持

如有问题，请查看：
1. 浏览器控制台错误信息
2. 后端云函数日志
3. 网络请求详情

---

**管理后台已完成集成，可以开始使用！** 🎉



