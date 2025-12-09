// 确保 API_BASE_URL 以 /api 结尾
const envBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
export const API_BASE_URL = envBaseUrl.endsWith('/api') ? envBaseUrl : `${envBaseUrl}/api`;

// 是否使用Mock数据（开发环境）
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !import.meta.env.VITE_API_BASE_URL;

export const API_ENDPOINTS = {
  // 认证
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_WECHAT_URL: '/auth/wechat/url',       // 获取微信授权URL
  AUTH_LOGIN_WECHAT: '/auth/login/wechat',   // 微信登录（处理授权码）
  
  // 用户
  USER_PROFILE: '/user/profile',
  USER_UPDATE_PROFILE: '/user/profile',
  USER_POINTS: '/user/points',
  
  // 视频
  VIDEOS: '/videos',
  VIDEO_DETAIL: (id: string) => `/videos/${id}`,
  VIDEO_UPLOAD: '/videos/upload',
  VIDEO_LIKE: (id: string) => `/videos/${id}/like`,
  VIDEO_DISLIKE: (id: string) => `/videos/${id}/dislike`,
  VIDEO_COLLECT: (id: string) => `/videos/${id}/collect`,
  
  // 文案
  TEXTS: '/texts',
  TEXT_DETAIL: (id: string) => `/texts/${id}`,
  TEXT_UPLOAD: '/texts/upload',
  
  // 创作者上传
  UPLOAD_COS_SIGN: '/upload/cos-sign',
  UPLOAD_VOD_SIGN: '/upload/vod-sign',
  UPLOAD_VOD_COMMIT: '/upload/vod-commit',
  UPLOAD_CREATE_VIDEO: '/upload/create-video',
  UPLOAD_MY_WORKS: '/upload/my-works',
  
  // 订单
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  ORDER_CREATE: '/orders',
  ORDER_CANCEL: (id: string) => `/orders/${id}/cancel`,
  
  // 作品管理
  WORKS: '/works',
  WORK_DETAIL: (id: string) => `/works/${id}`,
  WORK_UPDATE: (id: string) => `/works/${id}`,
  WORK_DELETE: (id: string) => `/works/${id}`,
  WORK_ONLINE: (id: string) => `/works/${id}/online`,
  WORK_OFFLINE: (id: string) => `/works/${id}/offline`,
  
  // 收益
  EARNINGS: '/earnings',
  EARNINGS_WITHDRAW: '/earnings/withdraw',
  EARNINGS_DETAIL: '/earnings/detail',
  
  // 消息
  MESSAGES: '/user/messages',
  MESSAGE_READ: (id: string) => `/user/messages/${id}/read`,
  MESSAGE_DELETE: (id: string) => `/user/messages/${id}`,
  
  // 评论
  COMMENTS: (videoId: string) => `/videos/${videoId}/comments`,
  COMMENT_CREATE: (videoId: string) => `/videos/${videoId}/comments`,
  
  // 支付
  PAYMENT_CREATE: '/payment/create',
  PAYMENT_QUERY: (orderId: string) => `/payment/${orderId}`,
  
  // 管理后台
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (id: string) => `/admin/users/${id}`,
  ADMIN_USER_UPDATE: (id: string) => `/admin/users/${id}`,
  ADMIN_USER_BAN: (id: string) => `/admin/users/${id}/ban`,
  ADMIN_STATS_OVERVIEW: '/admin/stats/overview',
  
  // 视频审核
  ADMIN_REVIEW: '/admin/review',
  ADMIN_REVIEW_DETAIL: (id: string) => `/admin/review/${id}`,
  ADMIN_REVIEW_INITIAL: (id: string) => `/admin/review/${id}/initial`,
  ADMIN_REVIEW_QUOTE: (id: string) => `/admin/review/${id}/quote`,
  ADMIN_REVIEW_START_PRODUCTION: (id: string) => `/admin/review/${id}/start-production`,
  ADMIN_REVIEW_DELIVERY: (id: string) => `/admin/review/${id}/delivery`,
  ADMIN_REVIEW_PRODUCTION_COMPLETE: (id: string) => `/admin/review/${id}/production-complete`,
  ADMIN_REVIEW_MODIFICATION_COMPLETE: (id: string) => `/admin/review/${id}/modification-complete`,
  ADMIN_REVIEW_PUBLISH: (id: string) => `/admin/review/${id}/publish`,
  ADMIN_REVIEW_MERGE_PUBLISH: (id: string) => `/admin/review/${id}/merge-publish`,
  ADMIN_REVIEW_UPLOAD_PUBLISH: (id: string) => `/admin/review/${id}/upload-publish`,
  ADMIN_REVIEW_MESSAGE: (id: string) => `/admin/review/${id}/message`,
  ADMIN_REVIEW_LOGS: (id: string) => `/admin/review/${id}/logs`,
  ADMIN_REVIEW_STATS: '/admin/review/stats',
  
  // 视频管理（运营）
  ADMIN_VIDEOS: '/admin/videos',
  ADMIN_VIDEO_DETAIL: (id: string) => `/admin/videos/${id}`,
  ADMIN_VIDEO_UPDATE: (id: string) => `/admin/videos/${id}`,
  ADMIN_VIDEO_DELETE: (id: string) => `/admin/videos/${id}`,
  ADMIN_VIDEO_BATCH: '/admin/videos/batch',
  ADMIN_VIDEO_RECOMMEND: (id: string) => `/admin/videos/${id}/recommend`,
  ADMIN_VIDEO_STATUS: (id: string) => `/admin/videos/${id}/status`,
  ADMIN_VIDEO_REVIEW: (id: string) => `/admin/videos/${id}/review`, // 兼容旧接口
} as const;

