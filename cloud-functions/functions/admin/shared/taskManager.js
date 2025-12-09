/**
 * 任务管理模块
 * 处理 AI 换脸任务的生命周期管理
 */

const { COLLECTIONS, dbUtils, _ } = require('./database');
const { generateId } = require('./utils');

// 任务状态枚举
const TASK_STATUS = {
  PENDING: 'pending',           // 等待处理
  UPLOADING: 'uploading',       // 正在上传资源
  PROCESSING: 'processing',     // RunningHub 处理中
  DOWNLOADING: 'downloading',   // 正在下载结果
  COMPLETED: 'completed',       // 已完成
  FAILED: 'failed',             // 失败
  CANCELLED: 'cancelled',       // 已取消
  TIMEOUT: 'timeout',           // 超时
};

// 任务类型枚举
const TASK_TYPE = {
  FACE_SWAP: 'face_swap',       // 换脸
  VIDEO_GEN: 'video_gen',       // 视频生成
};

// RunningHub 状态映射
const RH_STATUS_MAP = {
  'QUEUED': TASK_STATUS.PROCESSING,
  'RUNNING': TASK_STATUS.PROCESSING,
  'SUCCESS': TASK_STATUS.DOWNLOADING,
  'FAILED': TASK_STATUS.FAILED,
};

/**
 * 任务管理器
 */
