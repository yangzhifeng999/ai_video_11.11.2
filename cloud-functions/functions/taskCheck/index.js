/**
 * 定时任务云函数
 * 定期检查 AI 任务处理状态，更新订单
 */

const { COLLECTIONS, dbUtils, _ } = require('./shared/database');
const { vodService, cosService } = require('./shared/tencent');
const { runningHubService, TASK_STATUS: RH_STATUS } = require('./shared/runninghub');
const { taskManager, TASK_STATUS } = require('./shared/taskManager');
const axios = require('axios');

/**
 * 主处理函数 - 定时触发器调用
 */
exports.main = async (event, context) => {
  console.log('========== 开始检查任务状态 ==========');
  const startTime = Date.now();

  const result = {
    runningHubTasks: { processed: 0, success: 0, failed: 0 },
    vodOrders: { processed: 0, success: 0, failed: 0 },
    timeoutTasks: 0,
    success: true,
  };

  try {
    // 1. 检查 RunningHub AI 换脸任务
    await checkRunningHubTasks(result);

    // 2. 检查 VOD 处理订单（兼容旧逻辑）
    await checkVodOrders(result);

    // 3. 检查超时任务
    await checkTimeoutTasks(result);

    // 4. 检查超时订单（兼容旧逻辑）
    await checkTimeoutOrders();

    const elapsed = Date.now() - startTime;
    console.log(`========== 任务检查完成 (${elapsed}ms) ==========`);
    console.log('结果:', JSON.stringify(result));

    return result;
  } catch (err) {
    console.error('任务检查失败:', err);
    return {
      ...result,
      success: false,
      error: err.message,
    };
  }
};

// ========== RunningHub 任务处理 ==========

/**
 * 检查 RunningHub AI 换脸任务
 */
async function checkRunningHubTasks(result) {
  console.log('--- 检查 RunningHub 任务 ---');

  try {
    // 获取待处理的任务
    const pendingTasks = await taskManager.getPendingTasks(50);
    console.log(`找到 ${pendingTasks.length} 个待处理任务`);

    for (const task of pendingTasks) {
      result.runningHubTasks.processed++;
      
      try {
        await processRunningHubTask(task);
        result.runningHubTasks.success++;
      } catch (err) {
        console.error(`处理任务 ${task.taskId} 失败:`, err.message);
        result.runningHubTasks.failed++;
      }
    }
  } catch (err) {
    console.error('检查 RunningHub 任务失败:', err);
  }
}

/**
 * 处理单个 RunningHub 任务
 */
async function processRunningHubTask(task) {
  console.log(`处理任务: ${task.taskId}, 状态: ${task.status}`);

  switch (task.status) {
    case TASK_STATUS.PENDING:
      // 任务等待处理，开始上传资源到 RunningHub
      await startRunningHubTask(task);
      break;

    case TASK_STATUS.UPLOADING:
      // 正在上传，检查是否卡住（超过5分钟）
      if (isTaskStuck(task, 5 * 60 * 1000)) {
        await retryUpload(task);
      }
      break;

    case TASK_STATUS.PROCESSING:
      // RunningHub 处理中，查询状态
      await checkRunningHubStatus(task);
      break;

    case TASK_STATUS.DOWNLOADING:
      // 下载结果视频
      await downloadTaskResult(task);
      break;
  }
}

/**
 * 开始 RunningHub 任务（上传资源并创建任务）
 */
async function startRunningHubTask(task) {
  console.log(`开始任务: ${task.taskId}`);

  try {
    // 标记任务开始
    await taskManager.markTaskStarted(task.taskId);

    // 1. 从 COS 下载用户照片
    console.log('从 COS 下载用户照片...');
    const photoBuffer = await downloadFromCOS(task.inputPhotoUrl);

    // 2. 上传到 RunningHub
    console.log('上传照片到 RunningHub...');
    const fileName = extractFileName(task.inputPhotoUrl);
    const uploadResult = await runningHubService.uploadResource(photoBuffer, fileName);
    console.log('上传成功:', uploadResult.fileName);

    // 3. 获取视频模板信息
    const video = await dbUtils.findById(COLLECTIONS.VIDEOS, task.videoId);
    if (!video || !video.runningHubWorkflowId) {
      throw new Error('视频模板未配置工作流');
    }

    // 4. 创建 RunningHub 任务
    console.log('创建 RunningHub 任务...');
    const nodeInfoList = [
      {
        nodeId: video.imageNodeId || '10',  // 默认节点 ID
        fieldName: video.imageFieldName || 'image',
        fieldValue: uploadResult.fileName,
      },
    ];

    const rhTask = await runningHubService.createTask(
      video.runningHubWorkflowId,
      nodeInfoList
    );
    console.log('RunningHub 任务创建成功:', rhTask.taskId);

    // 5. 更新任务状态
    await taskManager.markTaskProcessing(
      task.taskId,
      rhTask.taskId,
      uploadResult.fileName
    );

  } catch (err) {
    console.error('启动任务失败:', err);
    await taskManager.markTaskFailed(task.taskId, err.message, 'START_FAILED');
  }
}

