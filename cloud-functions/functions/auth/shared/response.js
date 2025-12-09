/**
 * 统一响应格式
 */

// HTTP 状态码
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

// 业务状态码
const BIZ_CODE = {
  SUCCESS: 0,
  PARAM_ERROR: 1001,
  AUTH_FAILED: 2001,
  TOKEN_EXPIRED: 2002,
  TOKEN_INVALID: 2003,
  USER_NOT_FOUND: 3001,
  USER_EXISTS: 3002,
  VIDEO_NOT_FOUND: 4001,
  ORDER_NOT_FOUND: 5001,
  ORDER_PAID: 5002,
  PAYMENT_FAILED: 6001,
  SYSTEM_ERROR: 9999,
};

// 错误消息
const BIZ_MESSAGE = {
  [BIZ_CODE.SUCCESS]: '成功',
  [BIZ_CODE.PARAM_ERROR]: '参数错误',
  [BIZ_CODE.AUTH_FAILED]: '认证失败',
  [BIZ_CODE.TOKEN_EXPIRED]: 'Token已过期',
  [BIZ_CODE.TOKEN_INVALID]: 'Token无效',
  [BIZ_CODE.USER_NOT_FOUND]: '用户不存在',
  [BIZ_CODE.USER_EXISTS]: '用户已存在',
  [BIZ_CODE.VIDEO_NOT_FOUND]: '视频不存在',
  [BIZ_CODE.ORDER_NOT_FOUND]: '订单不存在',
  [BIZ_CODE.ORDER_PAID]: '订单已支付',
  [BIZ_CODE.PAYMENT_FAILED]: '支付失败',
  [BIZ_CODE.SYSTEM_ERROR]: '系统错误',
};

/**
 * 成功响应
 */
function success(data = null, message = '成功') {
  return {
    statusCode: HTTP_STATUS.OK,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify({
      code: BIZ_CODE.SUCCESS,
      message,
      data,
    }),
  };
}

/**
 * 错误响应
 */
function error(code = BIZ_CODE.SYSTEM_ERROR, message = null, statusCode = HTTP_STATUS.BAD_REQUEST) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify({
      code,
      message: message || BIZ_MESSAGE[code] || '未知错误',
      data: null,
    }),
  };
}

/**
 * 参数错误
 */
function paramError(message = '参数错误') {
  return error(BIZ_CODE.PARAM_ERROR, message, HTTP_STATUS.BAD_REQUEST);
}

/**
 * 未授权
 */
function unauthorized(message = '请先登录') {
  return error(BIZ_CODE.AUTH_FAILED, message, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * 禁止访问
 */
function forbidden(message = '无权限访问') {
  return error(BIZ_CODE.AUTH_FAILED, message, HTTP_STATUS.FORBIDDEN);
}

/**
 * 未找到
 */
function notFound(message = '资源不存在') {
  return error(BIZ_CODE.SYSTEM_ERROR, message, HTTP_STATUS.NOT_FOUND);
}

/**
 * 系统错误
 */
function serverError(message = '系统错误') {
  return error(BIZ_CODE.SYSTEM_ERROR, message, HTTP_STATUS.INTERNAL_ERROR);
}

module.exports = {
  HTTP_STATUS,
  BIZ_CODE,
  BIZ_MESSAGE,
  success,
  error,
  paramError,
  unauthorized,
  forbidden,
  notFound,
  serverError,
};

