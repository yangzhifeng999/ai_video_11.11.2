/**
 * JWT 认证模块
 */

const jwt = require('jsonwebtoken');

// 使用与前端相同的 JWT_SECRET（优先使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || '306f9b145624e3a46f7f6335ea8f4364e660bed9f17c2a0f281d877304f2ad24';
const JWT_EXPIRES_IN = '7d';  // Token 有效期
const JWT_REFRESH_EXPIRES_IN = '30d';  // 刷新Token有效期

/**
 * 生成 Access Token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 生成 Refresh Token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * 验证 Token
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'TOKEN_EXPIRED' };
    }
    return { valid: false, error: 'TOKEN_INVALID' };
  }
}

/**
 * 从请求头中提取 Token
 */
function extractToken(headers) {
  const authorization = headers.authorization || headers.Authorization;
  if (!authorization) {
    return null;
  }
  
  if (authorization.startsWith('Bearer ')) {
    return authorization.slice(7);
  }
  
  return authorization;
}

/**
 * 认证中间件（在云函数中使用）
 */
async function authenticate(event) {
  const token = extractToken(event.headers || {});
  
  if (!token) {
    return { authenticated: false, error: 'NO_TOKEN' };
  }
  
  const result = verifyToken(token);
  
  if (!result.valid) {
    return { authenticated: false, error: result.error };
  }
  
  return { authenticated: true, user: result.decoded };
}

/**
 * 管理员认证
 */
async function authenticateAdmin(event) {
  const authResult = await authenticate(event);
  
  if (!authResult.authenticated) {
    return authResult;
  }
  
  if (!authResult.user.isAdmin) {
    return { authenticated: false, error: 'NOT_ADMIN' };
  }
  
  return authResult;
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  extractToken,
  authenticate,
  authenticateAdmin,
};

