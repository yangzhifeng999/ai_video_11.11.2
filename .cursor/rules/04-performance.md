# 性能优化规范

## 代码分割

### 路由级别分割
```typescript
// ✅ 正确：使用 React.lazy
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const VideoDetail = lazy(() => import('./pages/VideoDetail'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video/:id" element={<VideoDetail />} />
      </Routes>
    </Suspense>
  );
}
```

## 组件优化

### useMemo 和 useCallback
```typescript
// ✅ 正确：缓存计算结果
const filteredList = useMemo(() => {
  return items.filter(item => item.category === category);
}, [items, category]);

// ✅ 正确：缓存回调函数
const handleClick = useCallback((id: string) => {
  onClick(id);
}, [onClick]);
```

## 资源优化

### 图片懒加载
```typescript
// ✅ 使用 Ant Design Mobile 的 Image 组件
<Image src={url} lazy />
```

### 视频优化
- 使用 CDN 加速
- 提供多清晰度选项
- 使用 poster 图片

