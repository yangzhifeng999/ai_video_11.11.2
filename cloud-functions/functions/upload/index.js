/**
 * 上传云函数
 * 处理文件上传签名、创建作品等
 */

const { COLLECTIONS, dbUtils, _ } = require('./shared/database');
const { success, error, paramError, unauthorized, BIZ_CODE } = require('./shared/response');
const { authenticate } = require('./shared/auth');
const { parseBody, getPath, getMethod, generateId, handleOptionsRequest } = require('./shared/utils');
const { cosService, vodService } = require('./shared/tencent');
const { taskManager, TASK_STATUS, TASK_TYPE } = require('./shared/taskManager');

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

  try {
    // 获取COS上传签名
    if (path.endsWith('/upload/cos-sign') && method === 'POST') {
      return await handleGetCOSSign(event, body);
    }

    // 设置COS对象为公共读（上传完成后调用）
    if (path.endsWith('/upload/cos-set-public') && method === 'POST') {
      return await handleSetCOSPublic(event, body);
    }

    // 获取VOD上传签名
    if (path.endsWith('/upload/vod-sign') && method === 'POST') {
      return await handleGetVODSign(event);
    }

    // 确认VOD上传完成
    if (path.endsWith('/upload/vod-commit') && method === 'POST') {
      return await handleVODCommit(event, body);
    }

    // 创建视频作品
    if (path.endsWith('/upload/create-video') && method === 'POST') {
      return await handleCreateVideo(event, body);
    }

    // 更新视频作品
    if (path.match(/\/upload\/videos\/[\w-]+$/) && method === 'PUT') {
      const videoId = path.split('/').pop();
      return await handleUpdateVideo(event, videoId, body);
    }

    // 删除视频作品
    if (path.match(/\/upload\/videos\/[\w-]+$/) && method === 'DELETE') {
      const videoId = path.split('/').pop();
      return await handleDeleteVideo(event, videoId);
    }

    // 获取我的作品列表
    if (path.endsWith('/upload/my-works') && method === 'GET') {
      return await handleGetMyWorks(event);
    }

    // 上架/下架视频
    if (path.match(/\/upload\/videos\/[\w-]+\/status$/) && method === 'PUT') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleUpdateVideoStatus(event, videoId, body);
    }

    // ========== AI 换脸任务相关接口 ==========
    
    // 创建 AI 换脸任务
    if (path.endsWith('/upload/create-task') && method === 'POST') {
      return await handleCreateFaceSwapTask(event, body);
    }

    // 查询任务状态
    if (path.endsWith('/upload/task-status') && method === 'POST') {
      return await handleGetTaskStatus(event, body);
    }

    // 获取任务列表
    if (path.endsWith('/upload/my-tasks') && method === 'GET') {
      return await handleGetMyTasks(event);
    }

    // 取消任务
    if (path.match(/\/upload\/tasks\/[\w-]+\/cancel$/) && method === 'POST') {
      const taskId = path.split('/').slice(-2, -1)[0];
      return await handleCancelTask(event, taskId);
    }

    return error(BIZ_CODE.SYSTEM_ERROR, '接口不存在', 404);
  } catch (err) {
    console.error('Upload error:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, err.message);
  }
};

/**
 * 获取COS上传签名
 */
