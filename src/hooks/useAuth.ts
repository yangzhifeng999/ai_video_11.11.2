import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store';

/**
 * 认证Hook
 * 检查用户是否已登录，未登录则跳转到登录页
 */
export const useAuth = () => {
  const { isAuthenticated, fetchProfile } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      const token = localStorage.getItem('token');
      if (token) {
        // 有token但状态未初始化，尝试获取用户信息
        fetchProfile();
      } else {
        // 无token，跳转登录
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, fetchProfile, navigate]);

  return { isAuthenticated };
};

/**
 * 要求认证的Hook
 * 未登录显示登录弹窗
 * 使用 ref 避免重复执行
 */
export const useRequireAuth = () => {
  const { isAuthenticated, setLoginModalVisible, fetchProfile } = useUserStore();
  const navigate = useNavigate();
  const hasChecked = useRef(false);

  useEffect(() => {
    // 只在首次检查时执行
    if (!hasChecked.current) {
      hasChecked.current = true;
      
      if (!isAuthenticated) {
        // 检查是否有 token
        const token = localStorage.getItem('token');
        if (token) {
          // 有 token 但状态未初始化，尝试获取用户信息
          fetchProfile().catch(() => {
            // 获取失败，显示登录弹窗
            setLoginModalVisible(true);
          });
        } else {
          // 无 token，显示登录弹窗
          setLoginModalVisible(true);
        }
      }
    }
  }, [isAuthenticated, navigate, setLoginModalVisible, fetchProfile]);

  return { isAuthenticated };
};





