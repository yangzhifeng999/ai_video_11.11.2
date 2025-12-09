import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IUser } from '@/types';
import { userService } from '@/services/userService';

interface UserState {
  user: IUser | null;
  isAuthenticated: boolean;
  loginModalVisible: boolean;
  loginCallback: (() => void) | null;
  
  setUser: (user: IUser | null) => void;
  setLoginModalVisible: (visible: boolean) => void;
  setLoginCallback: (callback: (() => void) | null) => void;
  
  login: (phoneOrEmail: string, password: string) => Promise<void>;
  loginWithWechat: () => Promise<void>;
  handleWechatCallback: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearAuth: () => void; // 清除所有登录状态（用于开发测试）
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loginModalVisible: false,
      loginCallback: null,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setLoginModalVisible: (visible) => {
        set({ loginModalVisible: visible });
      },

      setLoginCallback: (callback) => {
        set({ loginCallback: callback });
      },

      login: async (phoneOrEmail: string, password: string) => {
        const data = phoneOrEmail.includes('@')
          ? { email: phoneOrEmail, password }
          : { phone: phoneOrEmail, password };
        
        const response = await userService.login(data);
        
        // 检查今天是否已登录过，如果没有则增加100积分
        const lastLoginDate = localStorage.getItem('lastLoginDate');
        const today = new Date().toDateString();
        let updatedUser = response.user;
        
        if (lastLoginDate !== today) {
          updatedUser = {
            ...response.user,
            points: (response.user.points || 0) + 100,
          };
          localStorage.setItem('lastLoginDate', today);
        }
        
        // 保存用户信息（包括头像）到 store 和 localStorage
        set({ user: updatedUser, isAuthenticated: true });
      },

      loginWithWechat: async () => {
        try {
          // 开发环境：使用 Mock 登录
          if (import.meta.env.DEV) {
            // 模拟登录延迟
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 检查今天是否已登录过，如果没有则增加100积分
            const lastLoginDate = localStorage.getItem('lastLoginDate');
            const today = new Date().toDateString();
            let initialPoints = 1000;
            
            if (lastLoginDate !== today) {
              // 今天首次登录，增加100积分
              initialPoints = 1100;
              localStorage.setItem('lastLoginDate', today);
            }
            
            // 创建模拟用户数据
            const mockUser: IUser = {
              id: 'mock_user_001',
              nickname: '测试用户',
              avatar: 'https://via.placeholder.com/100',
              phone: '138****8888',
              email: 'test@example.com',
              gender: 'secret',
              bio: '这是一个测试账号',
              points: initialPoints,
              balance: 0,
              totalEarnings: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            // 模拟 token
            localStorage.setItem('token', 'mock_token_' + Date.now());
            
            // 更新状态
            set({ 
              user: mockUser, 
              isAuthenticated: true,
              loginModalVisible: false 
            });
            
            // 执行登录成功回调
            const { loginCallback } = get();
            if (loginCallback) {
              loginCallback();
              set({ loginCallback: null });
            }
            
            console.log('✅ 开发模式：Mock 登录成功', mockUser);
            return;
          }
          
          // 生产环境：使用真实微信登录
          // 检查是否在微信浏览器中
          const isWechat = userService.isWechatBrowser();
          
          if (isWechat) {
            // 微信内浏览器：使用 JS-SDK
            // TODO: 实现微信 JS-SDK 登录逻辑
            // 这里需要后端提供 JS-SDK 配置
            console.log('微信内浏览器登录（需要后端配置 JS-SDK）');
          } else {
            // 普通浏览器：跳转到微信授权页面
            const redirectUri = encodeURIComponent(
              `${window.location.origin}${window.location.pathname}?wechat_callback=1`
            );
            const { url } = await userService.getWechatAuthUrl(redirectUri);
            window.location.href = url;
          }
        } catch (error) {
          console.error('微信登录失败:', error);
          throw error;
        }
      },

      // 处理微信登录回调（从 URL 参数获取 code）
      handleWechatCallback: async (code: string) => {
        try {
          const response = await userService.loginWithWechat(code);
          
          // 检查今天是否已登录过，如果没有则增加100积分
          const lastLoginDate = localStorage.getItem('lastLoginDate');
          const today = new Date().toDateString();
          let updatedUser = response.user;
          
          if (lastLoginDate !== today) {
            updatedUser = {
              ...response.user,
              points: (response.user.points || 0) + 100,
            };
            localStorage.setItem('lastLoginDate', today);
          }
          
          set({ 
            user: updatedUser, 
            isAuthenticated: true,
            loginModalVisible: false 
          });
          
          // 执行登录成功回调
          const { loginCallback } = get();
          if (loginCallback) {
            loginCallback();
            set({ loginCallback: null });
          }
          
          // 清除 URL 中的 code 参数
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('wechat_callback');
          window.history.replaceState({}, '', url.toString());
        } catch (error) {
          console.error('微信登录回调处理失败:', error);
          throw error;
        }
      },

      logout: async () => {
        await userService.logout();
        set({ user: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        try {
          const profile = await userService.getProfile();
          // 更新用户信息（包括头像）
          set({ user: profile, isAuthenticated: true });
        } catch (error) {
          console.error('获取用户信息失败:', error);
          set({ user: null, isAuthenticated: false });
        }
      },

      // 清除所有登录状态（用于开发测试）
      clearAuth: () => {
        // 清除 localStorage 中的用户数据
        localStorage.removeItem('user-storage');
        localStorage.removeItem('token');
        // 重置状态
        set({ 
          user: null, 
          isAuthenticated: false,
          loginModalVisible: false,
          loginCallback: null 
        });
        console.log('✅ 已清除所有登录状态');
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

