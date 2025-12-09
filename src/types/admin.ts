export interface AdminUser {
  id: string;
  username: string;
  nickname: string;
  role: 'super_admin' | 'admin' | 'moderator';
}

export interface AdminAuthResponse {
  token: string;
  admin: AdminUser;
}

export interface UserListItem {
  _id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  points: number;
  balance: number;
  isCreator: boolean;
  isAdmin: boolean;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserListResponse {
  list: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalVideos: number;
  pendingReview?: number;
  totalOrders: number;
  totalRevenue: number;
}

// 审核状态类型
export type ReviewStatus = 
  | 'pending'           // 待审核（旧状态，兼容）
  | 'pending_initial'   // 待初审
  | 'initial_rejected'  // 初审不通过
  | 'pending_quote'     // 待报价
  | 'quoted'            // 已报价
  | 'pending_payment'   // 待付款
  | 'production'        // 制作中
  | 'pending_confirm'   // 待客户确认
  | 'modifying'         // 修改中
  | 'pending_reconfirm' // 待再次确认
  | 'pending_final'     // 待终审
  | 'published'         // 已上架
  | 'offline';          // 已下架

// 审核状态配置
export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'warning' },
  pending_initial: { label: '待初审', color: 'warning' },
  initial_rejected: { label: '初审不通过', color: 'error' },
  pending_quote: { label: '待报价', color: 'processing' },
  quoted: { label: '已报价', color: 'cyan' },
  pending_payment: { label: '待付款', color: 'orange' },
  production: { label: '制作中', color: 'blue' },
  pending_confirm: { label: '待客户确认', color: 'purple' },
  modifying: { label: '修改中', color: 'geekblue' },
  pending_reconfirm: { label: '待再次确认', color: 'purple' },
  pending_final: { label: '待终审', color: 'gold' },
  published: { label: '已上架', color: 'success' },
  offline: { label: '已下架', color: 'default' },
};

// 创作者信息
export interface Creator {
  _id?: string;
  id?: string;
  nickname: string;
  avatar?: string;
  phone?: string;
}

// 审核日志
export interface ReviewLog {
  _id: string;
  videoId: string;
  action: string;
  operatorId: string;
  operatorType: 'admin' | 'customer' | 'system';
  content: string;
  quotePrice?: number;
  createdAt: string;
}

// 审核消息
export interface ReviewMessage {
  _id: string;
  videoId: string;
  senderId: string;
  senderType: 'admin' | 'customer';
  content: string;
  createdAt: string;
}

// 审核项
export interface ReviewItem {
  _id: string;
  title: string;
  description?: string;
  coverUrl: string;
  videoUrl: string;
  comparisonVideoUrl?: string;  // 对比视频（第二个视频）
  uploadConfig?: {              // 上传配置（素材列表）
    materials?: Array<{
      type: 'video' | 'image';
      url: string;
      name?: string;
    }>;
  };
  
  // 内容类型
  contentType?: 'video' | 'text';  // 视频或文案
  ideaType?: string;               // 创意类型
  requirements?: string;           // 需求说明
  expectedDifficulty?: string;     // 预期难度
  referenceImages?: string[];      // 参考图片
  budget?: number | null;          // 预算
  
  category: string;
  price: number;
  creatorId?: string;
  creator?: Creator;
  reviewStatus: ReviewStatus;
  status?: 'pending' | 'approved' | 'rejected' | 'offline' | 'published';
  
  // 报价相关
  quotePrice?: number;
  estimatedDays?: number;
  quoteNote?: string;
  quotedAt?: string;
  
  // 制作相关
  resultVideoUrl?: string;
  productionNote?: string;
  productionCompletedAt?: string;
  
  // 修改相关
  modifyCount?: number;
  maxModifyCount?: number;
  modificationNote?: string;
  modificationCompletedAt?: string;
  
  // 审核相关
  rejectReason?: string;
  initialReviewedAt?: string;
  publishedAt?: string;
  
  // 展示相关
  isHomeRecommended?: boolean;
  sortOrder?: number;
  isPinned?: boolean;
  
  // 统计
  viewCount?: number;
  likeCount?: number;
  orderCount?: number;
  
  // 时间
  createdAt: string;
  updatedAt: string;
  
  // 详情页额外数据
  reviewLogs?: ReviewLog[];
  messages?: ReviewMessage[];
}

export interface ReviewListResponse {
  list: ReviewItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 审核统计
export interface ReviewStats {
  pendingInitial: number;
  pendingQuote: number;
  quoted: number;
  production: number;
  pendingConfirm: number;
  modifying: number;
  pendingFinal: number;
  totalPending: number;
  waitingCustomer: number;
  todayProcessed: number;
  totalPublished: number;
}

// 视频管理项
export interface VideoListItem {
  _id: string;
  title: string;
  description?: string;
  coverUrl: string;
  videoUrl: string;
  category: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected' | 'offline' | 'published';
  reviewStatus: ReviewStatus;
  creatorId?: string;
  creatorName?: string;
  creator?: Creator;
  isHomeRecommended?: boolean;
  sortOrder?: number;
  isPinned?: boolean;
  viewCount?: number;
  likeCount?: number;
  orderCount?: number;
  purchaseCount?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface VideoListResponse {
  list: VideoListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VideoItem extends VideoListItem {
  originalPrice?: number;
  rejectReason?: string;
  stats?: {
    orderCount: number;
    totalRevenue: number;
  };
}

export interface VideoUploadData {
  title: string;
  description?: string;
  category: string;
  price: number;
  originalPrice?: number;
  coverUrl: string;
  videoUrl: string;
}

// 分类配置
export const CATEGORY_OPTIONS = [
  { value: 'comprehensive', label: '综合推荐' },
  { value: 'mother_baby', label: '母婴亲子' },
  { value: 'clothing', label: '时尚穿搭' },
  { value: 'general_merchandise', label: '居家百货' },
  { value: 'other', label: '其他' },
];

export const CATEGORY_MAP: Record<string, string> = {
  comprehensive: '综合推荐',
  mother_baby: '母婴亲子',
  clothing: '时尚穿搭',
  general_merchandise: '居家百货',
  other: '其他',
};
