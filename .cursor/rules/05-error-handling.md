# 错误处理规范

## API 错误处理

### 统一错误处理
```typescript
// ✅ 正确：使用统一的错误处理
import { Toast } from 'antd-mobile';

export const handleApiError = (error: unknown) => {
  if (error instanceof Error) {
    Toast.show({ content: error.message });
  } else {
    Toast.show({ content: '操作失败，请稍后重试' });
  }
};
```

### 错误边界
```typescript
// ✅ 正确：使用 ErrorBoundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## 用户友好的错误提示

### 错误消息
- 清晰易懂
- 提供解决方案
- 不要直接展示技术错误

```typescript
// ✅ 正确：用户友好的错误消息
try {
  await uploadVideo(file);
} catch (error) {
  if (error.response?.status === 413) {
    Toast.show({ content: '文件过大，请选择小于 100MB 的视频' });
  } else {
    Toast.show({ content: '上传失败，请检查网络后重试' });
  }
}
```

