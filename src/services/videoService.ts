import api from './api';
import { API_ENDPOINTS, USE_MOCK_DATA } from '@/constants/api';
import type { IVideo, IVideoUploadData, VideoCategory } from '@/types';
import { mockVideos } from '@/utils/mockData';

export interface VideoListParams {
  category?: VideoCategory;
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface VideoListResponse {
  list: IVideo[];
  total: number;
  page: number;
  pageSize: number;
}

export const videoService = {
  /**
   * 获取视频列表
   */
  getVideoList: async (params: VideoListParams = {}): Promise<VideoListResponse> => {
    // 如果使用Mock数据，直接返回Mock数据
    if (USE_MOCK_DATA) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 根据分类过滤
      let filteredVideos = mockVideos;
      if (params.category && params.category !== 'comprehensive') {
        filteredVideos = mockVideos.filter(v => v.category === params.category);
      }
      
      // 根据关键词过滤
      if (params.keyword) {
        filteredVideos = filteredVideos.filter(v => 
          v.title.includes(params.keyword!) || v.description?.includes(params.keyword!)
        );
      }
      
      return {
        list: filteredVideos,
        total: filteredVideos.length,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
      };
    }
    
    const response = await api.get<{ code: number; message: string; data: VideoListResponse }>(API_ENDPOINTS.VIDEOS, { params });
    // 后端返回格式: { code, message, data: { list, total, page, pageSize } }
    if (response.data && response.data.data) {
      return response.data.data;
    }
    // 兼容旧格式
    return response.data as unknown as VideoListResponse;
  },

  /**
   * 获取视频详情
   */
  getVideoDetail: async (id: string): Promise<IVideo> => {
    // 如果使用Mock数据，直接返回Mock数据
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const video = mockVideos.find(v => v.id === id);
      if (!video) {
        throw new Error('视频不存在');
      }
      return video;
    }
    
