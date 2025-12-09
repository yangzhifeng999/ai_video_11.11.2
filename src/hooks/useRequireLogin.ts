import { useCallback } from 'react';
import { useUserStore } from '@/store/userStore';

/**
 * 登录检查 Hook
 * 返回一个函数，未登录时弹出登录弹窗
 */
export const useRequireLogin = () => {
  const { isAuthenticated, setLoginModalVisible, setLoginCallback } = useUserStore();
  
  /**
   * 要求登录
   * @param onSuccess 登录成功后的回调函数
   * @returns 是否已登录
   */
  const requireLogin = useCallback((onSuccess?: () => void) => {
    if (!isAuthenticated) {
      // 设置登录成功后的回调
      if (onSuccess) {
        setLoginCallback(onSuccess);
      }
      // 显示登录弹窗
      setLoginModalVisible(true);
      return false;
    }
    // 已登录，直接执行回调
    if (onSuccess) {
      onSuccess();
    }
    return true;
  }, [isAuthenticated, setLoginModalVisible, setLoginCallback]);
  
  return { requireLogin, isAuthenticated };
};

