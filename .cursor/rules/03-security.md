# 安全规范

## 前端安全

### Token 存储
```typescript
// ❌ 错误：存储在 localStorage
localStorage.setItem('token', token);

// ✅ 正确：存储在内存中（Zustand store）
const useAuthStore = create((set) => ({
  token: null,
  setToken: (token: string) => set({ token }),
}));

// ✅ 正确：使用 httpOnly Cookie（后端设置）
```

### 输入验证
```typescript
// ✅ 正确：使用 Zod 验证
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const result = loginSchema.safeParse(formData);
if (!result.success) {
  // 处理验证错误
}
```

### XSS 防护
- React 默认转义，但要注意 `dangerouslySetInnerHTML`
- 用户输入必须转义

## API 安全

### 请求拦截器
```typescript
// ✅ 正确：在请求拦截器中添加 Token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 支付安全

### 金额验证
```typescript
// ❌ 错误：前端计算价格
const createOrder = async (videoId: string, price: number) => {
  await api.post('/orders', { videoId, price });
};

// ✅ 正确：后端计算价格
const createOrder = async (videoId: string) => {
  const response = await api.post('/orders', { videoId });
  // 返回的订单包含后端计算的价格
  return response.data;
};
```

