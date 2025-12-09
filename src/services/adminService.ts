import axios from 'axios';
import { API_ENDPOINTS } from '@/constants/api';

import type { 
  AdminAuthResponse, 
  UserListResponse, 
  UserListItem, 
  DashboardStats, 
  VideoListResponse, 
  VideoItem, 
  VideoUploadData,
  ReviewListResponse,
  ReviewItem,
  ReviewStats,
  ReviewStatus,
} from '@/types/admin';

// 创建管理后台专用的 axios 实例
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    },
});

// 请求拦截器：添加 admin_token
adminApi.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理错误
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token 过期或无权限，清除 token 并跳转登录
      localStorage.removeItem('admin_token');
      if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  // ==================== 认证 ====================
  
  /**
   * 管理员登录
   */
  login: async (username: string, password: string): Promise<AdminAuthResponse> => {
    const response = await adminApi.post<{ code: number; message: string; data: AdminAuthResponse }>(
      API_ENDPOINTS.ADMIN_LOGIN,
      { username, password }
    );
    const result = response.data.data || response.data as unknown as AdminAuthResponse;
    if (result.token) {
      localStorage.setItem('admin_token', result.token);
    }
    return result;
  },

  /**
   * 获取仪表盘数据
   */
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await adminApi.get<{ code: number; message: string; data: DashboardStats }>(
      API_ENDPOINTS.ADMIN_DASHBOARD
    );
    return response.data.data || response.data as unknown as DashboardStats;
  },

  // ==================== 用户管理 ====================

  /**
   * 获取用户列表
   */
  getUserList: async (params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: 'active' | 'disabled';
  } = {}): Promise<UserListResponse> => {
    const response = await adminApi.get<{ code: number; message: string; data: UserListResponse }>(
      API_ENDPOINTS.ADMIN_USERS,
      { params }
    );
    return response.data.data || response.data as unknown as UserListResponse;
  },

  /**
   * 获取用户详情
   */
  getUserDetail: async (id: string): Promise<UserListItem> => {
    const response = await adminApi.get<{ code: number; message: string; data: UserListItem }>(
      API_ENDPOINTS.ADMIN_USER_DETAIL(id)
    );
    return response.data.data || response.data as unknown as UserListItem;
  },

  /**
   * 更新用户信息
   */
  updateUser: async (id: string, data: Partial<UserListItem>): Promise<UserListItem> => {
    const response = await adminApi.put<{ code: number; message: string; data: UserListItem }>(
      API_ENDPOINTS.ADMIN_USER_UPDATE(id),
      data
    );
    return response.data.data || response.data as unknown as UserListItem;
  },

  /**
   * 封禁/解封用户
   */
  banUser: async (id: string, reason?: string): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_USER_BAN(id), { reason });
  },

  // ==================== 视频审核 ====================

  /**
   * 获取审核列表
   */
  getReviewList: async (params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    reviewStatus?: string;
    category?: string;
    contentType?: 'video' | 'text';
  } = {}): Promise<ReviewListResponse> => {
    const response = await adminApi.get<{ code: number; message: string; data: ReviewListResponse }>(
      API_ENDPOINTS.ADMIN_REVIEW,
      { params }
    );
    return response.data.data || response.data as unknown as ReviewListResponse;
  },

  /**
   * 获取审核详情
   */
  getReviewDetail: async (id: string): Promise<ReviewItem> => {
    const response = await adminApi.get<{ code: number; message: string; data: ReviewItem }>(
      API_ENDPOINTS.ADMIN_REVIEW_DETAIL(id)
    );
    return response.data.data || response.data as unknown as ReviewItem;
  },

  /**
   * 初审操作
   */
  initialReview: async (id: string, passed: boolean, rejectReason?: string, note?: string): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_REVIEW_INITIAL(id), { passed, rejectReason, note });
  },

  /**
   * 报价操作
   */
  quote: async (id: string, price: number, estimatedDays?: number, quoteNote?: string): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_REVIEW_QUOTE(id), { price, estimatedDays, quoteNote });
  },

  /**
   * 开始制作（用户付款后）
   */
  startProduction: async (id: string): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_REVIEW_START_PRODUCTION(id), {});
  },

  /**
   * 交付订单（上传成品视频）
   */
  delivery: async (id: string, resultVideoUrl: string, deliveryNote?: string): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_REVIEW_DELIVERY(id), { resultVideoUrl, deliveryNote });
  },

  /**
   * 合并视频并上架（调用 RunningHub）
   */
  mergeAndPublish: async (id: string, price?: number, category?: string): Promise<{ videoId: string; finalVideoUrl: string }> => {
    const response = await adminApi.post<{ code: number; message: string; data: any }>(
      API_ENDPOINTS.ADMIN_REVIEW_MERGE_PUBLISH(id),
      { price, category }
    );
    return response.data.data || response.data;
  },

  /**
   * 本地上传视频并上架
   */
  uploadAndPublish: async (id: string, finalVideoUrl: string, price?: number, category?: string): Promise<{ videoId: string; finalVideoUrl: string }> => {
    const response = await adminApi.post<{ code: number; message: string; data: any }>(
      API_ENDPOINTS.ADMIN_REVIEW_UPLOAD_PUBLISH(id),
      { finalVideoUrl, price, category }
    );
    return response.data.data || response.data;
  },

  /**
   * 制作完成
   */
  productionComplete: async (id: string, resultVideoUrl: string, productionNote?: string): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_REVIEW_PRODUCTION_COMPLETE(id), { resultVideoUrl, productionNote });
  },

  /**
   * 修改完成
   */
  modificationComplete: async (id: string, resultVideoUrl: string, modificationNote?: string): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_REVIEW_MODIFICATION_COMPLETE(id), { resultVideoUrl, modificationNote });
  },

  /**
   * 终审上架
   */
  publish: async (id: string, category?: string, isHomeRecommended?: boolean, sortOrder?: number): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_REVIEW_PUBLISH(id), { category, isHomeRecommended, sortOrder });
  },

  /**
   * 发送消息
   */
  sendReviewMessage: async (id: string, content: string): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_REVIEW_MESSAGE(id), { content });
  },

  /**
   * 获取审核日志
   */
  getReviewLogs: async (id: string): Promise<any[]> => {
    const response = await adminApi.get<{ code: number; message: string; data: any[] }>(
      API_ENDPOINTS.ADMIN_REVIEW_LOGS(id)
    );
    return response.data.data || [];
  },

  /**
   * 同步视频状态（修复数据不一致）
   */
  syncVideoStatus: async (): Promise<{ syncedCount: number; details: any[] }> => {
    const response = await adminApi.post<{ code: number; message: string; data: any }>(
      '/admin/sync-video-status'
    );
    return response.data.data || { syncedCount: 0, details: [] };
  },

  /**
   * 清理测试数据（删除无效视频和消息）
   */
  clearTestData: async (): Promise<{ deletedVideosCount: number; deletedMessagesCount: number }> => {
    const response = await adminApi.post<{ code: number; message: string; data: any }>(
      '/admin/clear-test-data'
    );
    return response.data.data || { deletedVideosCount: 0, deletedMessagesCount: 0 };
  },

  /**
   * 删除指定标题的视频
   */
  deleteVideosByTitle: async (titles: string[]): Promise<{ deletedCount: number }> => {
    const response = await adminApi.post<{ code: number; message: string; data: any }>(
      '/admin/delete-videos',
      { titles }
    );
    return response.data.data || { deletedCount: 0 };
  },

  /**
   * 上传视频到COS（管理后台专用）
   */
  uploadVideoToCOS: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string> => {
    // 1. 获取上传签名
    const signResponse = await adminApi.post<{ code: number; message: string; data: { url: string; key: string } }>(
      '/upload/cos-sign',
      {
        fileName: file.name,
        contentType: file.type || 'video/mp4',
        category: 'merged-videos',
      }
    );
    
    const signResult = signResponse.data.data;
    if (!signResult || !signResult.url) {
      throw new Error('获取上传签名失败');
    }

    // 2. 使用预签名URL直接上传
    await axios.put(signResult.url, file, {
      headers: {
        'Content-Type': file.type || 'video/mp4',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    // 3. 返回文件URL
    const fileUrl = signResult.url.split('?')[0];
    return fileUrl;
  },

  /**
   * 获取审核统计
   */
  getReviewStats: async (): Promise<ReviewStats> => {
    const response = await adminApi.get<{ code: number; message: string; data: ReviewStats }>(
      API_ENDPOINTS.ADMIN_REVIEW_STATS
    );
    return response.data.data || response.data as unknown as ReviewStats;
  },

  // ==================== 视频管理（运营） ====================

  /**
   * 获取视频列表
   */
  getVideoList: async (params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
    category?: string;
    isHomeRecommended?: boolean | string;
  } = {}): Promise<VideoListResponse> => {
    const response = await adminApi.get<{ code: number; message: string; data: VideoListResponse }>(
      API_ENDPOINTS.ADMIN_VIDEOS,
      { params }
    );
    return response.data.data || response.data as unknown as VideoListResponse;
  },

  /**
   * 获取视频详情
   */
  getVideoDetail: async (id: string): Promise<VideoItem> => {
    const response = await adminApi.get<{ code: number; message: string; data: VideoItem }>(
      API_ENDPOINTS.ADMIN_VIDEO_DETAIL(id)
    );
    return response.data.data || response.data as unknown as VideoItem;
  },

  /**
   * 更新视频信息
   */
  updateVideo: async (id: string, data: Partial<VideoItem>): Promise<VideoItem> => {
    const response = await adminApi.put<{ code: number; message: string; data: VideoItem }>(
      API_ENDPOINTS.ADMIN_VIDEO_UPDATE(id),
      data
    );
    return response.data.data || response.data as unknown as VideoItem;
  },

  /**
   * 删除视频
   */
  deleteVideo: async (id: string): Promise<void> => {
    await adminApi.delete(API_ENDPOINTS.ADMIN_VIDEO_DELETE(id));
  },

  /**
   * 批量操作
   */
  batchOperation: async (action: string, videoIds: string[], data?: any): Promise<{ updatedCount: number }> => {
    const response = await adminApi.post<{ code: number; message: string; data: { updatedCount: number } }>(
      API_ENDPOINTS.ADMIN_VIDEO_BATCH,
      { action, videoIds, data }
    );
    return response.data.data || { updatedCount: 0 };
  },

  /**
   * 设置首页推荐
   */
  setRecommend: async (id: string, isHomeRecommended: boolean, sortOrder?: number): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_VIDEO_RECOMMEND(id), { isHomeRecommended, sortOrder });
  },

  /**
   * 设置视频状态（上架/下架）
   */
  setVideoStatus: async (id: string, status: 'published' | 'offline'): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_VIDEO_STATUS(id), { status });
  },

  /**
   * 审核视频（兼容旧接口）
   */
  reviewVideo: async (id: string, status: 'approved' | 'rejected', rejectReason?: string): Promise<void> => {
    await adminApi.post(API_ENDPOINTS.ADMIN_VIDEO_REVIEW(id), { status, rejectReason });
  },

  /**
   * 上传视频（创建视频记录）
   */
  uploadVideo: async (data: VideoUploadData): Promise<VideoItem> => {
    const response = await adminApi.post<{ code: number; message: string; data: VideoItem }>(
      API_ENDPOINTS.ADMIN_VIDEOS,
      data
    );
    return response.data.data || response.data as unknown as VideoItem;
  },
};
