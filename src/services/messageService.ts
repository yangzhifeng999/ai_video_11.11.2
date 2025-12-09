import api from './api';
import { API_ENDPOINTS } from '@/constants/api';

// 消息类型
export type MessageType = 'system' | 'order' | 'announcement' | 'interaction';

// 消息接口
export interface IMessage {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  read: boolean;
  timestamp: string;
  createdAt: string;
  videoId?: string;
  orderId?: string;
  extra?: Record<string, any>;
}

// 消息列表响应
export interface MessageListResponse {
  list: IMessage[];
  total: number;
  page: number;
  pageSize: number;
}

// 未读数量响应
export interface UnreadCountResponse {
  total: number;
  system: number;
  order: number;
  announcement: number;
  interaction: number;
}

/**
 * 消息服务
 */
export const messageService = {
  /**
   * 获取消息列表
   */
  getMessages: async (params?: {
    page?: number;
    pageSize?: number;
    type?: MessageType | 'all';
  }): Promise<MessageListResponse> => {
    const response = await api.get<{ code: number; message: string; data: MessageListResponse }>(
      API_ENDPOINTS.MESSAGES,
      { params }
    );
    return response.data.data || { list: [], total: 0, page: 1, pageSize: 20 };
  },

  /**
   * 获取消息详情
   */
  getMessage: async (id: string): Promise<IMessage> => {
    const response = await api.get<{ code: number; message: string; data: IMessage }>(
      `${API_ENDPOINTS.MESSAGES}/${id}`
    );
    return response.data.data;
  },

  /**
   * 标记消息已读
   */
  markAsRead: async (id: string): Promise<void> => {
    await api.post(API_ENDPOINTS.MESSAGE_READ(id));
  },

  /**
   * 标记全部已读
   */
  markAllAsRead: async (type?: MessageType | 'all'): Promise<void> => {
    await api.post(`${API_ENDPOINTS.MESSAGES}/read-all`, { type });
  },

  /**
   * 删除消息
   */
  deleteMessage: async (id: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.MESSAGE_DELETE(id));
  },

  /**
   * 获取未读消息数量
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get<{ code: number; message: string; data: UnreadCountResponse }>(
      `${API_ENDPOINTS.MESSAGES}/unread-count`
    );
    return response.data.data || { total: 0, system: 0, order: 0, announcement: 0, interaction: 0 };
  },
};

