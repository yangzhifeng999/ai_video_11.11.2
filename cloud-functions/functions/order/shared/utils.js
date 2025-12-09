/**
 * 通用工具函数
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * 生成 UUID
 */
function generateId() {
  return uuidv4().replace(/-/g, '');
}

/**
 * 生成订单号
 */
function generateOrderNo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${year}${month}${day}${Date.now()}${random}`;
}

/**
 * 密码加密
 */
function hashPassword(password) {
  const bcrypt = require('bcryptjs');
  return bcrypt.hashSync(password, 10);
}

/**
 * 验证密码
 */
function verifyPassword(password, hash) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compareSync(password, hash);
}

/**
 * 解析请求体
 */
function parseBody(event) {
  if (!event.body) return {};
  
  try {
    if (typeof event.body === 'string') {
      return JSON.parse(event.body);
    }
    return event.body;
  } catch {
    return {};
  }
}

/**
 * 获取查询参数
 */
function getQuery(event) {
  return event.queryStringParameters || {};
}

/**
 * 获取路径参数
 */
function getPathParams(event) {
  return event.pathParameters || {};
}

/**
 * 获取请求路径
 */
function getPath(event) {
  return event.path || (event.requestContext && event.requestContext.path) || '';
}

/**
 * 获取请求方法
 */
function getMethod(event) {
  return event.httpMethod || (event.requestContext && event.requestContext.httpMethod) || 'GET';
}

/**
 * MD5 加密
 */
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * SHA256 加密
 */
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * 生成签名（用于支付等场景）
 */
function generateSign(params, secret, algorithm = 'md5') {
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  const finalStr = `${signStr}&key=${secret}`;
  
  if (algorithm === 'sha256') {
    return sha256(finalStr).toUpperCase();
  }
  return md5(finalStr).toUpperCase();
}

/**
 * 验证手机号
 */
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 脱敏手机号
 */
function maskPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

/**
 * 格式化价格（分转元）
 */
function formatPrice(cents) {
  return (cents / 100).toFixed(2);
}

/**
 * 价格转分
 */
function toCents(yuan) {
  return Math.round(parseFloat(yuan) * 100);
}

/**
 * 路由匹配
 */
function matchRoute(path, pattern) {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  
  if (pathParts.length !== patternParts.length) {
    return null;
  }
  
  const params = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  
  return params;
}

/**
 * 添加 CORS 响应头
 */
function addCorsHeaders(response) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  return {
    ...response,
    headers: {
      ...(response.headers || {}),
      ...corsHeaders
    }
  };
}

/**
 * 处理 OPTIONS 预检请求
 */
function handleOptionsRequest() {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    },
    body: ''
  };
}

module.exports = {
  generateId,
  generateOrderNo,
  hashPassword,
  verifyPassword,
  parseBody,
  getQuery,
  getPathParams,
  getPath,
  getMethod,
  md5,
  sha256,
  generateSign,
  isValidPhone,
  maskPhone,
  formatPrice,
  toCents,
  matchRoute,
  addCorsHeaders,
  handleOptionsRequest,
};

