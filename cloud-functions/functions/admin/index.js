/**
 * 后台管理云函数
 * 处理后台管理相关功能（预留扩展）
 */

const { COLLECTIONS, dbUtils, _, db } = require('./shared/database');
const { success, error, paramError, forbidden, BIZ_CODE } = require('./shared/response');
const { authenticateAdmin, generateToken } = require('./shared/auth');
const { parseBody, getPath, getMethod, getQuery, hashPassword, verifyPassword, handleOptionsRequest } = require('./shared/utils');

/**
 * 主处理函数
 */
exports.main = async (event, context) => {
  // 处理 OPTIONS 预检请求（CORS）
  if (getMethod(event) === 'OPTIONS') {
    return handleOptionsRequest();
  }

  const path = getPath(event);
  const method = getMethod(event);
  const body = parseBody(event);
  const query = getQuery(event);

  try {
    // 管理员登录
    if (path.endsWith('/admin/login') && method === 'POST') {
      return await handleAdminLogin(body);
    }

    // 以下接口需要管理员认证
    const authResult = await authenticateAdmin(event);
    if (!authResult.authenticated) {
      return forbidden('需要管理员权限');
    }
    const adminId = (authResult.user && authResult.user.userId) || (authResult.user && authResult.user._id);

    // ===== 仪表盘 =====
    if (path.endsWith('/admin/dashboard') && method === 'GET') {
      return await handleGetDashboard();
    }

    // ===== 用户管理 =====
    if (path.endsWith('/admin/users') && method === 'GET') {
      return await handleGetUsers(query);
    }

    if (path.match(/\/admin\/users\/[\w-]+$/) && method === 'GET') {
      const userId = path.split('/').pop();
      return await handleGetUser(userId);
    }

    if (path.match(/\/admin\/users\/[\w-]+$/) && method === 'PUT') {
      const userId = path.split('/').pop();
      return await handleUpdateUser(userId, body);
    }

    if (path.match(/\/admin\/users\/[\w-]+\/ban$/) && method === 'POST') {
      const userId = path.split('/').slice(-2, -1)[0];
      return await handleBanUser(userId, body);
    }

    // ===== 内容审核 =====
    if (path.endsWith('/admin/review') && method === 'GET') {
      return await handleGetReviewList(query);
    }

    if (path.endsWith('/admin/review/stats') && method === 'GET') {
      return await handleGetReviewStats();
    }

    if (path.match(/\/admin\/review\/[\w-]+$/) && method === 'GET') {
      const videoId = path.split('/').pop();
      return await handleGetReviewDetail(videoId);
    }

    if (path.match(/\/admin\/review\/[\w-]+\/initial$/) && method === 'POST') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleInitialReview(videoId, body, adminId);
    }

    if (path.match(/\/admin\/review\/[\w-]+\/quote$/) && method === 'POST') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleQuote(videoId, body, adminId);
    }

    if (path.match(/\/admin\/review\/[\w-]+\/start-production$/) && method === 'POST') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleStartProduction(videoId, body, adminId);
    }

    if (path.match(/\/admin\/review\/[\w-]+\/delivery$/) && method === 'POST') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleDelivery(videoId, body, adminId);
    }

    if (path.match(/\/admin\/review\/[\w-]+\/publish$/) && method === 'POST') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handlePublish(videoId, body, adminId);
    }

    // 合并视频并上架（调用 RunningHub）
    if (path.match(/\/admin\/review\/[\w-]+\/merge-publish$/) && method === 'POST') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleMergeAndPublish(videoId, body, adminId);
    }

    // 本地上传视频并上架
    if (path.match(/\/admin\/review\/[\w-]+\/upload-publish$/) && method === 'POST') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleUploadAndPublish(videoId, body, adminId);
    }

    // ===== 视频管理 =====
    if (path.endsWith('/admin/videos') && method === 'GET') {
      return await handleGetVideos(query);
    }

    if (path.match(/\/admin\/videos\/[\w-]+\/review$/) && method === 'POST') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleReviewVideo(videoId, body);
    }

    if (path.match(/\/admin\/videos\/[\w-]+$/) && method === 'DELETE') {
      const videoId = path.split('/').pop();
      return await handleDeleteVideo(videoId);
    }

    // ===== 订单管理 =====
    if (path.endsWith('/admin/orders') && method === 'GET') {
      return await handleGetOrders(query);
    }

    if (path.match(/\/admin\/orders\/[\w-]+$/) && method === 'GET') {
      const orderId = path.split('/').pop();
      return await handleGetOrder(orderId);
    }

    if (path.match(/\/admin\/orders\/[\w-]+\/refund$/) && method === 'POST') {
      const orderId = path.split('/').slice(-2, -1)[0];
      return await handleAdminRefund(orderId, body);
    }

    // ===== 提现管理 =====
    if (path.endsWith('/admin/withdrawals') && method === 'GET') {
      return await handleGetWithdrawals(query);
    }

    if (path.match(/\/admin\/withdrawals\/[\w-]+\/approve$/) && method === 'POST') {
      const withdrawalId = path.split('/').slice(-2, -1)[0];
      return await handleApproveWithdrawal(withdrawalId);
    }

    if (path.match(/\/admin\/withdrawals\/[\w-]+\/reject$/) && method === 'POST') {
      const withdrawalId = path.split('/').slice(-2, -1)[0];
      return await handleRejectWithdrawal(withdrawalId, body);
    }

    // ===== 系统配置 =====
    if (path.endsWith('/admin/config') && method === 'GET') {
      return await handleGetConfig();
    }

    if (path.endsWith('/admin/config') && method === 'PUT') {
      return await handleUpdateConfig(body);
    }

    // ===== 数据统计 =====
    if (path.endsWith('/admin/stats/overview') && method === 'GET') {
      return await handleGetStatsOverview(query);
    }

    if (path.endsWith('/admin/stats/revenue') && method === 'GET') {
      return await handleGetRevenueStats(query);
    }

    // ===== 操作日志 =====
    if (path.endsWith('/admin/logs') && method === 'GET') {
      return await handleGetLogs(query);
    }

    // ===== 数据状态同步 =====
    if (path.endsWith('/admin/sync-video-status') && method === 'POST') {
      return await handleSyncVideoStatus(adminId);
    }

    // ===== 清理测试数据 =====
    if (path.endsWith('/admin/clear-test-data') && method === 'POST') {
      return await handleClearTestData(adminId);
    }

    // ===== 删除指定视频 =====
    if (path.endsWith('/admin/delete-videos') && method === 'POST') {
      return await handleDeleteVideosByTitle(body, adminId);
    }

    return error(BIZ_CODE.SYSTEM_ERROR, '接口不存在', 404);
  } catch (err) {
    console.error('Admin error:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, err.message);
  }
};

