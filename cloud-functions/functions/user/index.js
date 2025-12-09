/**
 * 用户云函数
 * 处理用户信息、积分、收藏、关注等
 */

const { COLLECTIONS, dbUtils, _ } = require('./shared/database');
const { success, error, paramError, unauthorized, BIZ_CODE } = require('./shared/response');
const { authenticate } = require('./shared/auth');
const { parseBody, getPath, getMethod, getQuery, matchRoute, handleOptionsRequest } = require('./shared/utils');

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
    // 获取个人信息
    if (path.endsWith('/user/profile') && method === 'GET') {
      return await handleGetProfile(event);
    }

    // 更新个人信息
    if (path.endsWith('/user/profile') && method === 'PUT') {
      return await handleUpdateProfile(event, body);
    }

    // 获取积分
    if (path.endsWith('/user/points') && method === 'GET') {
      return await handleGetPoints(event);
    }

    // 获取积分记录
    if (path.endsWith('/user/points/records') && method === 'GET') {
      return await handleGetPointRecords(event, query);
    }

    // 每日签到
    if (path.endsWith('/user/check-in') && method === 'POST') {
      return await handleCheckIn(event);
    }

    // 获取收藏列表
    if (path.endsWith('/user/collections') && method === 'GET') {
      return await handleGetCollections(event, query);
    }

    // 添加收藏
    if (path.endsWith('/user/collections') && method === 'POST') {
      return await handleAddCollection(event, body);
    }

    // 取消收藏
    if (path.match(/\/user\/collections\/\w+$/) && method === 'DELETE') {
      const videoId = path.split('/').pop();
      return await handleRemoveCollection(event, videoId);
    }

    // 获取关注列表
    if (path.endsWith('/user/following') && method === 'GET') {
      return await handleGetFollowing(event, query);
    }

    // 关注用户
    if (path.endsWith('/user/follow') && method === 'POST') {
      return await handleFollow(event, body);
    }

    // 取消关注
    if (path.endsWith('/user/unfollow') && method === 'POST') {
      return await handleUnfollow(event, body);
    }

    // 获取粉丝列表
    if (path.endsWith('/user/followers') && method === 'GET') {
      return await handleGetFollowers(event, query);
    }

    // 申请成为创作者
    if (path.endsWith('/user/become-creator') && method === 'POST') {
      return await handleBecomeCreator(event, body);
    }

    // 获取用户统计数据
    if (path.endsWith('/user/stats') && method === 'GET') {
      return await handleGetStats(event);
    }

    // ===== 消息相关接口 =====
    // 获取消息列表
    if (path.endsWith('/user/messages') && method === 'GET') {
      return await handleGetMessages(event, query);
    }

    // 获取未读消息数量
    if (path.endsWith('/user/messages/unread-count') && method === 'GET') {
      return await handleGetUnreadCount(event);
    }

    // 标记全部已读
    if (path.endsWith('/user/messages/read-all') && method === 'POST') {
      return await handleMarkAllRead(event, body);
    }

    // 标记单条消息已读
    if (path.match(/\/user\/messages\/[\w-]+\/read$/) && method === 'POST') {
      var messageId = path.split('/').slice(-2, -1)[0];
      return await handleMarkRead(event, messageId);
    }

    // 删除消息
    if (path.match(/\/user\/messages\/[\w-]+$/) && method === 'DELETE') {
      var messageId = path.split('/').pop();
      return await handleDeleteMessage(event, messageId);
    }

    return error(BIZ_CODE.SYSTEM_ERROR, '接口不存在', 404);
  } catch (err) {
    console.error('User error:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, err.message);
  }
};

/**
 * 获取个人信息
 */
async function handleGetProfile(event) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const user = await dbUtils.findById(COLLECTIONS.USERS, authResult.user.userId);
  if (!user) {
    return error(BIZ_CODE.USER_NOT_FOUND);
  }

  // 排除敏感信息
  const { password, ...userInfo } = user;

  // 确保返回 id 字段（前端使用 id 而不是 _id）
  return success({
    ...userInfo,
    id: user._id,
  });
}

