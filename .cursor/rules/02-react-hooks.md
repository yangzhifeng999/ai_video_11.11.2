# React Hooks 规范

## useState

### 基本用法
```typescript
// ✅ 正确：明确类型
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<IUser | null>(null);
```

## useEffect

### 依赖项数组
```typescript
// ❌ 错误：缺少依赖
useEffect(() => {
  fetchData(userId);
}, []);

// ✅ 正确：包含所有依赖
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ 正确：使用 useCallback 避免重复创建函数
const fetchData = useCallback(async (id: string) => {
  // ...
}, []);

useEffect(() => {
  fetchData(userId);
}, [userId, fetchData]);
```

### 清理函数
```typescript
// ✅ 正确：提供清理函数
useEffect(() => {
  const timer = setInterval(() => {
    // ...
  }, 1000);

  return () => {
    clearInterval(timer);
  };
}, []);
```

## useCallback

### 避免重复创建函数
```typescript
// ❌ 错误：每次渲染都创建新函数
const handleClick = () => {
  onClick(id);
};

// ✅ 正确：使用 useCallback
const handleClick = useCallback(() => {
  onClick(id);
}, [id, onClick]);
```

## useMemo

### 缓存计算结果
```typescript
// ✅ 正确：缓存计算结果
const filteredVideos = useMemo(() => {
  return videos.filter(v => v.category === activeCategory);
}, [videos, activeCategory]);
```

## 自定义 Hooks

### 命名规范
- 必须以 `use` 开头：`useAuth`, `useVideo`, `useOrder`

### 返回值类型
```typescript
// ✅ 正确：明确返回类型
export const useVideo = (videoId: string): {
  video: IVideo | null;
  loading: boolean;
  error: Error | null;
} => {
  // ...
};
```