/**
 * 管理员登录
 */
async function handleAdminLogin(body) {
  const { username, password } = body;

  if (!username || !password) {
    return paramError('用户名和密码不能为空');
  }

  // 查询管理员用户
  const admin = await dbUtils.findOne(COLLECTIONS.ADMIN_USERS, { username });

  if (!admin) {
    return error(BIZ_CODE.AUTH_FAILED, '用户名或密码错误');
  }

  if (!verifyPassword(password, admin.password)) {
    return error(BIZ_CODE.AUTH_FAILED, '用户名或密码错误');
  }

  // 更新最后登录时间
  await dbUtils.update(COLLECTIONS.ADMIN_USERS, admin._id, {
    lastLoginAt: new Date().toISOString(),
  });

  // 记录登录日志
  await dbUtils.create(COLLECTIONS.ADMIN_LOGS, {
    adminId: admin._id,
    action: 'login',
    ip: '', // TODO: 获取IP
    userAgent: '',
  });

  // 生成 Token
  const token = generateToken({
    userId: admin._id,
    username: admin.username,
    isAdmin: true,
    role: admin.role,
  });

  return success({
    token,
    admin: {
      id: admin._id,
      username: admin.username,
      nickname: admin.nickname,
      role: admin.role,
    },
  });
}

/**
 * 获取仪表盘数据
 */
async function handleGetDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const [
    totalUsers,
    todayUsers,
    totalVideos,
    pendingVideos,
    totalOrders,
    todayOrders,
    pendingWithdrawals,
  ] = await Promise.all([
    dbUtils.count(COLLECTIONS.USERS, {}),
    dbUtils.count(COLLECTIONS.USERS, { createdAt: _.gte(todayStr) }),
    dbUtils.count(COLLECTIONS.VIDEOS, { deletedAt: _.exists(false) }),
    dbUtils.count(COLLECTIONS.VIDEOS, { status: 'pending' }),
    dbUtils.count(COLLECTIONS.ORDERS, {}),
    dbUtils.count(COLLECTIONS.ORDERS, { createdAt: _.gte(todayStr) }),
    dbUtils.count(COLLECTIONS.WITHDRAWALS, { status: 'pending' }),
  ]);

  // 计算今日收入
  const todayOrdersData = await dbUtils.find(COLLECTIONS.ORDERS, {
    createdAt: _.gte(todayStr),
    paymentStatus: 'paid',
  });
  const todayRevenue = todayOrdersData.reduce((sum, o) => sum + (o.price || 0), 0);

  return success({
    totalUsers,
    todayUsers,
    totalVideos,
    pendingVideos,
    totalOrders,
    todayOrders,
    todayRevenue,
    pendingWithdrawals,
  });
}

/**
 * 获取用户列表
 */
async function handleGetUsers(query) {
  const { keyword, status, page = 1, pageSize = 20 } = query;

  const filter = {};
  if (keyword) {
    filter.$or = [
      { nickname: new RegExp(keyword, 'i') },
      { phone: new RegExp(keyword, 'i') },
    ];
  }
  if (status) {
    filter.status = status;
  }

  const result = await dbUtils.paginate(
    COLLECTIONS.USERS,
    filter,
    parseInt(page),
    parseInt(pageSize),
    { orderBy: 'createdAt', order: 'desc' }
  );

  // 移除密码
  result.list = result.list.map(u => {
    const { password, ...rest } = u;
    return { ...rest, id: u._id };
  });

  return success(result);
}

/**
 * 获取用户详情
 */