/**
 * 更新个人信息
 */
async function handleUpdateProfile(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { nickname, avatar, bio, gender, birthday } = body;

  const updateData = {};
  if (nickname !== undefined) updateData.nickname = nickname;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (bio !== undefined) updateData.bio = bio;
  if (gender !== undefined) updateData.gender = gender;
  if (birthday !== undefined) updateData.birthday = birthday;

  if (Object.keys(updateData).length === 0) {
    return paramError('没有需要更新的字段');
  }

  await dbUtils.update(COLLECTIONS.USERS, authResult.user.userId, updateData);

  const user = await dbUtils.findById(COLLECTIONS.USERS, authResult.user.userId);
  const { password, ...userInfo } = user;

  // 确保返回 id 字段（前端使用 id 而不是 _id）
  return success({
    ...userInfo,
    id: user._id,
  }, '更新成功');
}

/**
 * 获取积分
 */
async function handleGetPoints(event) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const user = await dbUtils.findById(COLLECTIONS.USERS, authResult.user.userId);
  if (!user) {
    return error(BIZ_CODE.USER_NOT_FOUND);
  }

  return success({
    points: user.points || 0,
    todayCheckedIn: await checkTodayCheckIn(authResult.user.userId),
  });
}

/**
 * 检查今日是否已签到
 */
async function checkTodayCheckIn(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const record = await dbUtils.findOne(COLLECTIONS.POINT_RECORDS, {
    userId,
    type: 'earn',
    reason: '每日签到',
    createdAt: _.gte(todayStr),
  });

  return !!record;
}

/**
 * 获取积分记录
 */
async function handleGetPointRecords(event, query) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const page = parseInt(query.page) || 1;
  const pageSize = parseInt(query.pageSize) || 20;

  const result = await dbUtils.paginate(
    COLLECTIONS.POINT_RECORDS,
    { userId: authResult.user.userId },
    page,
    pageSize,
    { orderBy: 'createdAt', order: 'desc' }
  );

  return success(result);
}

/**
 * 每日签到
 */
async function handleCheckIn(event) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  // 检查今日是否已签到
  if (await checkTodayCheckIn(authResult.user.userId)) {
    return error(BIZ_CODE.SYSTEM_ERROR, '今日已签到');
  }

  // 获取用户当前积分
  const user = await dbUtils.findById(COLLECTIONS.USERS, authResult.user.userId);
  const currentPoints = user.points || 0;
  const earnPoints = 10; // 签到奖励积分

  // 更新积分
  await dbUtils.update(COLLECTIONS.USERS, authResult.user.userId, {
    points: currentPoints + earnPoints,
  });

  // 记录积分变动
  await dbUtils.create(COLLECTIONS.POINT_RECORDS, {
    userId: authResult.user.userId,
    type: 'earn',
    amount: earnPoints,
    reason: '每日签到',
    balance: currentPoints + earnPoints,
  });

  return success({
    earnPoints,
    totalPoints: currentPoints + earnPoints,
  }, '签到成功');
}

/**
 * 获取收藏列表
 */
async function handleGetCollections(event, query) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const page = parseInt(query.page) || 1;
  const pageSize = parseInt(query.pageSize) || 20;

  const result = await dbUtils.paginate(
    COLLECTIONS.COLLECTIONS,
    { userId: authResult.user.userId },
    page,
    pageSize,
    { orderBy: 'createdAt', order: 'desc' }
  );

  // 获取视频详情
  const videoIds = result.list.map(c => c.videoId);
  if (videoIds.length > 0) {
    const videos = await dbUtils.find(COLLECTIONS.VIDEOS, {
      _id: _.in(videoIds),
    });

    const videoMap = new Map(videos.map(v => [v._id, v]));
    result.list = result.list.map(c => ({
      ...c,
      video: videoMap.get(c.videoId),
    }));
  }

  return success(result);
}