/**
 * 检查 RunningHub 任务状态
 */
async function checkRunningHubStatus(task) {
  if (!task.runningHubTaskId) {
    console.error('任务缺少 RunningHub 任务 ID');
    return;
  }

  try {
    const rhStatus = await runningHubService.getTaskStatus(task.runningHubTaskId);
    console.log(`RunningHub 任务 ${task.runningHubTaskId} 状态: ${rhStatus}`);

    // 更新状态
    await taskManager.updateRunningHubStatus(task.taskId, rhStatus);

    if (rhStatus === RH_STATUS.SUCCESS) {
      // 任务完成，准备下载结果
      console.log('RunningHub 任务完成，准备下载结果');
    } else if (rhStatus === RH_STATUS.FAILED) {
      // 任务失败
      await taskManager.markTaskFailed(task.taskId, 'RunningHub 任务处理失败', 'RH_FAILED');
      
      // 更新订单状态
      await handleTaskFailed(task);
    }
  } catch (err) {
    console.error('查询 RunningHub 状态失败:', err);
  }
}

/**
 * 下载任务结果
 */
async function downloadTaskResult(task) {
  if (!task.runningHubTaskId) {
    console.error('任务缺少 RunningHub 任务 ID');
    return;
  }

  try {
    // 获取 RunningHub 任务输出
    const outputs = await runningHubService.getTaskOutputs(task.runningHubTaskId);
    
    if (!outputs || outputs.length === 0) {
      console.log('任务输出为空，可能还在处理');
      return;
    }

    console.log('获取到任务输出:', outputs.length, '个文件');

    // 找到视频文件
    const videoOutput = outputs.find(o => 
      ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(o.fileType && o.fileType.toLowerCase())
    ) || outputs[0];

    if (!videoOutput || !videoOutput.fileUrl) {
      throw new Error('未找到输出视频');
    }

    console.log('输出视频:', videoOutput.fileUrl);

    // 下载视频到 COS（可选，也可以直接使用 RunningHub URL）
    // const cosUrl = await downloadToCOS(videoOutput.fileUrl, task.userId);

    // 标记任务完成
    await taskManager.markTaskCompleted(task.taskId, {
      outputVideoUrl: videoOutput.fileUrl,
      outputFileType: videoOutput.fileType,
      taskCostTime: videoOutput.taskCostTime,
    });

    // 更新订单状态
    await handleTaskCompleted(task, videoOutput.fileUrl);

  } catch (err) {
    console.error('下载任务结果失败:', err);
    await taskManager.markTaskFailed(task.taskId, err.message, 'DOWNLOAD_FAILED');
  }
}

/**
 * 任务完成处理
 */
async function handleTaskCompleted(task, videoUrl) {
  try {
    // 更新订单状态
    await dbUtils.updateWhere(COLLECTIONS.ORDERS, { orderId: task.orderId }, {
      status: 'completed',
      resultVideoUrl: videoUrl,
      completedAt: new Date().toISOString(),
    });

    // 给创作者增加收益
    const order = await dbUtils.findOne(COLLECTIONS.ORDERS, { orderId: task.orderId });
    if (order) {
      await addCreatorEarning(order);
    }

    // 发送通知
    await sendNotification(task.userId, {
      type: 'task_completed',
      title: '视频制作完成',
      content: '您的 AI 视频已制作完成，快去查看吧！',
      orderId: task.orderId,
      taskId: task.taskId,
    });

    console.log(`任务 ${task.taskId} 处理完成`);
  } catch (err) {
    console.error('处理任务完成失败:', err);
  }
}

/**
 * 任务失败处理
 */
