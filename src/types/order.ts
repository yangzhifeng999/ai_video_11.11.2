export type OrderType = 'video' | 'text' | 'ai_video';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface IOrder {
  id: string;
  userId: string;
  type: OrderType;
  status: OrderStatus;
  itemId: string;
  itemTitle: string;
  itemCover?: string;
  price: number;
  paymentMethod?: 'wechat' | 'alipay' | 'points';
  paymentStatus: 'unpaid' | 'paid' | 'refunding' | 'refunded';
  paidAt?: string;
  progress?: number;
  estimatedTime?: string;
  refundReason?: string;
  refundAmount?: number;
  resultUrl?: string;
  resultVideoUrl?: string;
  resultVideoId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateOrderData {
  type: OrderType;
  itemId: string;
  paymentMethod: 'wechat' | 'alipay' | 'points';
  faceImage?: File;
}





