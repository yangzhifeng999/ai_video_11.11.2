# 嘿哈 (HeiHa) - AI视频交易平台

<div align="center">

![嘿哈 Logo](./public/logo-v3.svg)

**基于腾讯云服务的AI视频交易平台**

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF.svg)](https://vitejs.dev/)
[![Ant Design Mobile](https://img.shields.io/badge/Ant%20Design%20Mobile-5.34.0-1677FF.svg)](https://mobile.ant.design/)

</div>

## 📱 项目简介

**嘿哈**是一个AI视频交易平台，支持创作者上传视频/文案内容，用户付费购买并使用AI技术制作同款视频。平台采用现代化的移动端优先设计，提供流畅的用户体验。

### 核心功能

- 🎬 **视频浏览与购买** - 沉浸式视频流，支持上下滑动切换（类似抖音）
- 🎨 **AI换脸制作** - 上传自拍照片，AI自动生成个性化视频
- 📝 **文案创作** - 支持文案投稿和AI生成
- 💰 **收益管理** - 创作者收益统计、提现功能
- 📊 **作品管理** - 作品上传、审核、上架/下架
- 💬 **社交互动** - 评论、点赞、收藏、关注
- 🎁 **积分系统** - 每日登录奖励、积分兑换

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
# API 配置
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_DATA=true

# 腾讯云配置（生产环境）
VITE_COS_SECRET_ID=your_cos_secret_id
VITE_COS_SECRET_KEY=your_cos_secret_key
VITE_COS_BUCKET=your_bucket_name
VITE_COS_REGION=ap-guangzhou

# 腾讯云 VOD 配置
VITE_VOD_SECRET_ID=your_vod_secret_id
VITE_VOD_SECRET_KEY=your_vod_secret_key
```

### 启动开发服务器

```bash
# 方式1: 使用 npm 命令
npm run dev

# 方式2: 使用启动脚本（Windows）
npm start
```

项目将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

## 📁 项目结构

```
src/
├── components/          # 通用组件
│   ├── BottomTabBar/   # 底部导航栏
│   ├── VideoCard/      # 视频卡片
│   ├── VideoPlayer/    # 视频播放器
│   ├── Loading/        # 加载组件
│   ├── Empty/          # 空状态组件
│   ├── LoginModal/     # 登录弹窗
│   └── NavBar/         # 导航栏
├── pages/              # 页面组件
│   ├── Home/           # 首页（视频流）
│   ├── VideoDetail/    # 视频详情（抖音式）
│   ├── MakeVideo/      # 制作同款
│   ├── Purchased/      # 已购订单
│   ├── Profile/        # 个人中心
│   ├── MyWorks/        # 我的作品
│   ├── Earnings/       # 收益管理
│   ├── Points/         # 积分中心
│   ├── Messages/       # 消息中心
│   ├── Settings/       # 设置
│   └── ...             # 其他页面
├── hooks/              # 自定义 Hooks
│   ├── useAuth.ts      # 认证相关
│   ├── useVideo.ts     # 视频相关
│   └── useRequireLogin.ts  # 登录守卫
├── services/           # API 服务层
│   ├── api.ts          # Axios 实例
│   ├── userService.ts  # 用户服务
│   ├── videoService.ts # 视频服务
│   ├── orderService.ts # 订单服务
│   └── earningService.ts  # 收益服务
├── store/              # 状态管理（Zustand）
│   └── userStore.ts    # 用户状态
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
├── constants/          # 常量定义
└── styles/             # 全局样式
```

## 🛠️ 技术栈

### 核心框架

- **React 18** - UI 框架
- **TypeScript** - 类型系统
- **Vite** - 构建工具

### UI 组件库

- **Ant Design Mobile** - 移动端 UI 组件库
- **React Image Crop** - 图片裁剪

### 状态管理

- **Zustand** - 轻量级状态管理

### 路由

- **React Router v6** - 路由管理

### HTTP 客户端

- **Axios** - HTTP 请求库

### 表单处理

- **React Hook Form** - 表单管理
- **Zod** - 表单验证

### 其他

- **DPlayer** - 视频播放器（备用）

## 📱 主要页面

### 首页 (`/`)
- 沉浸式视频流设计
- 分类筛选（综合、母婴、服装、百货）
- 实时搜索功能
- 底部导航栏

### 视频详情页 (`/video/:id`)
- 全屏沉浸式播放
- 上下滑动切换视频（抖音式）
- 评论弹窗
- 点赞、收藏、分享
- 制作同款入口

### 制作同款 (`/make-video/:id`)
- 自拍照片上传（支持调用相机拍照）
- 支付功能（微信/支付宝/余额）
- 订单创建

### 个人中心 (`/profile`)
- 用户信息展示
- 作品统计
- 收益概览
- 快捷入口

### 我的作品 (`/my-works`)
- 作品列表（视频/文案）
- 状态筛选（全部/审核中/已上架/已下架）
- 作品编辑、删除、上架/下架

### 收益管理 (`/earnings`)
- 收益统计
- 收益明细
- 提现功能

## 🔧 开发工具

### 代码质量

```bash
# TypeScript 类型检查
npm run type-check

# ESLint 代码检查
npm run lint
```

### 自动保存功能

项目支持代码自动保存到 Git：

```bash
# 启动实时保存服务
npm run realtime-save

# 回退到之前的版本（1-5步）
npm run rollback
```

详细说明请查看 [实时保存功能指南](./docs/REALTIME-SAVE-GUIDE.md)

## 🌐 浏览器支持

- ✅ Chrome (推荐)
- ✅ Safari
- ✅ Firefox
- ✅ Edge
- ✅ 移动端浏览器（iOS Safari, Chrome Mobile）

## 📱 移动端适配

项目已完整适配移动端，包括：

- ✅ 响应式布局
- ✅ 安卓系统导航栏适配（虚拟导航栏/手势导航）
- ✅ iOS 安全区域适配（刘海屏）
- ✅ 触摸优化
- ✅ 移动端性能优化

详细说明请查看 [安卓安全区域适配文档](./ANDROID_SAFE_AREA_ADAPTATION.md)

## 🔌 API 集成

### Mock 模式

开发环境默认使用 Mock 数据，无需后端即可运行：

```env
VITE_USE_MOCK_DATA=true
```

### 生产模式

配置后端 API 地址：

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCK_DATA=false
```

### API 服务层

所有 API 调用通过 `services` 目录下的服务层：

```typescript
import { videoService } from '@/services/videoService';

// 获取视频列表
const videos = await videoService.getVideoList({ category: 'comprehensive' });

// 获取视频详情
const video = await videoService.getVideoDetail('video-id');
```

## 🚢 部署

### 构建生产版本

```bash
npm run build
```

### 部署到静态服务器

构建产物在 `dist` 目录，可以部署到：

- 腾讯云 COS + CDN
- Nginx
- Apache
- 其他静态文件服务器

详细部署说明请查看 [部署文档](./docs/DEPLOYMENT.md)

## 📦 APP 打包

### 使用 Capacitor（推荐）

```bash
# 安装 Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# 初始化
npx cap init "嘿哈" "com.heiha.app"

# 添加平台
npx cap add android
npx cap add ios

# 构建并同步
npm run build
npx cap sync

# 打开开发工具
npx cap open android  # Android Studio
npx cap open ios      # Xcode
```

## 📝 开发规范

详细开发规范请查看 [.cursorrules](./.cursorrules) 文件。

### 代码规范

- 使用 TypeScript 进行类型检查
- 组件使用函数式组件 + Hooks
- 遵循 ESLint 规则
- 使用统一的命名规范

### Git Commit 规范

遵循 Conventional Commits：

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

## 🐛 常见问题

### 1. 安装依赖失败

```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules
npm install
```

### 2. 环境变量不生效

确保：
- `.env` 文件在项目根目录
- 环境变量以 `VITE_` 开头
- 重启开发服务器

### 3. 端口被占用

修改 `vite.config.ts` 中的 `port` 配置。

### 4. 构建失败

```bash
# 检查 TypeScript 错误
npm run type-check

# 检查 ESLint 错误
npm run lint
```

## 🤝 贡献指南

欢迎贡献代码！请查看 [贡献指南](./CONTRIBUTING.md)

## 📄 许可证

MIT License

## 📞 联系方式

- 项目名称: 嘿哈 (HeiHa)
- 项目描述: AI视频交易平台

---

<div align="center">

**Made with ❤️ using React + TypeScript + Vite**

</div>