async function handleTaskFailed(task) {
  try {
    // 更新订单状态
    await dbUtils.updateWhere(COLLECTIONS.ORDERS, { orderId: task.orderId }, {
      status: 'failed',
      failReason: task.errorMessage || 'AI 处理失败',
      failedAt: new Date().toISOString(),
    });

    // 自动退款
    const order = await dbUtils.findOne(COLLECTIONS.ORDERS, { orderId: task.orderId });
    if (order) {
      await autoRefund(order);
    }

    // 发送通知
    await sendNotification(task.userId, {
      type: 'task_failed',
      title: '视频制作失败',
      content: '很抱歉，您的视频制作失败，费用已自动退还。',
      orderId: task.orderId,
      taskId: task.taskId,
    });
  } catch (err) {
    console.error('处理任务失败失败:', err);
  }
}

/**
 * 检查超时任务
 */
async function checkTimeoutTasks(result) {
  try {
    const timeoutTasks = await taskManager.getTimeoutTasks();
    console.log(`找到 ${timeoutTasks.length} 个超时任务`);

    for (const task of timeoutTasks) {
      await taskManager.markTaskTimeout(task.taskId);
      await handleTaskFailed(task);
      result.timeoutTasks++;
    }
  } catch (err) {
    console.error('检查超时任务失败:', err);
  }
}

/**
 * 从 COS URL 下载文件
 */
async function downloadFromCOS(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
    });
    return Buffer.from(response.data);
  } catch (err) {
    throw new Error(`下载 COS 文件失败: ${err.message}`);
  }
}

/**
 * 从 URL 提取文件名
 */
function extractFileName(url) {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1].split('?')[0];
  return fileName || 'photo.jpg';
}

/**
 * 检查任务是否卡住
 */
function isTaskStuck(task, maxDuration) {
  if (!task.startedAt) return false;
  const elapsed = Date.now() - new Date(task.startedAt).getTime();
  return elapsed > maxDuration;
}

/**
 * 重试上传
 */
async function retryUpload(task) {
  if (task.retryCount >= (task.maxRetries || 3)) {
    await taskManager.markTaskFailed(task.taskId, '上传重试次数超限', 'RETRY_EXCEEDED');
    await handleTaskFailed(task);
  } else {
    // 重置状态重试
    await taskManager.updateTask(task.taskId, {
      status: TASK_STATUS.PENDING,
      startedAt: null,
    });
  }
}

// ========== VOD 订单处理（兼容旧逻辑）==========

/**
 * 检查 VOD 订单
 */
async function checkVodOrders(result) {
  try {
    const processingOrders = await dbUtils.find(COLLECTIONS.ORDERS, {
      status: 'processing',
      vodTaskId: _.neq(null),
    });

    console.log(`找到 ${processingOrders.length} 个 VOD 处理中订单`);

    for (const order of processingOrders) {
      result.vodOrders.processed++;
      try {
        await checkOrderStatus(order);
        result.vodOrders.success++;
      } catch (err) {
        result.vodOrders.failed++;
      }
    }
  } catch (err) {
    console.error('检查 VOD 订单失败:', err);
  }
}

/**
 * 检查单个订单状态
 */
async function checkOrderStatus(order) {
  try {
    console.log(`检查订单: ${order._id}, 任务ID: ${order.vodTaskId}`);

    // 查询VOD任务状态
    const taskStatus = await vodService.getTaskStatus(order.vodTaskId);

    console.log(`任务状态: ${taskStatus.status}, 进度: ${taskStatus.progress}%`);

    if (taskStatus.status === 'completed') {
      // 处理完成
      await handleOrderCompleted(order, taskStatus);
    } else if (taskStatus.status === 'failed') {
      // 处理失败
      await handleOrderFailed(order, taskStatus);
    } else {
      // 更新进度
      await dbUtils.update(COLLECTIONS.ORDERS, order._id, {
        vodProgress: taskStatus.progress || 0,
      });
    }
  } catch (err) {
    console.error(`检查订单 ${order._id} 失败:`, err);
  }
}

/**
 * 处理订单完成
 */
async function handleOrderCompleted(order, taskStatus) {
  console.log(`订单 ${order._id} 处理完成`);

  // 更新订单状态
  await dbUtils.update(COLLECTIONS.ORDERS, order._id, {
    status: 'completed',
    vodProgress: 100,
    resultVideoUrl: taskStatus.resultUrl,
    completedAt: new Date().toISOString(),
  });

  // 给创作者增加收益
  await addCreatorEarning(order);

  // 发送通知给用户
  await sendNotification(order.userId, {
    type: 'order_completed',
    title: '视频制作完成',
    content: '您的视频已制作完成，快去查看吧！',
    orderId: order._id,
  });
}

/**
 * 处理订单失败
 */
