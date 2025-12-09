# 项目特定规范

## 技术栈

### 前端
- React 18+
- TypeScript
- Ant Design Mobile
- Zustand
- React Router v6
- Axios
- React Hook Form + Zod

## 文件组织

```
src/
├── components/          # 通用组件
├── pages/              # 页面组件
├── hooks/              # 自定义Hooks
├── services/           # API服务
├── store/              # 状态管理
├── utils/              # 工具函数
├── types/              # TypeScript类型定义
├── constants/          # 常量定义
└── styles/             # 全局样式
```

## 命名规范

- 组件文件：PascalCase (`VideoCard.tsx`)
- 工具文件：camelCase (`formatDate.ts`)
- 常量文件：UPPER_SNAKE_CASE (`API_CONSTANTS.ts`)
- 接口：以 `I` 开头 (`IUser`, `IVideo`)

## 腾讯云集成

### COS 上传
```typescript
import COS from 'cos-js-sdk-v5';

const cos = new COS({
  SecretId: import.meta.env.VITE_COS_SECRET_ID,
  SecretKey: import.meta.env.VITE_COS_SECRET_KEY,
});
```

### 环境变量
- 使用 `VITE_` 前缀
- 访问：`import.meta.env.VITE_API_BASE_URL`

## 支付集成

### 安全要求
- 金额必须后端验证
- 前端仅展示价格
- 所有支付接口必须有签名验证

