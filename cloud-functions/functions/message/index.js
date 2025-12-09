/**
 * 消息云函数
 * 处理用户消息的获取、标记已读、删除等操作
 */

const { COLLECTIONS, dbUtils, _, db } = require('./shared/database');
const { success, error, paramError, forbidden, BIZ_CODE } = require('./shared/response');
const { authenticateUser } = require('./shared/auth');
const { parseBody, getPath, getMethod, getQuery, handleOptionsRequest } = require('./shared/utils');

/**
 * 主处理函数
 */
exports.main = async (event, context) => {
  // 处理 OPTIONS 预检请求（CORS）
  if (getMethod(event) === 'OPTIONS') {
    return handleOptionsRequest();
  }

  var path = getPath(event);
  var method = getMethod(event);
  var body = parseBody(event);
  var query = getQuery(event);

  try {
    // 需要认证的接口
    var authResult = await authenticateUser(event);
    if (!authResult.success) {
      return forbidden(authResult.message || '请先登录');
    }
    
    var userId = (authResult.user && authResult.user.userId) || (authResult.user && authResult.user._id);
    if (!userId) {
      return forbidden('用户信息无效');
    }

    // ===== 消息列表 =====
    if (path.endsWith('/messages') && method === 'GET') {
      return await handleGetMessages(userId, query);
    }

    // ===== 消息详情 =====
    if (path.match(/\/messages\/[\w-]+$/) && method === 'GET' && !path.includes('/read')) {
      var messageId = path.split('/').pop();
      return await handleGetMessage(userId, messageId);
    }

    // ===== 标记已读 =====
    if (path.match(/\/messages\/[\w-]+\/read$/) && method === 'POST') {
      var messageId = path.split('/').slice(-2, -1)[0];
      return await handleMarkRead(userId, messageId);
    }

    // ===== 标记全部已读 =====
    if (path.endsWith('/messages/read-all') && method === 'POST') {
      return await handleMarkAllRead(userId, body);
    }

    // ===== 删除消息 =====
    if (path.match(/\/messages\/[\w-]+$/) && method === 'DELETE') {
      var messageId = path.split('/').pop();
      return await handleDeleteMessage(userId, messageId);
    }

    // ===== 获取未读数量 =====
    if (path.endsWith('/messages/unread-count') && method === 'GET') {
      return await handleGetUnreadCount(userId);
    }

    return error(BIZ_CODE.NOT_FOUND, '接口不存在');
  } catch (err) {
    console.error('消息处理错误:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, '服务器内部错误: ' + err.message);
  }
};

/**
 * 获取消息列表
 */
async function handleGetMessages(userId, query) {
  var page = parseInt(query.page) || 1;
  var pageSize = parseInt(query.pageSize) || 20;
  var type = query.type; // system | order | announcement | interaction

  var filter = {
    userId: userId,
    deletedAt: _.exists(false),
  };

  // 按类型筛选
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

  // 格式化消息数据
  var messageList = [];
  for (var i = 0; i < result.list.length; i++) {
    var msg = result.list[i];
    messageList.push({
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
    });
  }

  result.list = messageList;
  return success(result);
}

/**
 * 获取消息详情
 */
async function handleGetMessage(userId, messageId) {
  var message = await dbUtils.findById(COLLECTIONS.MESSAGES, messageId);
  
  if (!message) {
    return error(BIZ_CODE.NOT_FOUND, '消息不存在');
  }

  if (message.userId !== userId) {
    return forbidden('无权查看此消息');
  }

  // 自动标记为已读
  if (!message.isRead) {
    await dbUtils.update(COLLECTIONS.MESSAGES, messageId, { isRead: true });
  }

  return success({
    id: message._id,
    type: message.type || 'system',
    title: message.title,
    content: message.content,
    read: true,
    timestamp: formatTimestamp(message.createdAt),
    createdAt: message.createdAt,
    videoId: message.videoId,
    orderId: message.orderId,
    extra: message.extra,
  });
}

/**
 * 标记消息已读
 */
async function handleMarkRead(userId, messageId) {
  var message = await dbUtils.findById(COLLECTIONS.MESSAGES, messageId);
  
  if (!message) {
    return error(BIZ_CODE.NOT_FOUND, '消息不存在');
  }

  if (message.userId !== userId) {
    return forbidden('无权操作此消息');
  }

  await dbUtils.update(COLLECTIONS.MESSAGES, messageId, { isRead: true });

  return success({ message: '已标记为已读' });
}

/**
 * 标记全部已读
 */
async function handleMarkAllRead(userId, body) {
  var type = body.type; // 可选，按类型标记

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
async function handleDeleteMessage(userId, messageId) {
  var message = await dbUtils.findById(COLLECTIONS.MESSAGES, messageId);
  
  if (!message) {
    return error(BIZ_CODE.NOT_FOUND, '消息不存在');
  }

  if (message.userId !== userId) {
    return forbidden('无权操作此消息');
  }

  await dbUtils.softDelete(COLLECTIONS.MESSAGES, messageId);

  return success({ message: '删除成功' });
}

/**
 * 获取未读消息数量
 */
async function handleGetUnreadCount(userId) {
  // 获取各类型的未读数量
  var filter = {
    userId: userId,
    isRead: false,
    deletedAt: _.exists(false),
  };

  var total = await dbUtils.count(COLLECTIONS.MESSAGES, filter);

  // 分类统计
  var systemCount = await dbUtils.count(COLLECTIONS.MESSAGES, { ...filter, type: 'system' });
  var orderCount = await dbUtils.count(COLLECTIONS.MESSAGES, { ...filter, type: 'order' });
  var announcementCount = await dbUtils.count(COLLECTIONS.MESSAGES, { ...filter, type: 'announcement' });
  var interactionCount = await dbUtils.count(COLLECTIONS.MESSAGES, { ...filter, type: 'interaction' });

  return success({
    total: total,
    system: systemCount,
    order: orderCount,
    announcement: announcementCount,
    interaction: interactionCount,
  });
}

/**
 * 格式化时间戳
 */
function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  
  var date = new Date(dateStr);
  var now = new Date();
  var diff = now.getTime() - date.getTime();
  
  // 今天
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    var hours = date.getHours().toString().padStart(2, '0');
    var minutes = date.getMinutes().toString().padStart(2, '0');
    return hours + ':' + minutes;
  }
  
  // 昨天
  var yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && 
      date.getMonth() === yesterday.getMonth() && 
      date.getFullYear() === yesterday.getFullYear()) {
    return '昨天';
  }
  
  // 今年内
  if (date.getFullYear() === now.getFullYear()) {
    return (date.getMonth() + 1) + '-' + date.getDate();
  }
  
  // 其他
  return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
}

