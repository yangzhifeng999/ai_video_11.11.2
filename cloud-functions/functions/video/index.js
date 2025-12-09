/**
 * 视频云函数
 * 处理视频列表、详情、点赞、评论等
 */

const { COLLECTIONS, dbUtils, _ } = require('./shared/database');
const { success, error, paramError, unauthorized, BIZ_CODE } = require('./shared/response');
const { authenticate } = require('./shared/auth');
const { parseBody, getPath, getMethod, getQuery, generateId, handleOptionsRequest } = require('./shared/utils');

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
    // 获取视频列表
    if (path.endsWith('/videos') && method === 'GET') {
      return await handleGetVideos(query);
    }

    // 获取视频详情
    if (path.match(/\/videos\/[\w-]+$/) && method === 'GET') {
      const videoId = path.split('/').pop();
      return await handleGetVideoDetail(videoId, event);
    }

    // 点赞视频
    if (path.match(/\/videos\/[\w-]+\/like$/) && method === 'POST') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleLikeVideo(event, videoId);
    }

    // 取消点赞
    if (path.match(/\/videos\/[\w-]+\/like$/) && method === 'DELETE') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleUnlikeVideo(event, videoId);
    }

    // 不喜欢视频
    if (path.match(/\/videos\/[\w-]+\/dislike$/) && method === 'POST') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleDislikeVideo(event, videoId);
    }

    // 获取评论列表
    if (path.match(/\/videos\/[\w-]+\/comments$/) && method === 'GET') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleGetComments(videoId, query);
    }

    // 发表评论
    if (path.match(/\/videos\/[\w-]+\/comments$/) && method === 'POST') {
      const videoId = path.split('/').slice(-2, -1)[0];
      return await handleAddComment(event, videoId, body);
    }

    // 删除评论
    if (path.match(/\/videos\/[\w-]+\/comments\/[\w-]+$/) && method === 'DELETE') {
      const parts = path.split('/');
      const commentId = parts.pop();
      return await handleDeleteComment(event, commentId);
    }

    // 获取创作者信息
    if (path.match(/\/creators\/[\w-]+$/) && method === 'GET') {
      const creatorId = path.split('/').pop();
      return await handleGetCreator(creatorId);
    }

    // 获取创作者视频列表
    if (path.match(/\/creators\/[\w-]+\/videos$/) && method === 'GET') {
      const creatorId = path.split('/').slice(-2, -1)[0];
      return await handleGetCreatorVideos(creatorId, query);
    }

    // 搜索视频
    if (path.endsWith('/videos/search') && method === 'GET') {
      return await handleSearchVideos(query);
    }

    return error(BIZ_CODE.SYSTEM_ERROR, '接口不存在', 404);
  } catch (err) {
    console.error('Video error:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, err.message);
  }
};

/**
 * 获取视频列表
 */
async function handleGetVideos(query) {
  const { category, page = 1, pageSize = 20 } = query;

  // 查询已上架的视频（status 为 approved 或 published）
  const filter = {
    status: _.or(_.eq('approved'), _.eq('published')),
    deletedAt: _.exists(false),
  };

  if (category && category !== 'comprehensive') {
    filter.category = category;
  }

  const result = await dbUtils.paginate(
    COLLECTIONS.VIDEOS,
    filter,
    parseInt(page),
    parseInt(pageSize),
    { orderBy: 'createdAt', order: 'desc' }
  );

  // 获取创作者信息
  const creatorIds = [...new Set(result.list.map(v => v.creatorId))];
  if (creatorIds.length > 0) {
    const creators = await dbUtils.find(COLLECTIONS.USERS, {
      _id: _.in(creatorIds),
    });

    const creatorMap = new Map(creators.map(c => [c._id, {
      id: c._id,
      nickname: c.nickname,
      avatar: c.avatar,
    }]));

    result.list = result.list.map(v => ({
      ...v,
      id: v._id,
      creator: creatorMap.get(v.creatorId),
    }));
  }

  return success(result);
}