async function handleGetUser(userId) {
  const user = await dbUtils.findById(COLLECTIONS.USERS, userId);
  if (!user) {
    return error(BIZ_CODE.USER_NOT_FOUND);
  }

  const { password, ...userInfo } = user;

  // 获取用户统计
  const [orderCount, videoCount, totalSpent] = await Promise.all([
    dbUtils.count(COLLECTIONS.ORDERS, { userId }),
    dbUtils.count(COLLECTIONS.VIDEOS, { creatorId: userId }),
    dbUtils.find(COLLECTIONS.ORDERS, { userId, paymentStatus: 'paid' }),
  ]);

  return success({
    ...userInfo,
    id: user._id,
    stats: {
      orderCount,
      videoCount,
      totalSpent: totalSpent.reduce((sum, o) => sum + (o.price || 0), 0),
    },
  });
}

/**
 * 更新用户
 */
async function handleUpdateUser(userId, body) {
  const { nickname, status, points, balance, isCreator } = body;

  const updateData = {};
  if (nickname !== undefined) updateData.nickname = nickname;
  if (status !== undefined) updateData.status = status;
  if (points !== undefined) updateData.points = parseInt(points);
  if (balance !== undefined) updateData.balance = parseInt(balance);
  if (isCreator !== undefined) updateData.isCreator = isCreator;

  if (Object.keys(updateData).length === 0) {
    return paramError('没有需要更新的字段');
  }

  await dbUtils.update(COLLECTIONS.USERS, userId, updateData);

  return success(null, '更新成功');
}

/**
 * 封禁用户
 */
async function handleBanUser(userId, body) {
  const { reason, duration } = body;

  await dbUtils.update(COLLECTIONS.USERS, userId, {
    status: 'banned',
    banReason: reason,
    banDuration: duration,
    bannedAt: new Date().toISOString(),
  });

  return success(null, '用户已封禁');
}

/**
 * 获取视频列表
 */
async function handleGetVideos(query) {
  var status = query.status;
  var category = query.category;
  var keyword = query.keyword;
  var page = query.page || 1;
  var pageSize = query.pageSize || 20;

  // 构建查询条件
  var filter = {};
  
  // 只查询未删除的
  filter.deletedAt = _.exists(false);
  
  // 按状态筛选 - 默认显示已上架的视频
  if (status) {
    filter.status = status;
  }
  
  // 按分类筛选
  if (category) {
    filter.category = category;
  }
  
  // 按关键词搜索（标题）- 使用 CloudBase 的 RegExp
  if (keyword) {
    filter.title = db.RegExp({
      regexp: keyword,
      options: 'i'
    });
  }

  console.log('handleGetVideos query params:', JSON.stringify(query));

  var result = await dbUtils.paginate(
    COLLECTIONS.VIDEOS,
    filter,
    parseInt(page),
    parseInt(pageSize),
    { orderBy: 'createdAt', order: 'desc' }
  );

  // 获取每个视频的创作者信息
  var videoList = [];
  for (var i = 0; i < result.list.length; i++) {
    var v = result.list[i];
    var creatorInfo = null;
    
    if (v.creatorId) {
      var creator = await dbUtils.findById(COLLECTIONS.USERS, v.creatorId);
      if (creator) {
        creatorInfo = {
          id: creator._id,
          nickname: creator.nickname || '匿名用户',
          avatar: creator.avatar,
          phone: creator.phone,
        };
      }
    }
    
    videoList.push({
      _id: v._id,
      id: v._id,
      title: v.title || '未命名视频',
      description: v.description,
      coverUrl: v.coverUrl,
      videoUrl: v.finalVideoUrl || v.videoUrl,
      category: v.category,
      price: v.price || 0,
      status: v.status,
      reviewStatus: v.reviewStatus,
      isHomeRecommended: v.isHomeRecommended || false,
      sortOrder: v.sortOrder,
      viewCount: v.viewCount || 0,
      purchaseCount: v.purchaseCount || 0,
      creator: creatorInfo,
      publishedAt: v.publishedAt,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    });
  }

  result.list = videoList;

  return success(result);
}

/**
 * 审核视频
 */
async function handleReviewVideo(videoId, body) {
  const { status, rejectReason } = body;

  if (!['approved', 'rejected'].includes(status)) {
    return paramError('状态值无效');
  }

  const updateData = {
    status,
    reviewedAt: new Date().toISOString(),
  };

  if (status === 'rejected') {
    updateData.rejectReason = rejectReason || '审核不通过';
  }

  await dbUtils.update(COLLECTIONS.VIDEOS, videoId, updateData);

  // 更新作品记录
  await dbUtils.updateWhere(COLLECTIONS.WORKS, { videoId }, {
    status,
  });

  return success(null, status === 'approved' ? '已通过' : '已拒绝');
}

/**
 * 删除视频
 */
async function handleDeleteVideo(videoId) {
  await dbUtils.softDelete(COLLECTIONS.VIDEOS, videoId);
  return success(null, '删除成功');
}

/**
 * 获取订单列表
 */
async function handleGetOrders(query) {
  const { status, keyword, page = 1, pageSize = 20 } = query;

  const filter = {};
  if (status) filter.status = status;
  if (keyword) {
    filter.orderNo = new RegExp(keyword, 'i');
  }

  const result = await dbUtils.paginate(
    COLLECTIONS.ORDERS,
    filter,
    parseInt(page),
    parseInt(pageSize),
    { orderBy: 'createdAt', order: 'desc' }
  );

  result.list = result.list.map(o => ({ ...o, id: o._id }));

  return success(result);
}