    const response = await api.get<{ code: number; message: string; data: IVideo }>(API_ENDPOINTS.VIDEO_DETAIL(id));
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as unknown as IVideo;
  },

  /**
   * 上传视频
   */
  uploadVideo: async (data: IVideoUploadData, onProgress?: (percent: number) => void): Promise<IVideo> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    formData.append('category', data.category);
    formData.append('price', String(data.price));
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await api.post<IVideo>(API_ENDPOINTS.VIDEO_UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  /**
   * 点赞视频
   */
  likeVideo: async (id: string): Promise<void> => {
    await api.post(API_ENDPOINTS.VIDEO_LIKE(id));
  },

  /**
   * 踩视频（不喜欢）
   */
  dislikeVideo: async (id: string): Promise<void> => {
    await api.post(API_ENDPOINTS.VIDEO_DISLIKE(id));
  },

  /**
   * 收藏视频
   */
  collectVideo: async (id: string): Promise<void> => {
    await api.post(API_ENDPOINTS.VIDEO_COLLECT(id));
  },

  /**
   * 获取COS上传签名
   */
  getCOSSign: async (fileName: string, contentType: string, category: string = 'videos'): Promise<{
    url: string;
    key: string;
    bucket?: string;
    region?: string;
  }> => {
    const response = await api.post<{ code: number; message: string; data: any }>(
      API_ENDPOINTS.UPLOAD_COS_SIGN,
      { fileName, contentType, category }
    );
    return response.data.data || response.data;
  },

  /**
   * 上传文件到COS（使用预签名URL）
   */
  uploadFileToCOS: async (
    file: File, 
    onProgress?: (percent: number) => void
  ): Promise<string> => {
    // 1. 获取签名
    const signResult = await videoService.getCOSSign(
      file.name, 
      file.type || 'video/mp4',
      'videos'
    );

    // 2. 使用预签名URL直接上传（预签名URL已包含认证信息）
    await api.put(signResult.url, file, {
      headers: {
        'Content-Type': file.type || 'video/mp4',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
      // 预签名URL上传不需要使用baseURL
      baseURL: '',
    });

    // 3. 返回文件URL（去除签名参数，构建永久访问URL）
    const fileUrl = signResult.url.split('?')[0];
    return fileUrl;
  },

  /**
   * 创建视频作品（提交审核）
   */
  createVideoWork: async (data: {
    title: string;
    description?: string;
    category: string;
    price: number;
    videoUrl: string;
    coverUrl?: string;
    comparisonVideoUrl?: string;
  }): Promise<{ videoId: string; status: string; message: string }> => {
    const response = await api.post<{ code: number; message: string; data: any }>(
      API_ENDPOINTS.UPLOAD_CREATE_VIDEO,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * 提交视频审核（完整流程：上传+创建记录）
   */
  submitVideoForReview: async (
    data: {
      creativeVideoFile: File;
      adVideoFile?: File;
      title: string;
      description?: string;
      category: string;
      price: number;
    },
    onProgress?: (step: string, percent: number) => void
  ): Promise<{ videoId: string; status: string; message: string }> => {
    try {
      // 1. 上传创意视频
      onProgress?.('uploading_creative', 0);
      const creativeVideoUrl = await videoService.uploadFileToCOS(
        data.creativeVideoFile,
        (percent) => onProgress?.('uploading_creative', percent)
      );

      // 2. 上传广告视频（如果有）
      let adVideoUrl = '';
      if (data.adVideoFile) {
        onProgress?.('uploading_ad', 0);
        adVideoUrl = await videoService.uploadFileToCOS(
          data.adVideoFile,
          (percent) => onProgress?.('uploading_ad', percent)
        );
      }

      // 3. 创建视频记录
      onProgress?.('creating', 100);
      const result = await videoService.createVideoWork({
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        videoUrl: creativeVideoUrl,
        comparisonVideoUrl: adVideoUrl,
      });

      return result;
    } catch (error) {
      console.error('提交视频审核失败:', error);
      throw error;
    }
  },

  /**
   * 获取我的作品列表
   */
  getMyWorks: async (params: { status?: string; page?: number; pageSize?: number } = {}): Promise<{ list: any[]; total: number; page: number; pageSize: number }> => {
    const response = await api.get<{ code: number; message: string; data: { list: any[]; total: number; page: number; pageSize: number } }>(
      API_ENDPOINTS.UPLOAD_MY_WORKS,
      { params }
    );
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as unknown as { list: any[]; total: number; page: number; pageSize: number };
  },

  /**
   * 更新作品信息
   */
  updateWork: async (videoId: string, data: {
    title?: string;
    description?: string;
    price?: number;
    category?: string;
    coverUrl?: string;
  }): Promise<void> => {
    await api.put(`/upload/videos/${videoId}`, data);
  },

  /**
   * 删除作品（软删除）
   */
  deleteWork: async (videoId: string): Promise<void> => {
    await api.delete(`/upload/videos/${videoId}`);
  },

  /**
   * 更新作品状态（上架/下架）
   */
  updateWorkStatus: async (videoId: string, status: 'approved' | 'offline'): Promise<void> => {
    await api.put(`/upload/videos/${videoId}/status`, { status });
  },

  /**
   * 提交文案创意（需要后台报价）
   */
  submitTextIdea: async (data: {
    title: string;
    content: string;
    ideaType?: string;
    requirements?: string;
    expectedDifficulty?: string;
    referenceImages?: string[];  // 参考图片 URL 数组
    budget?: number | null;
  }): Promise<{ ideaId: string; status: string; message: string }> => {
    const response = await api.post<{ 
      code: number; 
      message: string; 
      data: { ideaId: string; status: string; message: string } 
    }>(
      API_ENDPOINTS.UPLOAD_CREATE_VIDEO,
      {
        ...data,
        contentType: 'text',  // 标记为文案类型
        reviewStatus: 'pending_quote',  // 文案类型需要报价
      }
    );
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as unknown as { ideaId: string; status: string; message: string };
  },
};