/**
 * 添加收藏
 */
async function handleAddCollection(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { videoId } = body;
  if (!videoId) {
    return paramError('videoId不能为空');
  }

  // 检查是否已收藏
  const existing = await dbUtils.findOne(COLLECTIONS.COLLECTIONS, {
    userId: authResult.user.userId,
    videoId,
  });

  if (existing) {
    return error(BIZ_CODE.SYSTEM_ERROR, '已收藏');
  }

  // 添加收藏
  await dbUtils.create(COLLECTIONS.COLLECTIONS, {
    userId: authResult.user.userId,
    videoId,
  });

  // 更新视频收藏数
  await dbUtils.increment(COLLECTIONS.VIDEOS, videoId, 'collectCount', 1);

  return success(null, '收藏成功');
}

/**
 * 取消收藏
 */
async function handleRemoveCollection(event, videoId) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  // 查找收藏记录
  const collection = await dbUtils.findOne(COLLECTIONS.COLLECTIONS, {
    userId: authResult.user.userId,
    videoId,
  });

  if (!collection) {
    return error(BIZ_CODE.SYSTEM_ERROR, '未收藏');
  }

  // 删除收藏
  await dbUtils.delete(COLLECTIONS.COLLECTIONS, collection._id);

  // 更新视频收藏数
  await dbUtils.increment(COLLECTIONS.VIDEOS, videoId, 'collectCount', -1);

  return success(null, '取消收藏成功');
}

/**
 * 获取关注列表
 */
async function handleGetFollowing(event, query) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const page = parseInt(query.page) || 1;
  const pageSize = parseInt(query.pageSize) || 20;

  const result = await dbUtils.paginate(
    COLLECTIONS.FOLLOWS,
    { followerId: authResult.user.userId },
    page,
    pageSize,
    { orderBy: 'createdAt', order: 'desc' }
  );

  // 获取用户详情
  const userIds = result.list.map(f => f.followingId);
  if (userIds.length > 0) {
    const users = await dbUtils.find(COLLECTIONS.USERS, {
      _id: _.in(userIds),
    });

    const userMap = new Map(users.map(u => [u._id, {
      _id: u._id,
      nickname: u.nickname,
      avatar: u.avatar,
    }]));

    result.list = result.list.map(f => ({
      ...f,
      user: userMap.get(f.followingId),
    }));
  }

  return success(result);
}

/**
 * 关注用户
 */
async function handleFollow(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { userId } = body;
  if (!userId) {
    return paramError('userId不能为空');
  }

  if (userId === authResult.user.userId) {
    return error(BIZ_CODE.SYSTEM_ERROR, '不能关注自己');
  }

  // 检查是否已关注
  const existing = await dbUtils.findOne(COLLECTIONS.FOLLOWS, {
    followerId: authResult.user.userId,
    followingId: userId,
  });

  if (existing) {
    return error(BIZ_CODE.SYSTEM_ERROR, '已关注');
  }

  // 添加关注
  await dbUtils.create(COLLECTIONS.FOLLOWS, {
    followerId: authResult.user.userId,
    followingId: userId,
  });

  return success(null, '关注成功');
}

/**
 * 取消关注
 */
async function handleUnfollow(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { userId } = body;
  if (!userId) {
    return paramError('userId不能为空');
  }

  // 查找关注记录
  const follow = await dbUtils.findOne(COLLECTIONS.FOLLOWS, {
    followerId: authResult.user.userId,
    followingId: userId,
  });

  if (!follow) {
    return error(BIZ_CODE.SYSTEM_ERROR, '未关注');
  }

  // 删除关注
  await dbUtils.delete(COLLECTIONS.FOLLOWS, follow._id);

  return success(null, '取消关注成功');
}

/**
 * 获取粉丝列表
 */