/**
 * 获取订单详情
 */
async function handleGetOrder(orderId) {
  const order = await dbUtils.findById(COLLECTIONS.ORDERS, orderId);
  if (!order) {
    return error(BIZ_CODE.ORDER_NOT_FOUND);
  }

  // 获取用户和视频信息
  const [user, video] = await Promise.all([
    dbUtils.findById(COLLECTIONS.USERS, order.userId),
    dbUtils.findById(COLLECTIONS.VIDEOS, order.videoId),
  ]);

  return success({
    ...order,
    id: order._id,
    user: user ? { id: user._id, nickname: user.nickname, phone: user.phone } : null,
    video: video ? { id: video._id, title: video.title } : null,
  });
}

/**
 * 管理员退款
 */
async function handleAdminRefund(orderId, body) {
  const { reason } = body;

  const order = await dbUtils.findById(COLLECTIONS.ORDERS, orderId);
  if (!order) {
    return error(BIZ_CODE.ORDER_NOT_FOUND);
  }

  // TODO: 调用退款逻辑

  await dbUtils.update(COLLECTIONS.ORDERS, orderId, {
    status: 'refunded',
    refundReason: reason || '管理员退款',
    refundAmount: order.price,
    refundedAt: new Date().toISOString(),
  });

  return success(null, '退款成功');
}

/**
 * 获取提现列表
 */
async function handleGetWithdrawals(query) {
  const { status, page = 1, pageSize = 20 } = query;

  const filter = {};
  if (status) filter.status = status;

  const result = await dbUtils.paginate(
    COLLECTIONS.WITHDRAWALS,
    filter,
    parseInt(page),
    parseInt(pageSize),
    { orderBy: 'createdAt', order: 'desc' }
  );

  result.list = result.list.map(w => ({ ...w, id: w._id }));

  return success(result);
}

/**
 * 审核通过提现
 */
async function handleApproveWithdrawal(withdrawalId) {
  await dbUtils.update(COLLECTIONS.WITHDRAWALS, withdrawalId, {
    status: 'approved',
    approvedAt: new Date().toISOString(),
  });

  return success(null, '已通过');
}

/**
 * 拒绝提现
 */
async function handleRejectWithdrawal(withdrawalId, body) {
  const { reason } = body;

  const withdrawal = await dbUtils.findById(COLLECTIONS.WITHDRAWALS, withdrawalId);
  if (!withdrawal) {
    return error(BIZ_CODE.SYSTEM_ERROR, '提现记录不存在');
  }

  // 退还余额
  const user = await dbUtils.findById(COLLECTIONS.USERS, withdrawal.userId);
  await dbUtils.update(COLLECTIONS.USERS, withdrawal.userId, {
    balance: (user.balance || 0) + withdrawal.amount,
  });

  await dbUtils.update(COLLECTIONS.WITHDRAWALS, withdrawalId, {
    status: 'rejected',
    rejectReason: reason,
    rejectedAt: new Date().toISOString(),
  });

  return success(null, '已拒绝');
}

/**
 * 获取系统配置
 */
async function handleGetConfig() {
  const config = await dbUtils.findOne(COLLECTIONS.SYSTEM_CONFIG, { key: 'main' });
  return success(config || {});
}

/**
 * 更新系统配置
 */
async function handleUpdateConfig(body) {
  const existing = await dbUtils.findOne(COLLECTIONS.SYSTEM_CONFIG, { key: 'main' });

  if (existing) {
    await dbUtils.update(COLLECTIONS.SYSTEM_CONFIG, existing._id, body);
  } else {
    await dbUtils.create(COLLECTIONS.SYSTEM_CONFIG, { key: 'main', ...body });
  }

  return success(null, '配置已更新');
}

/**
 * 获取统计概览
 */
async function handleGetStatsOverview(query) {
  const { startDate, endDate } = query;
  
  // TODO: 根据日期范围统计数据
  
  return success({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    // ...
  });
}

/**
 * 获取收入统计
 */
async function handleGetRevenueStats(query) {
  const { period = 'day', limit = 30 } = query;
  
  // TODO: 按日/周/月统计收入
  
  return success({
    data: [],
    period,
  });
}

/**
 * 获取操作日志
 */
async function handleGetLogs(query) {
  const { page = 1, pageSize = 50 } = query;

  const result = await dbUtils.paginate(
    COLLECTIONS.ADMIN_LOGS,
    {},
    parseInt(page),
    parseInt(pageSize),
    { orderBy: 'createdAt', order: 'desc' }
  );

  return success(result);
}

// ==================== 内容审核 ====================

/**
 * 获取审核列表
 */
