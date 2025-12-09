import api from './api';
import { API_ENDPOINTS, USE_MOCK_DATA } from '@/constants/api';
import type { IOrder, ICreateOrderData, OrderStatus } from '@/types';
import { mockOrders } from '@/utils/mockData';

export interface OrderListParams {
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
}

export interface OrderListResponse {
  list: IOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export const orderService = {
  /**
   * 获取订单列表
   */
  getOrderList: async (params: OrderListParams = {}): Promise<OrderListResponse> => {
    if (USE_MOCK_DATA) {
      // Mock模式：模拟延迟并返回Mock数据
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredOrders = [...mockOrders];
      
      // 状态筛选
      if (params.status) {
        filteredOrders = filteredOrders.filter(order => order.status === params.status);
      }
      
      // 分页
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedOrders = filteredOrders.slice(start, end);
      
      return {
        list: paginatedOrders,
        total: filteredOrders.length,
        page,
        pageSize,
      };
    }
    
    const response = await api.get<OrderListResponse>(API_ENDPOINTS.ORDERS, { params });
    return response.data;
  },

  /**
   * 获取订单详情
   */
  getOrderDetail: async (id: string): Promise<IOrder> => {
    const response = await api.get<IOrder>(API_ENDPOINTS.ORDER_DETAIL(id));
    return response.data;
  },

  /**
   * 创建订单
   */
  createOrder: async (data: ICreateOrderData, onProgress?: (percent: number) => void): Promise<IOrder> => {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('itemId', data.itemId);
    formData.append('paymentMethod', data.paymentMethod);
    if (data.faceImage) {
      formData.append('faceImage', data.faceImage);
    }

    const response = await api.post<IOrder>(API_ENDPOINTS.ORDER_CREATE, formData, {
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
   * 取消订单
   */
  cancelOrder: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      // Mock模式：模拟延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 在实际应用中，这里应该更新mockOrders数组中的订单状态
      const order = mockOrders.find(o => o.id === id);
      if (order) {
        order.status = 'cancelled';
      }
      return;
    }
    
    await api.post(API_ENDPOINTS.ORDER_CANCEL(id));
  },
};





