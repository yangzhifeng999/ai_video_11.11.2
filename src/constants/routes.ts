export const ROUTES = {
  HOME: '/',
  PURCHASED: '/purchased',
  RESULT_VIDEO: '/result-video/:orderId',
  UPLOAD_DUAL_VIDEO: '/upload/dual-video',
  UPLOAD_VIDEO_REVIEW: '/upload/video/review',
  CREATOR_AGREEMENT: '/creator-agreement',
  UPLOAD_TEXT: '/upload/text',
  UPLOAD_TEXT_REVIEW: '/upload/text/review',
  TEXT_SERVICE_AGREEMENT: '/text-service-agreement',
  MAKE_VIDEO: '/make-video/:videoId',
  MESSAGES: '/messages',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  EARNINGS: '/earnings',
  EARNINGS_WITHDRAWALS: '/earnings/withdrawals',
  VIDEO_DETAIL: '/video/:videoId',
  CREATOR_DETAIL: '/creator/:creatorId',
  POINTS: '/points',
  REVENUE_SHARE: '/revenue-share',
  MY_WORKS: '/my-works',
  WORKS: '/my-works',  // 我的作品列表页
  WORK_DETAIL: '/work/:workId',
  SETTINGS: '/settings',
  HELP: '/help',
  ABOUT: '/about',
  // 管理后台
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: '/admin/users/:id',
  // 内容审核
  ADMIN_REVIEW: '/admin/review',
  ADMIN_REVIEW_DETAIL: '/admin/review/:id',
  // 视频管理
  ADMIN_VIDEOS: '/admin/videos',
  ADMIN_VIDEO_UPLOAD: '/admin/videos/upload',
  ADMIN_VIDEO_DETAIL: '/admin/videos/:id',
} as const;