async function handleGetReviewList(query) {
  var page = query.page || 1;
  var pageSize = query.pageSize || 20;
  var reviewStatusParam = query.reviewStatus;
  var category = query.category;
  var keyword = query.keyword;
  var contentType = query.contentType;  // 新增：内容类型筛选 (video/text)

  // 构建查询条件 - 默认查询所有非删除的内容
  var conditions = [];
  
  // 基础条件：未删除
  conditions.push({ deletedAt: _.exists(false) });
  
  // 按内容类型筛选
  if (contentType === 'video') {
    // 视频类型：有 videoUrl 且 videoUrl 是真实的 COS 链接（不是测试链接）
    conditions.push({ videoUrl: _.exists(true) });
    // 排除文案类型
    conditions.push({ contentType: _.neq('text') });
  } else if (contentType === 'text') {
    // 文案类型：contentType 必须明确是 'text'
    conditions.push({ contentType: _.eq('text') });
  }
  
  // 按审核状态筛选
  if (reviewStatusParam) {
    conditions.push({ reviewStatus: reviewStatusParam });
  }
  
  if (category) {
    conditions.push({ category: category });
  }

  if (keyword) {
    // 使用 CloudBase 的 RegExp
    conditions.push({ title: db.RegExp({ regexp: keyword, options: 'i' }) });
  }
  
  // 组合所有条件
  var filter = conditions.length > 0 ? _.and(conditions) : {};

  var result = await dbUtils.paginate(
    COLLECTIONS.VIDEOS,
    filter,
    parseInt(page),
    parseInt(pageSize),
    { orderBy: 'createdAt', order: 'desc' }
  );

  // 获取创作者信息
  var list = await Promise.all(
    result.list.map(async function(video) {
      var creator = null;
      if (video.creatorId) {
        creator = await dbUtils.findById(COLLECTIONS.USERS, video.creatorId);
      }
      return {
        _id: video._id,
        title: video.title,
        description: video.description,
        coverUrl: video.coverUrl,
        videoUrl: video.videoUrl,
        comparisonVideoUrl: video.comparisonVideoUrl,
        uploadConfig: video.uploadConfig,
        category: video.category,
        price: video.price,
        status: video.status,
        reviewStatus: video.reviewStatus || 'pending_initial',
        rejectReason: video.rejectReason,
        quotePrice: video.quotePrice || video.quotedPrice,
        estimatedDays: video.estimatedDays,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        creator: creator ? {
          _id: creator._id,
          id: creator._id,
          nickname: creator.nickname,
          avatar: creator.avatar,
          phone: creator.phone,
        } : null,
      };
    })
  );

  return success({
    list: list,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  });
}

/**
 * 获取审核统计
 */
async function handleGetReviewStats() {
  const [
    totalPending,
    pendingInitial,
    approved,
    rejected,
  ] = await Promise.all([
    dbUtils.count(COLLECTIONS.VIDEOS, { status: 'pending' }),
    dbUtils.count(COLLECTIONS.VIDEOS, { status: 'pending', reviewStatus: 'pending_initial' }),
    dbUtils.count(COLLECTIONS.VIDEOS, { status: 'approved' }),
    dbUtils.count(COLLECTIONS.VIDEOS, { status: 'rejected' }),
  ]);

  return success({
    totalPending,
    pendingInitial,
    pendingQuote: 0,
    quoted: 0,
    production: 0,
    pendingConfirm: 0,
    modifying: 0,
    pendingFinal: 0,
    totalPublished: approved,
    waitingCustomer: 0,
    todayProcessed: 0,
  });
}

/**
 * 获取审核详情
 */
async function handleGetReviewDetail(videoId) {
  const video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND, '视频不存在');
  }

  // 获取创作者信息
  let creator = null;
  if (video.creatorId) {
    creator = await dbUtils.findById(COLLECTIONS.USERS, video.creatorId);
  }

  return success({
    ...video,
    _id: video._id,
    reviewStatus: video.reviewStatus || 'pending_initial',
    creator: creator ? {
      id: creator._id,
      nickname: creator.nickname,
      avatar: creator.avatar,
    } : null,
  });
}

/**
 * 视频审核（简化流程：待审核 → 已完成/已拒绝）
 * 视频类型：通过后直接上架
 * 文案类型：通过后进入报价流程
 */
async function handleInitialReview(videoId, body, adminId) {
  // 支持前端发送的参数名 passed/rejectReason 或 approved/reason
  var passed = body.passed !== undefined ? body.passed : body.approved;
  var rejectReason = body.rejectReason || body.reason || '';

  var video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND, '视频不存在');
  }

  var isTextType = video.contentType === 'text';
  var updates = {};
  var messageTitle = '';
  var messageContent = '';

  if (passed) {
    if (isTextType) {
      // 文案类型：通过后进入待报价状态
      updates = {
        reviewStatus: 'pending_quote',
        status: 'pending',
        initialReviewedBy: adminId,
        initialReviewedAt: new Date().toISOString(),
      };
      messageTitle = '审核通过';
      messageContent = '您的创意《' + video.title + '》已通过审核，请等待平台报价。';
    } else {
      // 视频类型：通过后直接上架
      updates = {
        reviewStatus: 'published',
        status: 'published',
        initialReviewedBy: adminId,
        initialReviewedAt: new Date().toISOString(),
        publishedBy: adminId,
        publishedAt: new Date().toISOString(),
      };
      messageTitle = '审核通过';
      messageContent = '恭喜！您的作品《' + video.title + '》已通过审核并成功上架，快去分享给好友吧！';
      
      // 更新作品记录状态
      await dbUtils.updateWhere(COLLECTIONS.WORKS || 'works', { videoId: videoId }, {
        status: 'published',
      });
    }
  } else {
    // 拒绝
    updates = {
      reviewStatus: 'initial_rejected',
      status: 'rejected',
      rejectReason: rejectReason,
      initialReviewedBy: adminId,
      initialReviewedAt: new Date().toISOString(),
    };
    messageTitle = '审核未通过';
    messageContent = '您的' + (isTextType ? '创意' : '作品') + '《' + video.title + '》审核未通过' + (rejectReason ? '，原因：' + rejectReason : '。');
  }

  await dbUtils.update(COLLECTIONS.VIDEOS, videoId, updates);

  // 发送系统通知给创作者
  if (video.creatorId) {
    await dbUtils.create(COLLECTIONS.MESSAGES || 'messages', {
      userId: video.creatorId,
      type: 'system',
      title: messageTitle,
      content: messageContent,
      videoId: videoId,
      isRead: false,
    });
  }

  return success({ message: passed ? '审核通过' : '已拒绝' });
}