async function handleGetCOSSign(event, body) {
  const authResult = await authenticate(event);
  
  // 获取用户ID：支持普通用户和管理员
  var userId = 'anonymous';
  if (authResult.authenticated && authResult.user) {
    userId = authResult.user.userId || authResult.user._id || authResult.user.id || 'admin';
  }

  const { fileName, contentType = 'image/jpeg', category = 'faces' } = body;

  if (!fileName) {
    return paramError('fileName不能为空');
  }

  // 生成存储路径
  const ext = fileName.split('.').pop();
  const key = `${category}/${userId}/${generateId()}.${ext}`;

  try {
    const signResult = await cosService.getUploadSign(key, contentType);
    return success(signResult);
  } catch (err) {
    console.error('获取COS签名失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, '获取上传签名失败');
  }
}

/**
 * 获取VOD上传签名
 */
async function handleGetVODSign(event) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  // 获取用户信息，如果不是创作者则自动升级为创作者
  const user = await dbUtils.findById(COLLECTIONS.USERS, authResult.user.userId);
  if (user && !user.isCreator) {
    await dbUtils.update(COLLECTIONS.USERS, authResult.user.userId, {
      isCreator: true,
    });
    console.log('[Upload] 用户已自动升级为创作者:', authResult.user.userId);
  }

  try {
    const signResult = await vodService.getUploadSign();
    return success(signResult);
  } catch (err) {
    console.error('获取VOD签名失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, '获取上传签名失败');
  }
}

/**
 * 确认VOD上传完成
 */
async function handleVODCommit(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { vodSessionKey } = body;

  if (!vodSessionKey) {
    return paramError('vodSessionKey不能为空');
  }

  try {
    const result = await vodService.commitUpload(vodSessionKey);
    return success(result);
  } catch (err) {
    console.error('确认VOD上传失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, '确认上传失败');
  }
}

/**
 * 创建视频作品或文案创意
 */
async function handleCreateVideo(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  // 获取用户信息，如果不是创作者则自动升级为创作者
  const user = await dbUtils.findById(COLLECTIONS.USERS, authResult.user.userId);
  if (user && !user.isCreator) {
    await dbUtils.update(COLLECTIONS.USERS, authResult.user.userId, {
      isCreator: true,
    });
    console.log('[Upload] 用户已自动升级为创作者:', authResult.user.userId);
  }

  const { 
    title, 
    description, 
    content,  // 文案内容
    category, 
    price, 
    videoUrl, 
    coverUrl,
    comparisonVideoUrl,
    uploadConfig,
    contentType,  // 'video' 或 'text'
    ideaType,
    requirements,
    expectedDifficulty,
    referenceImages,
    budget,
    reviewStatus: customReviewStatus,
  } = body;

  if (!title) {
    return paramError('标题不能为空');
  }

  // 区分视频类型和文案类型
  var isTextType = contentType === 'text';

  // 视频类型需要 videoUrl
  if (!isTextType && !videoUrl) {
    return paramError('视频URL不能为空');
  }

  // 文案类型需要描述内容
  if (isTextType && !content && !description) {
    return paramError('请填写创意内容');
  }

  // 价格检查（文案类型可以没有初始价格）
  var finalPrice = 0;
  if (!isTextType) {
    if (price === undefined || price < 0) {
      return paramError('价格不能为负数');
    }
    finalPrice = parseFloat(price);
  } else if (budget) {
    finalPrice = parseFloat(budget);
  }

  // 确定初始审核状态
  // 视频类型：pending_initial（待初审）
  // 文案类型：pending_quote（待报价）
  var initialReviewStatus = isTextType ? 'pending_quote' : 'pending_initial';
  if (customReviewStatus) {
    initialReviewStatus = customReviewStatus;
  }

  // 创建记录
  const videoId = await dbUtils.create(COLLECTIONS.VIDEOS, {
    title,
    description: content || description || '',
    category: category || 'other',
    price: finalPrice,
    videoUrl: videoUrl || '',
    coverUrl: coverUrl || '',
    comparisonVideoUrl: comparisonVideoUrl || '',
    uploadConfig: uploadConfig || null,
    contentType: isTextType ? 'text' : 'video',  // 内容类型
    ideaType: ideaType || '',
    requirements: requirements || '',
    expectedDifficulty: expectedDifficulty || 'medium',
    referenceImages: referenceImages || [],
    budget: budget || null,
    creatorId: authResult.user.userId,
    status: 'pending', // 待审核（旧字段，保持兼容）
    reviewStatus: initialReviewStatus,
    viewCount: 0,
    likeCount: 0,
    dislikeCount: 0,
    collectCount: 0,
  });

  // 创建作品记录
  await dbUtils.create(COLLECTIONS.WORKS, {
    videoId,
    creatorId: authResult.user.userId,
    type: isTextType ? 'text' : 'video',
    status: 'pending',
  });

  return success({
    videoId,
    ideaId: videoId,  // 文案类型返回 ideaId
    status: 'pending',
    message: '作品已提交，等待审核',
  });
}

/**
 * 更新视频作品
 */
async function handleUpdateVideo(event, videoId, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND);
  }

  // 验证所有权
  if (video.creatorId !== authResult.user.userId) {
    return error(BIZ_CODE.AUTH_FAILED, '无权操作此视频');
  }

  const { title, description, category, price, coverUrl, uploadConfig } = body;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (price !== undefined) updateData.price = parseFloat(price);
  if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
  if (uploadConfig !== undefined) updateData.uploadConfig = uploadConfig;

  if (Object.keys(updateData).length === 0) {
    return paramError('没有需要更新的字段');
  }

  await dbUtils.update(COLLECTIONS.VIDEOS, videoId, updateData);

  return success(null, '更新成功');
}

/**
 * 删除视频作品
 */
async function handleDeleteVideo(event, videoId) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND);
  }

  // 验证所有权
  if (video.creatorId !== authResult.user.userId) {
    return error(BIZ_CODE.AUTH_FAILED, '无权操作此视频');
  }

  // 软删除
  await dbUtils.softDelete(COLLECTIONS.VIDEOS, videoId);

  // 更新作品记录
  await dbUtils.updateWhere(COLLECTIONS.WORKS, { videoId }, {
    status: 'deleted',
    deletedAt: new Date().toISOString(),
  });

  return success(null, '删除成功');
}

/**
 * 获取我的作品列表
 */
async function handleGetMyWorks(event) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const query = event.queryStringParameters || {};
  const { status, page = 1, pageSize = 20 } = query;

  const filter = {
    creatorId: authResult.user.userId,
    deletedAt: _.exists(false),
  };

  if (status) {
    filter.status = status;
  }

  const result = await dbUtils.paginate(
    COLLECTIONS.VIDEOS,
    filter,
    parseInt(page),
    parseInt(pageSize),
    { orderBy: 'createdAt', order: 'desc' }
  );

  result.list = result.list.map(v => ({
    ...v,
    id: v._id,
  }));

  return success(result);
}

