/**
 * 支付云函数
 * 处理微信支付、支付宝支付、支付回调等
 */

const { COLLECTIONS, dbUtils } = require('./shared/database');
const { success, error, paramError, unauthorized, BIZ_CODE } = require('./shared/response');
const { authenticate } = require('./shared/auth');
const { parseBody, getPath, getMethod, generateSign, toCents, handleOptionsRequest } = require('./shared/utils');
const crypto = require('crypto');

// 支付配置
const paymentConfig = {
  wechat: {
    appId: process.env.WECHAT_PAY_APP_ID,
    mchId: process.env.WECHAT_PAY_MCH_ID,
    apiKey: process.env.WECHAT_PAY_API_KEY,
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL,
  },
  alipay: {
    appId: process.env.ALIPAY_APP_ID,
    privateKey: process.env.ALIPAY_PRIVATE_KEY,
    publicKey: process.env.ALIPAY_PUBLIC_KEY,
    notifyUrl: process.env.ALIPAY_NOTIFY_URL,
  },
};

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
    // 创建支付
    if (path.endsWith('/payment/create') && method === 'POST') {
      return await handleCreatePayment(event, body);
    }

    // 查询支付状态
    if (path.endsWith('/payment/query') && method === 'POST') {
      return await handleQueryPayment(event, body);
    }

    // 微信支付回调
    if (path.endsWith('/payment/wechat/notify') && method === 'POST') {
      return await handleWechatNotify(event);
    }

    // 支付宝回调
    if (path.endsWith('/payment/alipay/notify') && method === 'POST') {
      return await handleAlipayNotify(event);
    }

    return error(BIZ_CODE.SYSTEM_ERROR, '接口不存在', 404);
  } catch (err) {
    console.error('Payment error:', err);
    return error(BIZ_CODE.SYSTEM_ERROR, err.message);
  }
};

/**
 * 创建支付
 */
async function handleCreatePayment(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { orderId, paymentMethod } = body;

  if (!orderId) {
    return paramError('orderId不能为空');
  }

  if (!['wechat', 'alipay'].includes(paymentMethod)) {
    return paramError('支付方式无效');
  }

  // 获取订单
  const order = await dbUtils.findById(COLLECTIONS.ORDERS, orderId);
  if (!order) {
    return error(BIZ_CODE.ORDER_NOT_FOUND);
  }

  // 验证订单归属
  if (order.userId !== authResult.user.userId) {
    return error(BIZ_CODE.AUTH_FAILED, '无权操作此订单');
  }

  // 检查订单状态
  if (order.status !== 'pending') {
    return error(BIZ_CODE.ORDER_PAID, '订单已支付或已取消');
  }

  // 获取视频信息
  const video = await dbUtils.findById(COLLECTIONS.VIDEOS, order.videoId);

  try {
    let paymentResult;

    if (paymentMethod === 'wechat') {
      paymentResult = await createWechatPayment(order, video);
    } else {
      paymentResult = await createAlipayPayment(order, video);
    }

    // 更新订单支付方式
    await dbUtils.update(COLLECTIONS.ORDERS, orderId, {
      paymentMethod,
      paymentParams: paymentResult,
    });

    return success(paymentResult);
  } catch (err) {
    console.error('创建支付失败:', err);
    return error(BIZ_CODE.PAYMENT_FAILED, '创建支付失败');
  }
}

/**
 * 创建微信支付
 */
async function createWechatPayment(order, video) {
  const { appId, mchId, apiKey, notifyUrl } = paymentConfig.wechat;

  // 构建支付参数
  const params = {
    appid: appId,
    mch_id: mchId,
    nonce_str: crypto.randomBytes(16).toString('hex'),
    body: `嘿哈-${video.title}`,
    out_trade_no: order.orderNo,
    total_fee: order.price, // 单位：分
    spbill_create_ip: '127.0.0.1',
    notify_url: notifyUrl,
    trade_type: 'JSAPI', // 或 APP
    // openid: order.wxOpenId, // JSAPI 支付需要
  };

  // 生成签名
  params.sign = generateSign(params, apiKey, 'md5');

  // TODO: 调用微信统一下单接口
  // const result = await callWechatUnifiedOrder(params);

  // 模拟返回
  return {
    appId,
    timeStamp: Math.floor(Date.now() / 1000).toString(),
    nonceStr: params.nonce_str,
    package: `prepay_id=wx_${Date.now()}`,
    signType: 'MD5',
    paySign: 'MOCK_PAY_SIGN',
  };
}