/**
 * 获取视频详情
 */
async function handleGetVideoDetail(videoId, event) {
  const video = await dbUtils.findById(COLLECTIONS.VIDEOS, videoId);

  if (!video || video.deletedAt) {
    return error(BIZ_CODE.VIDEO_NOT_FOUND);
  }

  // 增加浏览次数
  await dbUtils.increment(COLLECTIONS.VIDEOS, videoId, 'viewCount', 1);

  // 获取创作者信息
  const creator = await dbUtils.findById(COLLECTIONS.USERS, video.creatorId);

  // 检查当前用户是否点赞/收藏
  let isLiked = false;
  let isCollected = false;

  const authResult = await authenticate(event);
  if (authResult.authenticated) {
    const [like, collection] = await Promise.all([
      dbUtils.findOne(COLLECTIONS.LIKES, { userId: authResult.user.userId, videoId }),
      dbUtils.findOne(COLLECTIONS.COLLECTIONS, { userId: authResult.user.userId, videoId }),
    ]);
    isLiked = !!like;
    isCollected = !!collection;
  }

  return success({
    ...video,
    id: video._id,
    creator: creator ? {
      id: creator._id,
      nickname: creator.nickname,
      avatar: creator.avatar,
    } : null,
    isLiked,
    isCollected,
  });
}

/**
 * 点赞视频
 */
async function handleLikeVideo(event, videoId) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  // 检查是否已点赞
  const existing = await dbUtils.findOne(COLLECTIONS.LIKES, {
    userId: authResult.user.userId,
    videoId,
  });

  if (existing) {
    return error(BIZ_CODE.SYSTEM_ERROR, '已点赞');
  }

  // 添加点赞
  await dbUtils.create(COLLECTIONS.LIKES, {
    userId: authResult.user.userId,
    videoId,
  });

  // 更新视频点赞数
  await dbUtils.increment(COLLECTIONS.VIDEOS, videoId, 'likeCount', 1);

  return success(null, '点赞成功');
}

/**
 * 取消点赞
 */
async function handleUnlikeVideo(event, videoId) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  // 查找点赞记录
  const like = await dbUtils.findOne(COLLECTIONS.LIKES, {
    userId: authResult.user.userId,
    videoId,
  });

  if (!like) {
    return error(BIZ_CODE.SYSTEM_ERROR, '未点赞');
  }

  // 删除点赞
  await dbUtils.delete(COLLECTIONS.LIKES, like._id);

  // 更新视频点赞数
  await dbUtils.increment(COLLECTIONS.VIDEOS, videoId, 'likeCount', -1);

  return success(null, '取消点赞成功');
}

/**
 * 不喜欢视频
 */
async function handleDislikeVideo(event, videoId) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  // 更新视频不喜欢数
  await dbUtils.increment(COLLECTIONS.VIDEOS, videoId, 'dislikeCount', 1);

  return success(null, '已记录');
}

/**
 * 获取评论列表
 */
async function handleGetComments(videoId, query) {
  const { page = 1, pageSize = 20 } = query;

  const result = await dbUtils.paginate(
    COLLECTIONS.COMMENTS,
    { videoId, deletedAt: _.exists(false) },
    parseInt(page),
    parseInt(pageSize),
    { orderBy: 'createdAt', order: 'desc' }
  );

  // 获取用户信息
  const userIds = [...new Set(result.list.map(c => c.userId))];
  if (userIds.length > 0) {
    const users = await dbUtils.find(COLLECTIONS.USERS, {
      _id: _.in(userIds),
    });

    const userMap = new Map(users.map(u => [u._id, {
      id: u._id,
      nickname: u.nickname,
      avatar: u.avatar,
    }]));

    result.list = result.list.map(c => ({
      ...c,
      id: c._id,
      user: userMap.get(c.userId),
    }));
  }

  return success(result);
}