async function handleOrderFailed(order, taskStatus) {
  console.log(`订单 ${order._id} 处理失败`);

  // 更新订单状态
  await dbUtils.update(COLLECTIONS.ORDERS, order._id, {
    status: 'failed',
    failReason: taskStatus.errorMessage || '视频处理失败',
    failedAt: new Date().toISOString(),
  });

  // 自动退款
  await autoRefund(order);

  // 发送通知给用户
  await sendNotification(order.userId, {
    type: 'order_failed',
    title: '视频制作失败',
    content: '很抱歉，您的视频制作失败，费用已自动退还。',
    orderId: order._id,
  });
}

/**
 * 给创作者增加收益
 */
async function addCreatorEarning(order) {
  try {
    // 获取视频信息
    const video = await dbUtils.findById(COLLECTIONS.VIDEOS, order.videoId);
    if (!video) return;

    // 计算创作者收益（假设平台抽成 30%）
    const platformRate = 0.3;
    const creatorAmount = Math.floor(order.price * (1 - platformRate));

    // 获取创作者信息
    const creator = await dbUtils.findById(COLLECTIONS.USERS, video.creatorId);
    if (!creator) return;

    // 更新创作者余额
    await dbUtils.update(COLLECTIONS.USERS, video.creatorId, {
      balance: (creator.balance || 0) + creatorAmount,
    });

    // 记录收益
    await dbUtils.create(COLLECTIONS.EARNINGS, {
      creatorId: video.creatorId,
      orderId: order._id,
      videoId: order.videoId,
      amount: creatorAmount,
      platformAmount: order.price - creatorAmount,
      status: 'settled',
    });

    console.log(`创作者 ${video.creatorId} 收益 ${creatorAmount} 分`);
  } catch (err) {
    console.error('增加创作者收益失败:', err);
  }
}

/**
 * 自动退款
 */
async function autoRefund(order) {
  try {
    const user = await dbUtils.findById(COLLECTIONS.USERS, order.userId);
    if (!user) return;

    if (order.paymentMethod === 'points') {
      // 退还积分
      await dbUtils.update(COLLECTIONS.USERS, order.userId, {
        points: (user.points || 0) + order.price,
      });

      await dbUtils.create(COLLECTIONS.POINT_RECORDS, {
        userId: order.userId,
        type: 'earn',
        amount: order.price,
        reason: `订单退款：${order.orderNo}`,
        orderId: order._id,
        balance: (user.points || 0) + order.price,
      });
    } else if (order.paymentMethod === 'balance') {
      // 退还余额
      await dbUtils.update(COLLECTIONS.USERS, order.userId, {
        balance: (user.balance || 0) + order.price,
      });
    } else {
      // 微信/支付宝退款
      // TODO: 调用支付平台退款接口
    }

    // 更新订单状态
    await dbUtils.update(COLLECTIONS.ORDERS, order._id, {
      refundAmount: order.price,
      refundedAt: new Date().toISOString(),
    });

    console.log(`订单 ${order._id} 已退款`);
  } catch (err) {
    console.error('自动退款失败:', err);
  }
}

/**
 * 发送通知
 */
async function sendNotification(userId, notification) {
  try {
    await dbUtils.create(COLLECTIONS.MESSAGES, {
      userId,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      data: {
        orderId: notification.orderId,
      },
      isRead: false,
    });
  } catch (err) {
    console.error('发送通知失败:', err);
  }
}

/**
 * 检查超时订单
 */
async function checkTimeoutOrders() {
  try {
    // 查找超过30分钟还在处理的订单
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const timeoutOrders = await dbUtils.find(COLLECTIONS.ORDERS, {
      status: 'processing',
      vodSubmittedAt: _.lt(thirtyMinutesAgo),
    });

    console.log(`找到 ${timeoutOrders.length} 个超时订单`);

    for (const order of timeoutOrders) {
      console.log(`订单 ${order._id} 处理超时`);

      // 更新订单状态
      await dbUtils.update(COLLECTIONS.ORDERS, order._id, {
        status: 'failed',
        failReason: '处理超时',
        failedAt: new Date().toISOString(),
      });

      // 自动退款
      await autoRefund(order);

      // 发送通知
      await sendNotification(order.userId, {
        type: 'order_timeout',
        title: '视频处理超时',
        content: '很抱歉，您的视频处理超时，费用已自动退还。',
        orderId: order._id,
      });
    }
  } catch (err) {
    console.error('检查超时订单失败:', err);
  }
}