/**
 * 上架/下架视频
 */
async function handleUpdateVideoStatus(event, videoId, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { status } = body;

  if (!['approved', 'offline'].includes(status)) {
    return paramError('状态值无效');
  }

  const video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);
  if (!video) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND);
  }

  // 验证所有权
  if (video.creatorId !== authResult.user.userId) {
    return error(BIZ_CODE.AUTH_FAILED, '无权操作此视频');
  }

  // 只有已审核通过的视频可以上架/下架
  if (video.status === 'pending' || video.status === 'rejected') {
    return error(BIZ_CODE.SYSTEM_ERROR, '视频未审核通过，无法操作');
  }

  await dbUtils.update(COLLECTIONS.VIDEOS, videoId, { status });

  return success(null, status === 'approved' ? '已上架' : '已下架');
}

// ========== AI 换脸任务处理函数 ==========

/**
 * 创建 AI 换脸任务
 * 
 * 请求参数：
 * - orderId: 订单 ID（已支付）
 * - videoId: 视频模板 ID
 * - inputPhotoUrl: 用户上传的照片 URL（COS）
 */
async function handleCreateFaceSwapTask(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { orderId, videoId, inputPhotoUrl } = body;

  if (!orderId) {
    return paramError('订单ID不能为空');
  }

  if (!videoId) {
    return paramError('视频模板ID不能为空');
  }

  if (!inputPhotoUrl) {
    return paramError('照片URL不能为空');
  }

  try {
    // 1. 验证订单
    const order = await dbUtils.findOne(COLLECTIONS.ORDERS, { 
      orderId, 
      userId: authResult.user.userId 
    });

    if (!order) {
      return error(BIZ_CODE.ORDER_NOT_FOUND, '订单不存在');
    }

    if (order.status !== 'paid') {
      return error(BIZ_CODE.SYSTEM_ERROR, '订单未支付或已使用');
    }

    // 2. 获取视频模板信息
    const video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);

    if (!video) {
      return error(BIZ_CODE.VIDEO_NOT_FOUND, '视频模板不存在');
    }

    if (!video.runningHubWorkflowId) {
      return error(BIZ_CODE.SYSTEM_ERROR, '视频模板未配置工作流');
    }

    // 3. 创建任务
    const taskId = await taskManager.createTask({
      userId: authResult.user.userId,
      orderId,
      videoId,
      workflowId: video.runningHubWorkflowId,
      inputPhotoUrl,
      type: TASK_TYPE.FACE_SWAP,
    });

    // 4. 更新订单状态为处理中
    await dbUtils.updateWhere(COLLECTIONS.ORDERS, { orderId }, {
      status: 'processing',
      taskId,
    });

    // 5. 获取预估时间
    const estimatedTime = await taskManager.estimateRemainingTime(video.runningHubWorkflowId);

    return success({
      taskId,
      status: TASK_STATUS.PENDING,
      estimatedTime, // 预估秒数
      message: '任务已创建，正在排队处理',
    });
  } catch (err) {
    console.error('创建换脸任务失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, err.message);
  }
}

/**
 * 查询任务状态
 */
async function handleGetTaskStatus(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { taskId } = body;

  if (!taskId) {
    return paramError('任务ID不能为空');
  }

  try {
    const task = await taskManager.getTask(taskId);

    if (!task) {
      return error(BIZ_CODE.SYSTEM_ERROR, '任务不存在');
    }

    // 验证权限
    if (task.userId !== authResult.user.userId) {
      return error(BIZ_CODE.AUTH_FAILED, '无权查看此任务');
    }

    // 返回任务信息
    return success({
      taskId: task.taskId,
      status: task.status,
      progress: task.progress,
      outputVideoUrl: task.outputVideoUrl,
      errorMessage: task.errorMessage,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      taskCostTime: task.taskCostTime,
    });
  } catch (err) {
    console.error('查询任务状态失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, err.message);
  }
}

/**
 * 获取我的任务列表
 */
async function handleGetMyTasks(event) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const query = event.queryStringParameters || {};
  const { status, page = 1, pageSize = 20 } = query;

  try {
    const result = await taskManager.getUserTasks(authResult.user.userId, {
      status,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });

    // 简化返回数据
    result.list = result.list.map(t => ({
      taskId: t.taskId,
      videoId: t.videoId,
      status: t.status,
      progress: t.progress,
      outputVideoUrl: t.outputVideoUrl,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    }));

    return success(result);
  } catch (err) {
    console.error('获取任务列表失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, err.message);
  }
}

/**
 * 取消任务
 */
async function handleCancelTask(event, taskId) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  try {
    await taskManager.cancelTask(taskId, authResult.user.userId);
    return success(null, '任务已取消');
  } catch (err) {
    console.error('取消任务失败:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, err.message);
  }
}