async function handleGetFollowers(event, query) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const page = parseInt(query.page) || 1;
  const pageSize = parseInt(query.pageSize) || 20;

  const result = await dbUtils.paginate(
    COLLECTIONS.FOLLOWS,
    { followingId: authResult.user.userId },
    page,
    pageSize,
    { orderBy: 'createdAt', order: 'desc' }
  );

  // 获取用户详情
  const userIds = result.list.map(f => f.followerId);
  if (userIds.length > 0) {
    const users = await dbUtils.find(COLLECTIONS.USERS, {
      _id: _.in(userIds),
    });

    const userMap = new Map(users.map(u => [u._id, {
      _id: u._id,
      nickname: u.nickname,
      avatar: u.avatar,
    }]));

    result.list = result.list.map(f => ({
      ...f,
      user: userMap.get(f.followerId),
    }));
  }

  return success(result);
}

/**
 * 申请成为创作者
 */
async function handleBecomeCreator(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const user = await dbUtils.findById(COLLECTIONS.USERS, authResult.user.userId);
  if (user.isCreator) {
    return error(BIZ_CODE.SYSTEM_ERROR, '已是创作者');
  }

  // 更新用户为创作者
  await dbUtils.update(COLLECTIONS.USERS, authResult.user.userId, {
    isCreator: true,
    creatorAppliedAt: new Date().toISOString(),
  });

  return success(null, '申请成功，您已成为创作者');
}

/**
 * 获取用户统计数据
 */
async function handleGetStats(event) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const userId = authResult.user.userId;

  const [followingCount, followerCount, likeCount, collectionCount] = await Promise.all([
    dbUtils.count(COLLECTIONS.FOLLOWS, { followerId: userId }),
    dbUtils.count(COLLECTIONS.FOLLOWS, { followingId: userId }),
    dbUtils.count(COLLECTIONS.LIKES, { userId }),
    dbUtils.count(COLLECTIONS.COLLECTIONS, { userId }),
  ]);

  return success({
    followingCount,
    followerCount,
    likeCount,
    collectionCount,
  });
}

// ===== 消息相关处理函数 =====

/**
 * 获取消息列表
 */
async function handleGetMessages(event, query) {
  var authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  var userId = authResult.user.userId;
  var page = parseInt(query.page) || 1;
  var pageSize = parseInt(query.pageSize) || 20;
  var type = query.type;

  var filter = {
    userId: userId,
    deletedAt: _.exists(false),
  };

  if (type && type !== 'all') {
    filter.type = type;
  }

  var result = await dbUtils.paginate(
    COLLECTIONS.MESSAGES,
    filter,
    page,
    pageSize,
    { orderBy: 'createdAt', order: 'desc' }
  );

  var messageList = result.list.map(function(msg) {
    return {
      id: msg._id,
      type: msg.type || 'system',
      title: msg.title,
      content: msg.content,
      read: msg.isRead || false,
      timestamp: formatTimestamp(msg.createdAt),
      createdAt: msg.createdAt,
      videoId: msg.videoId,
      orderId: msg.orderId,
      extra: msg.extra,
    };
  });

  result.list = messageList;
  return success(result);
}

/**
 * 获取未读消息数量
 */
async function handleGetUnreadCount(event) {
  var authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  var userId = authResult.user.userId;
  var filter = {
    userId: userId,
    isRead: false,
    deletedAt: _.exists(false),
  };

  var total = await dbUtils.count(COLLECTIONS.MESSAGES, filter);
  var systemCount = await dbUtils.count(COLLECTIONS.MESSAGES, Object.assign({}, filter, { type: 'system' }));
  var orderCount = await dbUtils.count(COLLECTIONS.MESSAGES, Object.assign({}, filter, { type: 'order' }));
  var announcementCount = await dbUtils.count(COLLECTIONS.MESSAGES, Object.assign({}, filter, { type: 'announcement' }));
  var interactionCount = await dbUtils.count(COLLECTIONS.MESSAGES, Object.assign({}, filter, { type: 'interaction' }));

  return success({
    total: total,
    system: systemCount,
    order: orderCount,
    announcement: announcementCount,
    interaction: interactionCount,
  });
}

