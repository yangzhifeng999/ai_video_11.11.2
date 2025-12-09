# TypeScript 严格规范

## 类型定义

### 接口命名
- 接口必须以 `I` 开头：`IUser`, `IVideo`, `IOrder`
- 类型别名使用 PascalCase：`VideoCategory`, `OrderStatus`

### 禁止使用 any
```typescript
// ❌ 错误
function processData(data: any) {
  return data.value;
}

// ✅ 正确
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}
```

### 函数类型注解
```typescript
// ✅ 正确：所有参数和返回值都有类型
function calculateTotal(items: IOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ 正确：使用箭头函数
const formatPrice = (amount: number): string => {
  return `¥${(amount / 100).toFixed(2)}`;
};
```

### 组件 Props 类型
```typescript
// ✅ 正确
interface VideoCardProps {
  video: IVideo;
  onPlay?: (videoId: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay }) => {
  // ...
};
```

## 类型守卫

### 类型检查
```typescript
// ✅ 使用类型守卫
function isVideo(item: unknown): item is IVideo {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'title' in item &&
    'videoUrl' in item
  );
}
```

## 泛型使用

```typescript
// ✅ 正确使用泛型
function fetchData<T>(url: string): Promise<T> {
  return fetch(url).then(res => res.json());
}

// 使用
const videos = await fetchData<IVideo[]>('/api/videos');
```

