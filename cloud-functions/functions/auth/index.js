/**
 * 认证云函数
 * 处理登录、注册、微信登录、Token刷新等
 */

const { db, COLLECTIONS, dbUtils } = require('./shared/database');
const { success, error, paramError, unauthorized, BIZ_CODE } = require('./shared/response');
const { generateToken, generateRefreshToken, verifyToken } = require('./shared/auth');
const { parseBody, getPath, getMethod, hashPassword, verifyPassword, isValidPhone, generateId, handleOptionsRequest } = require('./shared/utils');

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

  // 路由分发
  try {
    // 手机号登录
    if (path.endsWith('/auth/login') && method === 'POST') {
      return await handleLogin(body);
    }

    // 注册
    if (path.endsWith('/auth/register') && method === 'POST') {
      return await handleRegister(body);
    }

    // 微信登录
    if (path.endsWith('/auth/wechat') && method === 'POST') {
      return await handleWechatLogin(body);
    }

    // 刷新 Token
    if (path.endsWith('/auth/refresh') && method === 'POST') {
      return await handleRefreshToken(body);
    }

    // 发送验证码
    if (path.endsWith('/auth/send-code') && method === 'POST') {
      return await handleSendCode(body);
    }

    // 验证码登录
    if (path.endsWith('/auth/login-code') && method === 'POST') {
      return await handleLoginWithCode(body);
    }

    return error(BIZ_CODE.SYSTEM_ERROR, '接口不存在', 404);
  } catch (err) {
    console.error('Auth error:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, err.message);
  }
};

/**
 * 手机号密码登录
 */