/**
 * 发表评论
 */
async function handleAddComment(event, videoId, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { content } = body;
  if (!content || content.trim().length === 0) {
    return paramError('评论内容不能为空');
  }

  if (content.length > 500) {
    return paramError('评论内容不能超过500字');
  }

  // 创建评论
  const commentId = await dbUtils.create(COLLECTIONS.COMMENTS, {
    videoId,
    userId: authResult.user.userId,
    content: content.trim(),
    likeCount: 0,
  });

  // 获取用户信息
  const user = await dbUtils.findById(COLLECTIONS.USERS, authResult.user.userId);

  return success({
    id: commentId,
    videoId,
    userId: authResult.user.userId,
    content: content.trim(),
    likeCount: 0,
    createdAt: new Date().toISOString(),
    user: {
      id: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
    },
  }, '评论成功');
}

/**
 * 删除评论
 */
async function handleDeleteComment(event, commentId) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const comment = await dbUtils.findById(COLLECTIONS.COMMENTS, commentId);
  if (!comment) {
    return error(BIZ_CODE.SYSTEM_ERROR, '评论不存在');
  }

  // 检查是否是评论作者
  if (comment.userId !== authResult.user.userId) {
    return error(BIZ_CODE.AUTH_FAILED, '无权删除');
  }

  // 软删除评论
  await dbUtils.softDelete(COLLECTIONS.COMMENTS, commentId);

  return success(null, '删除成功');
}

/**
 * 获取创作者信息
 */
async function handleGetCreator(creatorId) {
  const creator = await dbUtils.findById(COLLECTIONS.USERS, creatorId);

  if (!creator || !creator.isCreator) {
    return error(BIZ_CODE.USER_NOT_FOUND, '创作者不存在');
  }

  // 获取作品数、粉丝数
  const [videoCount, followerCount] = await Promise.all([
    dbUtils.count(COLLECTIONS.VIDEOS, { creatorId, status: 'approved' }),
    dbUtils.count(COLLECTIONS.FOLLOWS, { followingId: creatorId }),
  ]);

  return success({
    id: creator._id,
    nickname: creator.nickname,
    avatar: creator.avatar,
    bio: creator.bio,
    videoCount,
    followerCount,
    createdAt: creator.createdAt,
  });
}

/**
 * 获取创作者视频列表
 */
async function handleGetCreatorVideos(creatorId, query) {
  const { page = 1, pageSize = 20 } = query;

  const result = await dbUtils.paginate(
    COLLECTIONS.VIDEOS,
    { creatorId, status: 'approved', deletedAt: _.exists(false) },
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
 * 搜索视频
 */
async function handleSearchVideos(query) {
  const { keyword, page = 1, pageSize = 20 } = query;

  if (!keyword) {
    return paramError('请输入搜索关键词');
  }

  // 使用正则进行模糊搜索
  const filter = {
    status: 'approved',
    deletedAt: _.exists(false),
    $or: [
      { title: new RegExp(keyword, 'i') },
      { description: new RegExp(keyword, 'i') },
    ],
  };

  const result = await dbUtils.paginate(
    COLLECTIONS.VIDEOS,
    filter,
    parseInt(page),
    parseInt(pageSize),
    { orderBy: 'createdAt', order: 'desc' }
  );

  // 获取创作者信息
  const creatorIds = [...new Set(result.list.map(v => v.creatorId))];
  if (creatorIds.length > 0) {
    const creators = await dbUtils.find(COLLECTIONS.USERS, {
      _id: _.in(creatorIds),
    });

    const creatorMap = new Map(creators.map(c => [c._id, {
      id: c._id,
      nickname: c.nickname,
      avatar: c.avatar,
    }]));

    result.list = result.list.map(v => ({
      ...v,
      id: v._id,
      creator: creatorMap.get(v.creatorId),
    }));
  }

  return success(result);
}

