import api from './api';
import { API_ENDPOINTS } from '@/constants/api';
import type { IUser, IUserProfile } from '@/types';

export interface LoginData {
  phone?: string;
  email?: string;
  password: string;
}

export interface RegisterData {
  nickname: string;
  phone?: string;
  email?: string;
  password: string;
  code?: string; // 验证码（可选）
}

export interface AuthResponse {
  token: string;
  user: IUser;
}

export const userService = {
  /**
   * 登录
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<{ code: number; message: string; data: AuthResponse }>(API_ENDPOINTS.AUTH_LOGIN, data);
    const result = response.data.data || response.data as unknown as AuthResponse;
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    return result;
  },

  /**
   * 注册
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<{ code: number; message: string; data: AuthResponse }>(API_ENDPOINTS.AUTH_REGISTER, data);
    const result = response.data.data || response.data as unknown as AuthResponse;
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    return result;
  },

  /**
   * 登出
   */
  logout: async (): Promise<void> => {
    // 先清除本地 token，确保退出成功
    localStorage.removeItem('token');
    try {
      // 尝试调用后端 API（可选，失败也不影响退出）
      await api.post(API_ENDPOINTS.AUTH_LOGOUT);
    } catch (error) {
      // 后端 API 调用失败不影响本地退出
      console.log('后端登出API调用失败，已在本地完成退出');
    }
  },

  /**
   * 获取用户信息
   */
  getProfile: async (): Promise<IUserProfile> => {
    const response = await api.get<{ code: number; message: string; data: IUserProfile }>(API_ENDPOINTS.USER_PROFILE);
    return response.data.data || response.data as unknown as IUserProfile;
  },

  /**
   * 更新用户信息
   */
  updateProfile: async (data: Partial<IUser>): Promise<IUser> => {
    const response = await api.put<{ code: number; message: string; data: IUser }>(API_ENDPOINTS.USER_UPDATE_PROFILE, data);
    return response.data.data || response.data as unknown as IUser;
  },

  /**
   * 上传头像到COS
   */
  uploadAvatar: async (file: Blob, _onProgress?: (percent: number) => void): Promise<string> => {
    // 1. 获取COS上传签名
    const fileName = `avatar_${Date.now()}.png`;
    const response = await api.post<{ code: number; message: string; data: { url: string; key: string; bucket: string; region: string } }>(
      API_ENDPOINTS.UPLOAD_COS_SIGN,
      { 
        fileName, 
        contentType: 'image/png',
        category: 'avatars'  // 头像单独分类
      }
    );
    
    const signResult = response.data.data || response.data;
    console.log('COS签名结果:', signResult);

    // 2. 使用 fetch 上传到COS（设置公共读权限）
    // 注意：axios 可能不会正确传递某些 header，改用 fetch
    const uploadResponse = await fetch(signResult.url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': 'image/png',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('头像上传失败: ' + uploadResponse.status);
    }

    // 3. 返回COS文件URL（去掉签名参数，使用公共访问URL）
    const baseUrl = signResult.url.split('?')[0];
    
    // 检查图片是否可访问
    console.log('头像URL:', baseUrl);
    
    return baseUrl;
  },

  /**
   * 获取积分明细
   */
  getPoints: async (): Promise<{ total: number; list: any[] }> => {
    const response = await api.get<{ code: number; message: string; data: { total: number; list: any[] } }>(API_ENDPOINTS.USER_POINTS);
    return response.data.data || response.data as unknown as { total: number; list: any[] };
  },

  /**
   * 获取微信授权URL
   */
  getWechatAuthUrl: async (redirectUri: string): Promise<{ url: string }> => {
    const response = await api.get<{ code: number; message: string; data: { url: string } }>(API_ENDPOINTS.AUTH_WECHAT_URL, {
      params: { redirect_uri: redirectUri }
    });
    return response.data.data || response.data as unknown as { url: string };
  },

  /**
   * 微信登录（处理授权码）
   */
  loginWithWechat: async (code: string): Promise<AuthResponse> => {
    const response = await api.post<{ code: number; message: string; data: AuthResponse }>(API_ENDPOINTS.AUTH_LOGIN_WECHAT, { code });
    const result = response.data.data || response.data as unknown as AuthResponse;
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    return result;
  },

  /**
   * 检查是否在微信浏览器中
   */
  isWechatBrowser: (): boolean => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('micromessenger');
  },
};





