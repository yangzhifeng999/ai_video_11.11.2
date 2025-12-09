/**
 * 订单云函数
 * 处理订单创建、查询、取消等
 */

const { COLLECTIONS, dbUtils, _ } = require('./shared/database');
const { success, error, paramError, unauthorized, BIZ_CODE } = require('./shared/response');
const { authenticate } = require('./shared/auth');
const { parseBody, getPath, getMethod, getQuery, generateOrderNo, toCents, handleOptionsRequest } = require('./shared/utils');
const { vodService } = require('./shared/tencent');

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
    // 获取订单列表
    if (path.endsWith('/orders') && method === 'GET') {
      return await handleGetOrders(event, query);
    }

    // 创建订单
    if (path.endsWith('/orders') && method === 'POST') {
      return await handleCreateOrder(event, body);
    }

    // 获取订单详情
    if (path.match(/\/orders\/[\w-]+$/) && method === 'GET') {
      const orderId = path.split('/').pop();
      return await handleGetOrderDetail(event, orderId);
    }

    // 取消订单
    if (path.match(/\/orders\/[\w-]+\/cancel$/) && method === 'POST') {
      const orderId = path.split('/').slice(-2, -1)[0];
      return await handleCancelOrder(event, orderId);
    }

    // 申请退款
    if (path.match(/\/orders\/[\w-]+\/refund$/) && method === 'POST') {
      const orderId = path.split('/').slice(-2, -1)[0];
      return await handleRefundOrder(event, orderId, body);
    }

    return error(BIZ_CODE.SYSTEM_ERROR, '接口不存在', 404);
  } catch (err) {
    console.error('Order error:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, err.message);
  }
};

/**
 * 获取订单列表
 */
async function handleGetOrders(event, query) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { status, page = 1, pageSize = 20 } = query;

  const filter = {
    userId: authResult.user.userId,
    deletedAt: _.exists(false),
  };

  if (status) {
    filter.status = status;
  }

  const result = await dbUtils.paginate(
    COLLECTIONS.ORDERS,
    filter,
    parseInt(page),
    parseInt(pageSize),
    { orderBy: 'createdAt', order: 'desc' }
  );

  // 获取视频信息
  const videoIds = [...new Set(result.list.map(o => o.videoId))];
  if (videoIds.length > 0) {
    const videos = await dbUtils.find(COLLECTIONS.VIDEOS, {
      _id: _.in(videoIds),
    });

    const videoMap = new Map(videos.map(v => [v._id, {
      id: v._id,
      title: v.title,
      coverUrl: v.coverUrl,
    }]));

    result.list = result.list.map(o => ({
      ...o,
      id: o._id,
      video: videoMap.get(o.videoId),
    }));
  }

  return success(result);
}

/**
 * 创建订单
 */
async function handleCreateOrder(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { videoId, faceImages, paymentMethod = 'wechat' } = body;

  if (!videoId) {
    return paramError('videoId不能为空');
  }

  if (!faceImages || faceImages.length === 0) {
    return paramError('请上传人脸照片');
  }

  // 获取视频信息
  const video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND);
  }

  // 获取用户信息
  const user = await dbUtils.findById(COLLECTIONS.USERS, authResult.user.userId);

  // 计算价格（分）
  const price = toCents(video.price);

  // 检查积分支付
  if (paymentMethod === 'points') {
    const requiredPoints = price; // 1分钱 = 1积分
    if (user.points < requiredPoints) {
      return error(BIZ_CODE.SYSTEM_ERROR, '积分不足');
    }
  }

  // 检查余额支付
  if (paymentMethod === 'balance') {
    if (user.balance < price) {
      return error(BIZ_CODE.SYSTEM_ERROR, '余额不足');
    }
  }

  // 生成订单号
  const orderNo = generateOrderNo();

  // 创建订单
  const orderId = await dbUtils.create(COLLECTIONS.ORDERS, {
    orderNo,
    userId: authResult.user.userId,
    videoId,
    type: 'ai_video',
    status: 'pending', // pending -> paid -> processing -> completed/failed
    price,
    paymentMethod,
    paymentStatus: 'unpaid',
    faceImages,
    // VOD处理相关
    vodTaskId: null,
    vodProgress: 0,
    resultVideoUrl: null,
    estimatedTime: '5-10分钟',
  });

  // 如果是积分或余额支付，直接扣除并开始处理
  if (paymentMethod === 'points') {
    const requiredPoints = price;
    
    // 扣除积分
    await dbUtils.update(COLLECTIONS.USERS, authResult.user.userId, {
      points: user.points - requiredPoints,
    });

    // 记录积分变动
    await dbUtils.create(COLLECTIONS.POINT_RECORDS, {
      userId: authResult.user.userId,
      type: 'spend',
      amount: -requiredPoints,
      reason: `购买视频：${video.title}`,
      orderId,
      balance: user.points - requiredPoints,
    });

    // 更新订单状态为已支付
    await dbUtils.update(COLLECTIONS.ORDERS, orderId, {
      status: 'processing',
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
    });

    // 提交VOD处理任务
    await submitVODTask(orderId, video, faceImages);

    return success({
      orderId,
      orderNo,
      status: 'processing',
      message: '支付成功，正在处理中',
    });
  }

  if (paymentMethod === 'balance') {
    // 扣除余额
    await dbUtils.update(COLLECTIONS.USERS, authResult.user.userId, {
      balance: user.balance - price,
    });

    // 更新订单状态为已支付
    await dbUtils.update(COLLECTIONS.ORDERS, orderId, {
      status: 'processing',
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
    });

    // 提交VOD处理任务
    await submitVODTask(orderId, video, faceImages);

    return success({
      orderId,
      orderNo,
      status: 'processing',
      message: '支付成功，正在处理中',
    });
  }

  // 微信/支付宝支付，返回订单信息，等待支付
  return success({
    orderId,
    orderNo,
    status: 'pending',
    price,
    paymentMethod,
    message: '订单创建成功，请完成支付',
  });
}