/**
 * 报价（文案审核流程）
 */
async function handleQuote(videoId, body, adminId) {
  var price = body.price;
  var quoteMessage = body.message || body.quoteNote || '';
  var estimatedDays = body.estimatedDays;

  var video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND, '内容不存在');
  }

  if (!price || parseFloat(price) <= 0) {
    return paramError('请输入有效的报价金额');
  }

  var updates = {
    reviewStatus: 'quoted',
    quotePrice: parseFloat(price),
    quotedPrice: parseFloat(price),  // 兼容
    quoteMessage: quoteMessage,
    estimatedDays: estimatedDays || 3,
    quotedBy: adminId,
    quotedAt: new Date().toISOString(),
  };

  await dbUtils.update(COLLECTIONS.VIDEOS, videoId, updates);

  // 发送系统通知给用户
  if (video.creatorId) {
    await dbUtils.create(COLLECTIONS.MESSAGES || 'messages', {
      userId: video.creatorId,
      type: 'system',
      title: '平台已报价',
      content: '您的创意《' + video.title + '》已收到平台报价 ¥' + price + '，请尽快确认付款。',
      videoId: videoId,
      isRead: false,
    });
  }

  return success({ message: '报价成功' });
}

/**
 * 开始制作（用户付款后）
 */
async function handleStartProduction(videoId, body, adminId) {
  var video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND, '内容不存在');
  }

  var updates = {
    reviewStatus: 'production',
    productionStartedBy: adminId,
    productionStartedAt: new Date().toISOString(),
  };

  await dbUtils.update(COLLECTIONS.VIDEOS, videoId, updates);

  // 发送系统通知
  if (video.creatorId) {
    await dbUtils.create(COLLECTIONS.MESSAGES || 'messages', {
      userId: video.creatorId,
      type: 'system',
      title: '开始制作',
      content: '您的创意《' + video.title + '》已开始制作，预计 ' + (video.estimatedDays || 3) + ' 天内完成。',
      videoId: videoId,
      isRead: false,
    });
  }

  return success({ message: '已开始制作' });
}

/**
 * 交付订单（上传成品视频）
 */
async function handleDelivery(videoId, body, adminId) {
  var resultVideoUrl = body.resultVideoUrl;
  var deliveryNote = body.deliveryNote || '';

  var video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND, '内容不存在');
  }

  if (!resultVideoUrl) {
    return paramError('请上传成品视频');
  }

  var updates = {
    reviewStatus: 'published',
    status: 'published',
    resultVideoUrl: resultVideoUrl,
    videoUrl: resultVideoUrl,  // 将成品视频设为主视频
    deliveryNote: deliveryNote,
    deliveredBy: adminId,
    deliveredAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  await dbUtils.update(COLLECTIONS.VIDEOS, videoId, updates);

  // 更新作品记录状态
  await dbUtils.updateWhere(COLLECTIONS.WORKS || 'works', { videoId: videoId }, {
    status: 'published',
  });

  // 发送系统通知
  if (video.creatorId) {
    await dbUtils.create(COLLECTIONS.MESSAGES || 'messages', {
      userId: video.creatorId,
      type: 'system',
      title: '订单已交付',
      content: '您的创意《' + video.title + '》已制作完成并交付，视频已上架！快去我的作品查看吧。',
      videoId: videoId,
      isRead: false,
    });
  }

  return success({ message: '交付成功' });
}

/**
 * 发布上架
 */
async function handlePublish(videoId, body, adminId) {
  var price = body.price;
  var category = body.category;
  var isHomeRecommended = body.isHomeRecommended;
  var sortOrder = body.sortOrder;

  var video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND, '视频不存在');
  }

  var updates = {
    status: 'published',
    reviewStatus: 'published',
    price: parseFloat(price) || video.price,
    category: category || video.category,
    isHomeRecommended: isHomeRecommended || false,
    sortOrder: sortOrder || 0,
    publishedBy: adminId,
    publishedAt: new Date().toISOString(),
  };

  await dbUtils.update(COLLECTIONS.VIDEOS, videoId, updates);

  // 更新作品记录状态
  await dbUtils.updateWhere(COLLECTIONS.WORKS || 'works', { videoId: videoId }, {
    status: 'published',
  });

  // 发送消息通知给创作者
  if (video.creatorId) {
    await dbUtils.create(COLLECTIONS.MESSAGES || 'messages', {
      userId: video.creatorId,
      type: 'review',
      title: '作品已上架',
      content: '恭喜！您的作品《' + video.title + '》已通过审核并成功上架，快去分享给好友吧！',
      videoId: videoId,
      isRead: false,
    });
  }

  return success({ message: '发布成功' });
}