/**
 * 创建支付宝支付
 */
async function createAlipayPayment(order, video) {
  const { appId, notifyUrl } = paymentConfig.alipay;

  // 构建支付参数
  const params = {
    app_id: appId,
    method: 'alipay.trade.app.pay',
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    version: '1.0',
    notify_url: notifyUrl,
    biz_content: JSON.stringify({
      subject: `嘿哈-${video.title}`,
      out_trade_no: order.orderNo,
      total_amount: (order.price / 100).toFixed(2), // 单位：元
      product_code: 'QUICK_MSECURITY_PAY',
    }),
  };

  // TODO: 生成签名并调用支付宝接口

  // 模拟返回
  return {
    orderString: `mock_alipay_order_string_${order.orderNo}`,
  };
}

/**
 * 查询支付状态
 */
async function handleQueryPayment(event, body) {
  const authResult = await authenticate(event);
  if (!authResult.authenticated) {
    return unauthorized();
  }

  const { orderId } = body;

  if (!orderId) {
    return paramError('orderId不能为空');
  }

  const order = await dbUtils.findById(COLLECTIONS.ORDERS, orderId);
  if (!order) {
    return error(BIZ_CODE.ORDER_NOT_FOUND);
  }

  // 验证订单归属
  if (order.userId !== authResult.user.userId) {
    return error(BIZ_CODE.AUTH_FAILED, '无权查看此订单');
  }

  return success({
    orderId: order._id,
    orderNo: order.orderNo,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paidAt: order.paidAt,
  });
}

/**
 * 微信支付回调
 */
async function handleWechatNotify(event) {
  try {
    // 解析回调数据
    const xmlData = event.body;
    
    // TODO: 解析 XML 数据
    // const result = await parseXML(xmlData);

    // 模拟解析结果
    const result = {
      return_code: 'SUCCESS',
      result_code: 'SUCCESS',
      out_trade_no: '', // 从 XML 解析
      transaction_id: '', // 微信交易号
    };

    if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
      console.error('微信支付回调失败:', result);
      return {
        statusCode: 200,
        body: '<xml><return_code>FAIL</return_code></xml>',
      };
    }

    // TODO: 验证签名

    // 查询订单
    const order = await dbUtils.findOne(COLLECTIONS.ORDERS, {
      orderNo: result.out_trade_no,
    });

    if (!order) {
      console.error('订单不存在:', result.out_trade_no);
      return {
        statusCode: 200,
        body: '<xml><return_code>SUCCESS</return_code></xml>',
      };
    }

    // 更新订单状态
    if (order.paymentStatus !== 'paid') {
      await dbUtils.update(COLLECTIONS.ORDERS, order._id, {
        status: 'processing',
        paymentStatus: 'paid',
        transactionId: result.transaction_id,
        paidAt: new Date().toISOString(),
      });

      // 提交VOD处理任务
      // await submitVODTask(order._id, ...);
    }

    return {
      statusCode: 200,
      body: '<xml><return_code>SUCCESS</return_code></xml>',
    };
  } catch (err) {
    console.error('处理微信回调失败:', err);
    return {
      statusCode: 200,
      body: '<xml><return_code>FAIL</return_code></xml>',
    };
  }
}

/**
 * 支付宝回调
 */
async function handleAlipayNotify(event) {
  try {
    const params = event.body;
    
    // TODO: 验证签名

    const { trade_status, out_trade_no, trade_no } = params;

    if (trade_status !== 'TRADE_SUCCESS' && trade_status !== 'TRADE_FINISHED') {
      return {
        statusCode: 200,
        body: 'fail',
      };
    }

    // 查询订单
    const order = await dbUtils.findOne(COLLECTIONS.ORDERS, {
      orderNo: out_trade_no,
    });

    if (!order) {
      console.error('订单不存在:', out_trade_no);
      return {
        statusCode: 200,
        body: 'success',
      };
    }

    // 更新订单状态
    if (order.paymentStatus !== 'paid') {
      await dbUtils.update(COLLECTIONS.ORDERS, order._id, {
        status: 'processing',
        paymentStatus: 'paid',
        transactionId: trade_no,
        paidAt: new Date().toISOString(),
      });

      // 提交VOD处理任务
      // await submitVODTask(order._id, ...);
    }

    return {
      statusCode: 200,
      body: 'success',
    };
  } catch (err) {
    console.error('处理支付宝回调失败:', err);
    return {
      statusCode: 200,
      body: 'fail',
    };
  }
}