/**
 * 提交VOD处理任务
 */
async function submitVODTask(orderId, video, faceImages) {
  try {
    // 调用VOD服务创建AI换脸任务
    const taskResult = await vodService.createAITask({
      videoUrl: video.videoUrl,
      faceImages,
    });

    // 更新订单的任务ID
    await dbUtils.update(COLLECTIONS.ORDERS, orderId, {
      vodTaskId: taskResult.taskId,
      vodSubmittedAt: new Date().toISOString(),
    });

    console.log(`VOD任务已提交: ${taskResult.taskId}`);
  } catch (err) {
    console.error('提交VOD任务失败:', err);
    
    // 更新订单状态为失败
    await dbUtils.update(COLLECTIONS.ORDERS, orderId, {
      status: 'failed',
      failReason: '视频处理任务提交失败',
    });
  }
}

/**
 * 获取订单详情
 */
async function handleGetOrderDetail(event, orderId) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const order = await dbUtils.findById(COLLECTIONS.ORDERS, orderId);

  if (!order) {
    return error(BIZ_CODE.ORDER_NOT_FOUND);
  }

  // 验证订单归属
  if (order.userId !== authResult.user.userId) {
    return error(BIZ_CODE.AUTH_FAILED, '无权查看此订单');
  }

  // 获取视频信息
  const video = await dbUtils.findById(COLLECTIONS.VIDEOS, order.videoId);

  return success({
    ...order,
    id: order._id,
    video: video ? {
      id: video._id,
      title: video.title,
      coverUrl: video.coverUrl,
      price: video.price,
    } : null,
  });
}

/**
 * 取消订单
 */
async function handleCancelOrder(event, orderId) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const order = await dbUtils.findById(COLLECTIONS.ORDERS, orderId);

  if (!order) {
    return error(BIZ_CODE.ORDER_NOT_FOUND);
  }

  // 验证订单归属
  if (order.userId !== authResult.user.userId) {
    return error(BIZ_CODE.AUTH_FAILED, '无权操作此订单');
  }

  // 只有待支付的订单可以取消
  if (order.status !== 'pending') {
    return error(BIZ_CODE.SYSTEM_ERROR, '该订单无法取消');
  }

  // 更新订单状态
  await dbUtils.update(COLLECTIONS.ORDERS, orderId, {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  });

  return success(null, '订单已取消');
}

/**
 * 申请退款
 */
async function handleRefundOrder(event, orderId, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { reason } = body;

  const order = await dbUtils.findById(COLLECTIONS.ORDERS, orderId);

  if (!order) {
    return error(BIZ_CODE.ORDER_NOT_FOUND);
  }

  // 验证订单归属
  if (order.userId !== authResult.user.userId) {
    return error(BIZ_CODE.AUTH_FAILED, '无权操作此订单');
  }

  // 只有已支付但未完成的订单可以退款
  if (order.status !== 'processing' && order.status !== 'paid') {
    return error(BIZ_CODE.SYSTEM_ERROR, '该订单无法退款');
  }

  // 更新订单状态为退款中
  await dbUtils.update(COLLECTIONS.ORDERS, orderId, {
    status: 'refunding',
    refundReason: reason || '用户申请退款',
    refundAppliedAt: new Date().toISOString(),
  });

  // TODO: 调用支付平台退款接口
  // 如果是积分支付，直接退还积分
  if (order.paymentMethod === 'points') {
    const user = await dbUtils.findById(COLLECTIONS.USERS, authResult.user.userId);
    
    await dbUtils.update(COLLECTIONS.USERS, authResult.user.userId, {
      points: user.points + order.price,
    });

    await dbUtils.create(COLLECTIONS.POINT_RECORDS, {
      userId: authResult.user.userId,
      type: 'earn',
      amount: order.price,
      reason: `订单退款：${order.orderNo}`,
      orderId,
      balance: user.points + order.price,
    });

    await dbUtils.update(COLLECTIONS.ORDERS, orderId, {
      status: 'refunded',
      refundAmount: order.price,
      refundedAt: new Date().toISOString(),
    });

    return success(null, '退款成功，积分已返还');
  }

  // 如果是余额支付，直接退还余额
  if (order.paymentMethod === 'balance') {
    const user = await dbUtils.findById(COLLECTIONS.USERS, authResult.user.userId);
    
    await dbUtils.update(COLLECTIONS.USERS, authResult.user.userId, {
      balance: user.balance + order.price,
    });

    await dbUtils.update(COLLECTIONS.ORDERS, orderId, {
      status: 'refunded',
      refundAmount: order.price,
      refundedAt: new Date().toISOString(),
    });

    return success(null, '退款成功，余额已返还');
  }

  return success(null, '退款申请已提交，请等待处理');
}