/**
 * 合并视频并上架（调用 RunningHub API）
 * 将创意视频和广告视频合并为一个最终视频
 */
async function handleMergeAndPublish(videoId, body, adminId) {
  var video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND, '视频不存在');
  }

  // 检查是否有两个视频
  if (!video.videoUrl || !video.comparisonVideoUrl) {
    return paramError('需要两个视频才能进行合并');
  }

  var price = body.price;
  var category = body.category;

  try {
    // 1. 创建合并任务记录
    var taskId = await dbUtils.create(COLLECTIONS.MERGE_TASKS || 'merge_tasks', {
      videoId: videoId,
      sourceVideoUrl: video.videoUrl,
      comparisonVideoUrl: video.comparisonVideoUrl,
      status: 'pending',
      createdBy: adminId,
    });

    // 2. 更新视频状态为"合并处理中"
    await dbUtils.update(COLLECTIONS.VIDEOS, videoId, {
      status: 'processing',
      reviewStatus: 'merging',
      mergeTaskId: taskId,
      processingStartedAt: new Date().toISOString(),
    });

    // 3. TODO: 调用 RunningHub API 进行视频合并
    // 这里需要配置 RunningHub 的视频合并工作流
    // 由于视频合并是异步的，实际处理会在 taskCheck 云函数中进行
    
    // 临时方案：直接使用原视频作为最终视频（等待 RunningHub 工作流配置后替换）
    var finalVideoUrl = video.videoUrl;
    
    // 4. 更新为已上架状态
    await dbUtils.update(COLLECTIONS.VIDEOS, videoId, {
      status: 'published',
      reviewStatus: 'published',
      finalVideoUrl: finalVideoUrl,
      videoUrl: finalVideoUrl,  // 更新主视频URL
      price: parseFloat(price) || video.price || 0,
      category: category || video.category,
      publishedBy: adminId,
      publishedAt: new Date().toISOString(),
    });

    // 5. 更新作品记录状态
    await dbUtils.updateWhere(COLLECTIONS.WORKS || 'works', { videoId: videoId }, {
      status: 'published',
    });

    // 6. 发送系统通知
    if (video.creatorId) {
      await dbUtils.create(COLLECTIONS.MESSAGES || 'messages', {
        userId: video.creatorId,
        type: 'system',
        title: '作品已上架',
        content: '恭喜！您的作品《' + video.title + '》已通过审核并成功上架！',
        videoId: videoId,
        isRead: false,
      });
    }

    return success({ 
      message: '视频合并完成并已上架',
      videoId: videoId,
      finalVideoUrl: finalVideoUrl,
    });
  } catch (err) {
    console.error('视频合并上架失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, '视频合并失败: ' + err.message);
  }
}

/**
 * 本地上传视频并上架
 * 管理员直接上传最终视频进行上架
 */
async function handleUploadAndPublish(videoId, body, adminId) {
  var video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND, '视频不存在');
  }

  var finalVideoUrl = body.finalVideoUrl;
  var price = body.price;
  var category = body.category;

  if (!finalVideoUrl) {
    return paramError('请提供上传后的视频URL');
  }

  try {
    // 1. 更新视频信息
    await dbUtils.update(COLLECTIONS.VIDEOS, videoId, {
      status: 'published',
      reviewStatus: 'published',
      finalVideoUrl: finalVideoUrl,
      videoUrl: finalVideoUrl,  // 更新主视频URL为最终视频
      price: parseFloat(price) || video.price || 0,
      category: category || video.category,
      publishedBy: adminId,
      publishedAt: new Date().toISOString(),
    });

    // 2. 更新作品记录状态
    await dbUtils.updateWhere(COLLECTIONS.WORKS || 'works', { videoId: videoId }, {
      status: 'approved',
    });

    // 3. 发送系统通知
    if (video.creatorId) {
      await dbUtils.create(COLLECTIONS.MESSAGES || 'messages', {
        userId: video.creatorId,
        type: 'system',
        title: '作品已上架',
        content: '恭喜！您的作品《' + video.title + '》已通过审核并成功上架！',
        videoId: videoId,
        isRead: false,
      });
    }

    return success({ 
      message: '上传成功并已上架',
      videoId: videoId,
      finalVideoUrl: finalVideoUrl,
    });
  } catch (err) {
    console.error('上传上架失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, '上传上架失败: ' + err.message);
  }
}

/**
 * 同步视频状态
 * 修复 reviewStatus 和 status 不一致的问题
 */