/**
 * 标记消息已读
 */
async function handleMarkRead(event, messageId) {
  var authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  var userId = authResult.user.userId;
  var message = await dbUtils.findById(COLLECTIONS.MESSAGES, messageId);
  
  if (!message) {
    return error(BIZ_CODE.SYSTEM_ERROR, '消息不存在');
  }

  if (message.userId !== userId) {
    return error(BIZ_CODE.SYSTEM_ERROR, '无权操作此消息');
  }

  await dbUtils.update(COLLECTIONS.MESSAGES, messageId, { isRead: true });
  return success({ message: '已标记为已读' });
}

/**
 * 标记全部已读
 */
async function handleMarkAllRead(event, body) {
  var authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  var userId = authResult.user.userId;
  var type = body.type;

  var filter = {
    userId: userId,
    isRead: false,
  };

  if (type && type !== 'all') {
    filter.type = type;
  }

  await dbUtils.updateWhere(COLLECTIONS.MESSAGES, filter, { isRead: true });
  return success({ message: '已全部标记为已读' });
}

/**
 * 删除消息
 */
async function handleDeleteMessage(event, messageId) {
  var authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  var userId = authResult.user.userId;
  var message = await dbUtils.findById(COLLECTIONS.MESSAGES, messageId);
  
  if (!message) {
    return error(BIZ_CODE.SYSTEM_ERROR, '消息不存在');
  }

  if (message.userId !== userId) {
    return error(BIZ_CODE.SYSTEM_ERROR, '无权操作此消息');
  }

  await dbUtils.softDelete(COLLECTIONS.MESSAGES, messageId);
  return success({ message: '删除成功' });
}

/**
 * 格式化时间戳（转换为北京时间 UTC+8）
 */
function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  
  var date = new Date(dateStr);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  
  // 转换为北京时间 (UTC+8)
  var beijingOffset = 8 * 60 * 60 * 1000; // 8小时的毫秒数
  var beijingDate = new Date(date.getTime() + beijingOffset);
  var beijingNow = new Date(Date.now() + beijingOffset);
  
  var diff = beijingNow.getTime() - beijingDate.getTime();
  
  // 今天（使用 UTC 日期比较，因为已经加了偏移）
  if (diff >= 0 && diff < 24 * 60 * 60 * 1000 && 
      beijingDate.getUTCDate() === beijingNow.getUTCDate() &&
      beijingDate.getUTCMonth() === beijingNow.getUTCMonth() &&
      beijingDate.getUTCFullYear() === beijingNow.getUTCFullYear()) {
    var hours = beijingDate.getUTCHours();
    var minutes = beijingDate.getUTCMinutes();
    var hoursStr = hours < 10 ? '0' + hours : '' + hours;
    var minutesStr = minutes < 10 ? '0' + minutes : '' + minutes;
    return hoursStr + ':' + minutesStr;
  }
  
  // 昨天
  var yesterdayBeijing = new Date(beijingNow.getTime() - 24 * 60 * 60 * 1000);
  if (beijingDate.getUTCDate() === yesterdayBeijing.getUTCDate() && 
      beijingDate.getUTCMonth() === yesterdayBeijing.getUTCMonth() && 
      beijingDate.getUTCFullYear() === yesterdayBeijing.getUTCFullYear()) {
    return '昨天';
  }
  
  // 今年内
  if (beijingDate.getUTCFullYear() === beijingNow.getUTCFullYear()) {
    return (beijingDate.getUTCMonth() + 1) + '月' + beijingDate.getUTCDate() + '日';
  }
  
  // 其他年份
  return beijingDate.getUTCFullYear() + '年' + (beijingDate.getUTCMonth() + 1) + '月' + beijingDate.getUTCDate() + '日';
}

