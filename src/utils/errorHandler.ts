import { Toast } from 'antd-mobile';

/**
 * API错误处理
 * @param error - 错误对象
 * @param defaultMessage - 默认错误消息
 */
export const handleApiError = (error: any, defaultMessage: string = '操作失败，请稍后重试'): void => {
  if (error?.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // 未授权，跳转登录
        Toast.show({ content: '登录已过期，请重新登录' });
        // 这里可以触发登出逻辑
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        break;
      case 403:
        Toast.show({ content: data?.message || '无权限访问' });
        break;
      case 404:
        Toast.show({ content: '资源不存在' });
        break;
      case 422: {
        // 验证错误
        const validationError = data?.message || data?.errors?.[0]?.message || '数据验证失败';
        Toast.show({ content: validationError });
        break;
      }
      case 500:
        Toast.show({ content: '服务器错误，请稍后重试' });
        break;
      default:
        Toast.show({ content: data?.message || defaultMessage });
    }
  } else if (error?.message) {
    // 网络错误或其他错误
    if (error.message.includes('Network Error') || error.message.includes('timeout')) {
      Toast.show({ content: '网络连接失败，请检查网络' });
    } else {
      Toast.show({ content: error.message || defaultMessage });
    }
  } else {
    Toast.show({ content: defaultMessage });
  }
};

/**
 * 获取错误消息
 * @param error - 错误对象
 * @param defaultMessage - 默认错误消息
 * @returns 错误消息字符串
 */
export const getErrorMessage = (error: any, defaultMessage: string = '操作失败'): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
};