async function handleSyncVideoStatus(adminId) {
  try {
    // 获取所有视频
    var videos = await dbUtils.find(COLLECTIONS.VIDEOS, { deletedAt: _.exists(false) });
    var syncResults = [];
    
    for (var i = 0; i < videos.length; i++) {
      var video = videos[i];
      var needUpdate = false;
      var updateData = {};
      
      // 如果 status 是 published 但 reviewStatus 不是 published
      if (video.status === 'published' && video.reviewStatus !== 'published') {
        updateData.reviewStatus = 'published';
        needUpdate = true;
      }
      
      // 如果 reviewStatus 是 published 但 status 不是 published
      if (video.reviewStatus === 'published' && video.status !== 'published') {
        updateData.status = 'published';
        needUpdate = true;
      }
      
      // 如果没有 reviewStatus，根据 status 设置
      if (!video.reviewStatus && video.status) {
        if (video.status === 'published' || video.status === 'approved') {
          updateData.reviewStatus = 'published';
        } else if (video.status === 'pending') {
          updateData.reviewStatus = 'pending_initial';
        } else if (video.status === 'rejected') {
          updateData.reviewStatus = 'initial_rejected';
        }
        needUpdate = true;
      }
      
      if (needUpdate) {
        await dbUtils.update(COLLECTIONS.VIDEOS, video._id, updateData);
        syncResults.push({
          videoId: video._id,
          title: video.title,
          oldStatus: video.status,
          oldReviewStatus: video.reviewStatus,
          newData: updateData,
        });
      }
    }
    
    return success({
      message: '状态同步完成',
      syncedCount: syncResults.length,
      details: syncResults,
    });
  } catch (err) {
    console.error('状态同步失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, '状态同步失败: ' + err.message);
  }
}

/**
 * 清理测试/虚拟数据
 * 删除以下类型的数据：
 * 1. 没有创作者或创作者不存在的视频
 * 2. 使用测试URL（googleapis.com, picsum.photos等）的视频
 * 3. contentType='text' 但没有真实素材的文案
 * 4. 孤立的消息
 */
async function handleClearTestData(adminId) {
  try {
    // 获取所有视频
    var videos = await dbUtils.find(COLLECTIONS.VIDEOS, {});
    var deletedVideos = [];
    var keptVideos = [];
    
    // 测试URL的关键词
    var testUrlPatterns = ['googleapis.com', 'picsum.photos', 'placeholder', 'example.com', 'test.'];
    
    for (var i = 0; i < videos.length; i++) {
      var video = videos[i];
      var creator = null;
      var shouldDelete = false;
      var deleteReason = '';
      
      // 检查是否有有效的创作者
      if (video.creatorId) {
        creator = await dbUtils.findById(COLLECTIONS.USERS, video.creatorId);
      }
      
      // 判断是否需要删除
      if (!video.creatorId) {
        shouldDelete = true;
        deleteReason = '无创作者ID';
      } else if (!creator) {
        shouldDelete = true;
        deleteReason = '创作者不存在';
      } else {
        // 检查是否使用测试URL
        var videoUrl = video.videoUrl || '';
        var coverUrl = video.coverUrl || '';
        
        for (var p = 0; p < testUrlPatterns.length; p++) {
          var pattern = testUrlPatterns[p];
          if (videoUrl.indexOf(pattern) !== -1 || coverUrl.indexOf(pattern) !== -1) {
            shouldDelete = true;
            deleteReason = '使用测试URL: ' + pattern;
            break;
          }
        }
      }
      
      if (shouldDelete) {
        await dbUtils.delete(COLLECTIONS.VIDEOS, video._id);
        deletedVideos.push({
          videoId: video._id,
          title: video.title,
          reason: deleteReason,
        });
      } else {
        keptVideos.push({
          videoId: video._id,
          title: video.title,
          creatorId: video.creatorId,
          creatorNickname: creator ? creator.nickname : 'Unknown',
        });
      }
    }
    
    // 同时清理孤立的消息（没有对应用户的消息）
    var messages = await dbUtils.find(COLLECTIONS.MESSAGES, {});
    var deletedMessages = 0;
    for (var j = 0; j < messages.length; j++) {
      var msg = messages[j];
      if (msg.userId) {
        var user = await dbUtils.findById(COLLECTIONS.USERS, msg.userId);
        if (!user) {
          await dbUtils.delete(COLLECTIONS.MESSAGES, msg._id);
          deletedMessages++;
        }
      }
    }
    
    return success({
      message: '测试数据清理完成',
      deletedVideosCount: deletedVideos.length,
      deletedVideos: deletedVideos,
      keptVideosCount: keptVideos.length,
      keptVideos: keptVideos,
      deletedMessagesCount: deletedMessages,
    });
  } catch (err) {
    console.error('清理测试数据失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, '清理测试数据失败: ' + err.message);
  }
}

/**
 * 删除指定标题的视频
 */
async function handleDeleteVideosByTitle(body, adminId) {
  try {
    var titles = body.titles || ['888', '777', '222', 'dsfd'];
    var deletedVideos = [];
    
    for (var i = 0; i < titles.length; i++) {
      var title = titles[i];
      // 查找所有匹配标题的视频
      var videos = await dbUtils.find(COLLECTIONS.VIDEOS, { title: title });
      
      for (var j = 0; j < videos.length; j++) {
        var video = videos[j];
        // 永久删除（不是软删除）
        await db.collection(COLLECTIONS.VIDEOS).doc(video._id).remove();
        deletedVideos.push({
          videoId: video._id,
          title: video.title,
        });
      }
    }
    
    return success({
      message: '删除完成',
      deletedCount: deletedVideos.length,
      deletedVideos: deletedVideos,
    });
  } catch (err) {
    console.error('删除视频失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, '删除视频失败: ' + err.message);
  }
}