const taskManager = {
  /**
   * 创建新任务
   * 
   * @param {Object} params
   * @param {string} params.userId - 用户 ID
   * @param {string} params.orderId - 订单 ID
   * @param {string} params.videoId - 视频模板 ID
   * @param {string} params.workflowId - RunningHub 工作流 ID
   * @param {string} params.inputPhotoUrl - 用户上传的照片 URL（COS）
   * @param {string} params.type - 任务类型
   * @returns {Promise<string>} - 任务 ID
   */
  async createTask(params) {
    const {
      userId,
      orderId,
      videoId,
      workflowId,
      inputPhotoUrl,
      type = TASK_TYPE.FACE_SWAP,
    } = params;

    const taskId = generateId();
    const now = new Date().toISOString();

    const taskData = {
      taskId,
      userId,
      orderId,
      videoId,
      workflowId,
      type,
      status: TASK_STATUS.PENDING,
      progress: 0,
      
      // 输入
      inputPhotoUrl,
      runningHubFileName: null,   // 上传到 RH 后的文件名
      
      // RunningHub 相关
      runningHubTaskId: null,     // RH 返回的任务 ID
      runningHubStatus: null,     // RH 任务状态
      
      // 输出
      outputVideoUrl: null,       // 生成的视频 URL
      outputFileType: null,       // 输出文件类型
      taskCostTime: null,         // 任务耗时（秒）
      
      // 错误信息
      errorMessage: null,
      errorCode: null,
      retryCount: 0,
      maxRetries: 3,
      
      // 时间戳
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      completedAt: null,
      
      // 超时设置（毫秒）
      timeoutMs: 30 * 60 * 1000,  // 30 分钟
    };

    await dbUtils.create(COLLECTIONS.TASKS, taskData);
    
    console.log(`任务创建成功: ${taskId}`);
    return taskId;
  },

  /**
   * 更新任务状态
   * 
   * @param {string} taskId - 任务 ID
   * @param {Object} updates - 更新内容
   */
  async updateTask(taskId, updates) {
    updates.updatedAt = new Date().toISOString();
    await dbUtils.updateWhere(COLLECTIONS.TASKS, { taskId }, updates);
  },

  /**
   * 获取任务详情
   * 
   * @param {string} taskId - 任务 ID
   * @returns {Promise<Object>}
   */
  async getTask(taskId) {
    const result = await dbUtils.findWhere(COLLECTIONS.TASKS, { taskId });
    return result[0] || null;
  },

  /**
   * 获取用户的任务列表
   * 
   * @param {string} userId - 用户 ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getUserTasks(userId, options = {}) {
    const { page = 1, pageSize = 20, status } = options;
    
    const filter = {
      userId,
      deletedAt: _.exists(false),
    };
    
    if (status) {
      filter.status = status;
    }

    return await dbUtils.paginate(
      COLLECTIONS.TASKS,
      filter,
      page,
      pageSize,
      { orderBy: 'createdAt', order: 'desc' }
    );
  },

  /**
   * 获取待处理的任务列表
   * 用于 taskCheck 定时函数轮询
   * 
   * @param {number} limit - 获取数量
   * @returns {Promise<Array>}
   */
  async getPendingTasks(limit = 50) {
    const processingStatuses = [
      TASK_STATUS.PENDING,
      TASK_STATUS.UPLOADING,
      TASK_STATUS.PROCESSING,
      TASK_STATUS.DOWNLOADING,
    ];

    const result = await dbUtils.findWhere(COLLECTIONS.TASKS, {
      status: _.in(processingStatuses),
    });

    return result.slice(0, limit);
  },

  /**
   * 获取超时的任务
   * 
   * @returns {Promise<Array>}
   */
  async getTimeoutTasks() {
    const now = new Date();
    
    // 查询处理中且已超时的任务
    const result = await dbUtils.findWhere(COLLECTIONS.TASKS, {
      status: _.in([TASK_STATUS.PROCESSING, TASK_STATUS.UPLOADING]),
    });

    // 过滤出超时的任务
    return result.filter(task => {
      if (!task.startedAt) return false;
      const startTime = new Date(task.startedAt).getTime();
      const elapsed = now.getTime() - startTime;
      return elapsed > (task.timeoutMs || 30 * 60 * 1000);
    });
  },

  /**
   * 标记任务开始处理
   * 
   * @param {string} taskId - 任务 ID
   */
  async markTaskStarted(taskId) {
    await this.updateTask(taskId, {
      status: TASK_STATUS.UPLOADING,
      startedAt: new Date().toISOString(),
      progress: 10,
    });
  },

  /**
   * 标记任务正在 RunningHub 处理
   * 
   * @param {string} taskId - 任务 ID
   * @param {string} runningHubTaskId - RH 任务 ID
   * @param {string} runningHubFileName - 上传到 RH 的文件名
   */
  async markTaskProcessing(taskId, runningHubTaskId, runningHubFileName) {
    await this.updateTask(taskId, {
      status: TASK_STATUS.PROCESSING,
      runningHubTaskId,
      runningHubFileName,
      progress: 30,
    });
  },

  /**
   * 更新 RunningHub 状态
   * 
   * @param {string} taskId - 任务 ID
   * @param {string} rhStatus - RH 状态
   */
  async updateRunningHubStatus(taskId, rhStatus) {
    const status = RH_STATUS_MAP[rhStatus] || TASK_STATUS.PROCESSING;
    let progress = 30;
    
    switch (rhStatus) {
      case 'QUEUED':
        progress = 30;
        break;
      case 'RUNNING':
        progress = 50;
        break;
      case 'SUCCESS':
        progress = 80;
        break;
      case 'FAILED':
        progress = 0;
        break;
    }

    await this.updateTask(taskId, {
      status,
      runningHubStatus: rhStatus,
      progress,
    });
  },

  /**
   * 标记任务完成
   * 
   * @param {string} taskId - 任务 ID
   * @param {Object} result - 任务结果
   */
  async markTaskCompleted(taskId, result) {
    const { outputVideoUrl, outputFileType, taskCostTime } = result;
    
    await this.updateTask(taskId, {
      status: TASK_STATUS.COMPLETED,
      outputVideoUrl,
      outputFileType,
      taskCostTime,
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    console.log(`任务完成: ${taskId}`);
  },

  /**
   * 标记任务失败
   * 
   * @param {string} taskId - 任务 ID
   * @param {string} errorMessage - 错误信息
   * @param {string} errorCode - 错误码
   */
  async markTaskFailed(taskId, errorMessage, errorCode) {
    const task = await this.getTask(taskId);
    const retryCount = ((task && task.retryCount) || 0) + 1;
    
    await this.updateTask(taskId, {
      status: TASK_STATUS.FAILED,
      errorMessage,
      errorCode,
      retryCount,
      progress: 0,
      completedAt: new Date().toISOString(),
    });

    console.error(`任务失败: ${taskId}, 错误: ${errorMessage}`);
  },

  /**
   * 标记任务超时
   * 
   * @param {string} taskId - 任务 ID
   */
  async markTaskTimeout(taskId) {
    await this.updateTask(taskId, {
      status: TASK_STATUS.TIMEOUT,
      errorMessage: '任务处理超时',
      progress: 0,
      completedAt: new Date().toISOString(),
    });

    console.error(`任务超时: ${taskId}`);
  },

  /**
   * 取消任务
   * 
   * @param {string} taskId - 任务 ID
   * @param {string} userId - 用户 ID（用于验证权限）
   * @returns {Promise<boolean>}
   */
  async cancelTask(taskId, userId) {
    const task = await this.getTask(taskId);
    
    if (!task) {
      throw new Error('任务不存在');
    }
    
    if (task.userId !== userId) {
      throw new Error('无权操作此任务');
    }
    
    // 只有未完成的任务可以取消
    if ([TASK_STATUS.COMPLETED, TASK_STATUS.FAILED, TASK_STATUS.CANCELLED].includes(task.status)) {
      throw new Error('任务已结束，无法取消');
    }

    await this.updateTask(taskId, {
      status: TASK_STATUS.CANCELLED,
      completedAt: new Date().toISOString(),
    });

    return true;
  },

  /**
   * 检查任务是否可重试
   * 
   * @param {Object} task - 任务对象
   * @returns {boolean}
   */
  canRetry(task) {
    return task.status === TASK_STATUS.FAILED && 
           task.retryCount < (task.maxRetries || 3);
  },

  /**
   * 重试失败的任务
   * 
   * @param {string} taskId - 任务 ID
   * @returns {Promise<boolean>}
   */
  async retryTask(taskId) {
    const task = await this.getTask(taskId);
    
    if (!task) {
      throw new Error('任务不存在');
    }
    
    if (!this.canRetry(task)) {
      throw new Error('任务不可重试');
    }

    await this.updateTask(taskId, {
      status: TASK_STATUS.PENDING,
      errorMessage: null,
      errorCode: null,
      progress: 0,
      startedAt: null,
      completedAt: null,
    });

    return true;
  },

  /**
   * 计算估计剩余时间（基于历史数据）
   * 
   * @param {string} workflowId - 工作流 ID
   * @returns {Promise<number>} - 预估秒数
   */
  async estimateRemainingTime(workflowId) {
    // 查询该工作流最近完成的任务
    const completedTasks = await dbUtils.findWhere(COLLECTIONS.TASKS, {
      workflowId,
      status: TASK_STATUS.COMPLETED,
    });

    if (completedTasks.length === 0) {
      return 180; // 默认 3 分钟
    }

    // 计算平均耗时
    const avgTime = completedTasks
      .filter(t => t.taskCostTime)
      .reduce((sum, t) => sum + parseInt(t.taskCostTime), 0) / completedTasks.length;

    return Math.ceil(avgTime) || 180;
  },

  /**
   * 获取任务统计信息
   * 
   * @param {string} userId - 用户 ID（可选，不传则统计全部）
   * @returns {Promise<Object>}
   */
  async getTaskStats(userId) {
    const filter = userId ? { userId } : {};
    
    const allTasks = await dbUtils.findWhere(COLLECTIONS.TASKS, filter);
    
    const stats = {
      total: allTasks.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      timeout: 0,
    };

    allTasks.forEach(task => {
      if (stats[task.status] !== undefined) {
        stats[task.status]++;
      }
    });

    return stats;
  },
};

module.exports = {
  taskManager,
  TASK_STATUS,
  TASK_TYPE,
};