async function handleLogin(body) {
  const { phone, password } = body;

  if (!phone || !password) {
    return paramError('手机号和密码不能为空');
  }

  if (!isValidPhone(phone)) {
    return paramError('手机号格式不正确');
  }

  // 查询用户
  const user = await dbUtils.findOne(COLLECTIONS.USERS, { phone });

  if (!user) {
    return error(BIZ_CODE.USER_NOT_FOUND, '用户不存在');
  }

  // 验证密码
  if (!verifyPassword(password, user.password)) {
    return error(BIZ_CODE.AUTH_FAILED, '密码错误');
  }

  // 更新最后登录时间
  await dbUtils.update(COLLECTIONS.USERS, user._id, {
    lastLoginAt: new Date().toISOString(),
  });

  // 生成 Token
  const tokenPayload = {
    userId: user._id,
    phone: user.phone,
    isAdmin: user.isAdmin || false,
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // 返回用户信息（排除密码，确保包含 id 字段）
  const { password: _, ...userInfo } = user;

  return success({
    token,
    refreshToken,
    user: {
      ...userInfo,
      id: user._id,  // 前端使用 id 而不是 _id
    },
  });
}

/**
 * 注册
 */
async function handleRegister(body) {
  const { phone, password, nickname, code } = body;

  if (!phone || !password) {
    return paramError('手机号和密码不能为空');
  }

  if (!isValidPhone(phone)) {
    return paramError('手机号格式不正确');
  }

  if (password.length < 6) {
    return paramError('密码长度不能少于6位');
  }

  // TODO: 验证短信验证码
  // if (!code || !await verifyCode(phone, code)) {
  //   return paramError('验证码错误');
  // }

  // 检查用户是否已存在
  const existingUser = await dbUtils.findOne(COLLECTIONS.USERS, { phone });
  if (existingUser) {
    return error(BIZ_CODE.USER_EXISTS, '该手机号已注册');
  }

  // 创建用户
  const userId = generateId();
  const now = new Date().toISOString();

  const userData = {
    _id: userId,
    phone,
    password: hashPassword(password),
    nickname: nickname || `用户${phone.slice(-4)}`,
    avatar: '',
    points: 1000, // 新用户赠送1000积分
    balance: 0,
    isCreator: false,
    isAdmin: false,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };

  await db.collection(COLLECTIONS.USERS).add(userData);

  // 记录积分赠送
  await dbUtils.create(COLLECTIONS.POINT_RECORDS, {
    userId,
    type: 'earn',
    amount: 1000,
    reason: '新用户注册奖励',
    balance: 1000,
  });

  // 生成 Token
  const tokenPayload = {
    userId,
    phone,
    isAdmin: false,
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // 返回用户信息（排除密码，确保包含 id 字段）
  const { password: _, ...userInfo } = userData;

  return success({
    token,
    refreshToken,
    user: {
      ...userInfo,
      id: userId,  // 前端使用 id 而不是 _id
    },
  });
}

/**
 * 微信登录
 */
async function handleWechatLogin(body) {
  const { code } = body;

  if (!code) {
    return paramError('微信授权码不能为空');
  }

  // TODO: 调用微信 API 获取 openid 和 unionid
  // const wxResult = await getWechatUserInfo(code);

  // 模拟微信返回的数据
  const wxOpenId = `wx_${Date.now()}`;
  const wxUnionId = `union_${Date.now()}`;

  // 查询用户是否已存在
  let user = await dbUtils.findOne(COLLECTIONS.USERS, { wxOpenId });

  if (!user) {
    // 新用户，创建账号
    const userId = generateId();
    const now = new Date().toISOString();

    user = {
      _id: userId,
      wxOpenId,
      wxUnionId,
      nickname: '微信用户',
      avatar: '',
      points: 1000,
      balance: 0,
      isCreator: false,
      isAdmin: false,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    await db.collection(COLLECTIONS.USERS).add(user);

    // 记录积分赠送
    await dbUtils.create(COLLECTIONS.POINT_RECORDS, {
      userId,
      type: 'earn',
      amount: 1000,
      reason: '新用户注册奖励',
      balance: 1000,
    });
  } else {
    // 更新最后登录时间
    await dbUtils.update(COLLECTIONS.USERS, user._id, {
      lastLoginAt: new Date().toISOString(),
    });
  }

  // 生成 Token
  const tokenPayload = {
    userId: user._id,
    wxOpenId: user.wxOpenId,
    isAdmin: user.isAdmin || false,
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return success({
    token,
    refreshToken,
    user,
  });
}

/**
 * 刷新 Token
 */
async function handleRefreshToken(body) {
  const { refreshToken } = body;

  if (!refreshToken) {
    return paramError('refreshToken不能为空');
  }

  const result = verifyToken(refreshToken);

  if (!result.valid) {
    if (result.error === 'TOKEN_EXPIRED') {
      return error(BIZ_CODE.TOKEN_EXPIRED, 'Token已过期，请重新登录');
    }
    return error(BIZ_CODE.TOKEN_INVALID, 'Token无效');
  }

  // 查询用户是否存在
  const user = await dbUtils.findById(COLLECTIONS.USERS, result.decoded.userId);
  if (!user) {
    return error(BIZ_CODE.USER_NOT_FOUND, '用户不存在');
  }

  // 生成新 Token
  const tokenPayload = {
    userId: user._id,
    phone: user.phone,
    wxOpenId: user.wxOpenId,
    isAdmin: user.isAdmin || false,
  };

  const newToken = generateToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  return success({
    token: newToken,
    refreshToken: newRefreshToken,
  });
}

/**
 * 发送验证码
 */
async function handleSendCode(body) {
  const { phone } = body;

  if (!phone || !isValidPhone(phone)) {
    return paramError('手机号格式不正确');
  }

  // TODO: 调用短信服务发送验证码
  // 生成6位验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 存储验证码（5分钟有效期）
  // TODO: 使用 Redis 或数据库存储验证码

  console.log(`验证码: ${code} (发送到 ${phone})`);

  return success(null, '验证码发送成功');
}

/**
 * 验证码登录
 */
async function handleLoginWithCode(body) {
  const { phone, code } = body;

  if (!phone || !isValidPhone(phone)) {
    return paramError('手机号格式不正确');
  }

  if (!code) {
    return paramError('验证码不能为空');
  }

  // TODO: 验证验证码
  // if (!await verifyCode(phone, code)) {
  //   return paramError('验证码错误');
  // }

  // 查询或创建用户
  let user = await dbUtils.findOne(COLLECTIONS.USERS, { phone });

  if (!user) {
    // 新用户，自动注册
    const userId = generateId();
    const now = new Date().toISOString();

    user = {
      _id: userId,
      phone,
      nickname: `用户${phone.slice(-4)}`,
      avatar: '',
      points: 1000,
      balance: 0,
      isCreator: false,
      isAdmin: false,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    await db.collection(COLLECTIONS.USERS).add(user);

    // 记录积分赠送
    await dbUtils.create(COLLECTIONS.POINT_RECORDS, {
      userId,
      type: 'earn',
      amount: 1000,
      reason: '新用户注册奖励',
      balance: 1000,
    });
  } else {
    // 更新最后登录时间
    await dbUtils.update(COLLECTIONS.USERS, user._id, {
      lastLoginAt: new Date().toISOString(),
    });
  }

  // 生成 Token
  const tokenPayload = {
    userId: user._id,
    phone: user.phone,
    isAdmin: user.isAdmin || false,
  };

  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return success({
    token,
    refreshToken,
    user,
  });
}

