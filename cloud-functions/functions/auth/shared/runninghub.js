/**
 * RunningHub API 服务模块
 * 用于对接 RunningHub AI 视频换脸服务
 * 
 * API 文档: https://www.runninghub.cn/runninghub-api-doc-cn/
 */

const axios = require('axios');
const FormData = require('form-data');

// RunningHub API 配置
const config = {
  baseUrl: 'https://www.runninghub.cn',
  apiKey: process.env.RUNNINGHUB_API_KEY || '',
};

// 任务状态枚举
const TASK_STATUS = {
  QUEUED: 'QUEUED',       // 排队中
  RUNNING: 'RUNNING',     // 处理中
  SUCCESS: 'SUCCESS',     // 成功
  FAILED: 'FAILED',       // 失败
};

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: config.baseUrl,
  timeout: 60000, // 60秒超时
  headers: {
    'Content-Type': 'application/json',
    'Host': 'www.runninghub.cn',
  },
});

/**
 * RunningHub 服务
 */
const runningHubService = {
  /**
   * 获取 API Key
   * @returns {string}
   */
  getApiKey() {
    return config.apiKey;
  },

  /**
   * 设置 API Key（用于测试或动态配置）
   * @param {string} apiKey 
   */
  setApiKey(apiKey) {
    config.apiKey = apiKey;
  },

  /**
   * 上传资源（图片、视频、音频）到 RunningHub
   * 
   * @param {Buffer|Stream} fileBuffer - 文件内容
   * @param {string} fileName - 文件名（带扩展名）
   * @param {string} apiKey - API Key（可选，默认使用环境变量）
   * @returns {Promise<{fileName: string, fileType: string}>}
   * 
   * 支持格式：
   * - 图片: JPG, PNG, JPEG, WEBP
   * - 音频: MP3, WAV, FLAC
   * - 视频: MP4, AVI, MOV, MKV
   * - 压缩包: ZIP（图片压缩包）
   * 
   * 单文件大小限制: 30MB
   */
  async uploadResource(fileBuffer, fileName, apiKey) {
    const key = apiKey || config.apiKey;
    
    if (!key) {
      throw new Error('RunningHub API Key 未配置');
    }

    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: getContentType(fileName),
    });
    formData.append('apiKey', key);

    try {
      const response = await axios.post(
        `${config.baseUrl}/task/openapi/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Host': 'www.runninghub.cn',
          },
          timeout: 120000, // 上传超时 2 分钟
        }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || '上传失败');
      }

      return response.data.data;
    } catch (error) {
      console.error('RunningHub 上传资源失败:', error.message);
      throw new Error(`上传资源失败: ${error.message}`);
    }
  },

  /**
   * 发起 ComfyUI 任务（简易模式）
   * 直接运行工作流，不修改任何参数
   * 
   * @param {string} workflowId - 工作流 ID
   * @param {string} apiKey - API Key（可选）
   * @returns {Promise<{taskId: string, taskStatus: string, clientId: string}>}
   */
  async createTaskSimple(workflowId, apiKey) {
    const key = apiKey || config.apiKey;
    
    if (!key) {
      throw new Error('RunningHub API Key 未配置');
    }

    try {
      const response = await apiClient.post('/task/openapi/create', {
        apiKey: key,
        workflowId: workflowId,
      });

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || '创建任务失败');
      }

      return response.data.data;
    } catch (error) {
      console.error('RunningHub 创建任务失败:', error.message);
      throw new Error(`创建任务失败: ${error.message}`);
    }
  },

  /**
   * 发起 ComfyUI 任务（高级模式）
   * 可以修改工作流节点参数，如输入图片
   * 
   * @param {string} workflowId - 工作流 ID
   * @param {Array<{nodeId: string, fieldName: string, fieldValue: string}>} nodeInfoList - 节点参数列表
   * @param {string} apiKey - API Key（可选）
   * @returns {Promise<{taskId: string, taskStatus: string, clientId: string}>}
   * 
   * nodeInfoList 示例:
   * [
   *   {
   *     "nodeId": "10",           // 节点 ID
   *     "fieldName": "image",     // 字段名
   *     "fieldValue": "api/xxx.png"  // 上传返回的 fileName
   *   }
   * ]
   */
  async createTask(workflowId, nodeInfoList, apiKey) {
    const key = apiKey || config.apiKey;
    
    if (!key) {
      throw new Error('RunningHub API Key 未配置');
    }

    try {
      const response = await apiClient.post('/task/openapi/create', {
        apiKey: key,
        workflowId: workflowId,
        nodeInfoList: nodeInfoList || [],
      });

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || '创建任务失败');
      }

      return response.data.data;
    } catch (error) {
      console.error('RunningHub 创建任务失败:', error.message);
      throw new Error(`创建任务失败: ${error.message}`);
    }
  },

  /**
   * 查询任务状态
   * 
   * @param {string} taskId - 任务 ID
   * @param {string} apiKey - API Key（可选）
   * @returns {Promise<string>} - 任务状态: QUEUED | RUNNING | SUCCESS | FAILED
   */
  async getTaskStatus(taskId, apiKey) {
    const key = apiKey || config.apiKey;
    
    if (!key) {
      throw new Error('RunningHub API Key 未配置');
    }

    try {
      const response = await apiClient.post('/task/openapi/status', {
        apiKey: key,
        taskId: taskId,
      });

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || '查询状态失败');
      }

      return response.data.data; // 返回状态字符串
    } catch (error) {
      console.error('RunningHub 查询任务状态失败:', error.message);
      throw new Error(`查询任务状态失败: ${error.message}`);
    }
  },

  /**
   * 查询任务生成结果
   * 
   * @param {string} taskId - 任务 ID
   * @param {string} apiKey - API Key（可选）
   * @returns {Promise<Array<{fileUrl: string, fileType: string, taskCostTime: string, nodeId: string}>>}
   * 
   * 返回示例:
   * [
   *   {
   *     "fileUrl": "https://xxx.png",  // 生成的文件 URL
   *     "fileType": "png",             // 文件类型
   *     "taskCostTime": "83",          // 任务耗时（秒）
   *     "nodeId": "12",                // 输出节点 ID
   *     "consumeCoins": "17"           // 消耗的 RH 币
   *   }
   * ]
   */
  async getTaskOutputs(taskId, apiKey) {
    const key = apiKey || config.apiKey;
    
    if (!key) {
      throw new Error('RunningHub API Key 未配置');
    }

    try {
      const response = await apiClient.post('/task/openapi/outputs', {
        apiKey: key,
        taskId: taskId,
      });

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || '查询结果失败');
      }

      return response.data.data; // 返回结果数组
    } catch (error) {
      console.error('RunningHub 查询任务结果失败:', error.message);
      throw new Error(`查询任务结果失败: ${error.message}`);
    }
  },

  /**
   * 取消任务
   * 
   * @param {string} taskId - 任务 ID
   * @param {string} apiKey - API Key（可选）
   * @returns {Promise<boolean>}
   */
  async cancelTask(taskId, apiKey) {
    const key = apiKey || config.apiKey;
    
    if (!key) {
      throw new Error('RunningHub API Key 未配置');
    }

    try {
      const response = await apiClient.post('/task/openapi/cancel', {
        apiKey: key,
        taskId: taskId,
      });

      return response.data.code === 0;
    } catch (error) {
      console.error('RunningHub 取消任务失败:', error.message);
      throw new Error(`取消任务失败: ${error.message}`);
    }
  },

  /**
   * 获取账户信息
   * 
   * @param {string} apiKey - API Key（可选）
   * @returns {Promise<Object>}
   */
  async getAccountInfo(apiKey) {
    const key = apiKey || config.apiKey;
    
    if (!key) {
      throw new Error('RunningHub API Key 未配置');
    }

    try {
      const response = await apiClient.post('/task/openapi/account', {
        apiKey: key,
      });

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || '获取账户信息失败');
      }

      return response.data.data;
    } catch (error) {
      console.error('RunningHub 获取账户信息失败:', error.message);
      throw new Error(`获取账户信息失败: ${error.message}`);
    }
  },

  /**
   * 获取工作流 JSON
   * 
   * @param {string} workflowId - 工作流 ID
   * @param {string} apiKey - API Key（可选）
   * @returns {Promise<Object>}
   */
  async getWorkflowJson(workflowId, apiKey) {
    const key = apiKey || config.apiKey;
    
    if (!key) {
      throw new Error('RunningHub API Key 未配置');
    }

    try {
      const response = await apiClient.post('/task/openapi/workflow', {
        apiKey: key,
        workflowId: workflowId,
      });

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || '获取工作流失败');
      }

      return response.data.data;
    } catch (error) {
      console.error('RunningHub 获取工作流失败:', error.message);
      throw new Error(`获取工作流失败: ${error.message}`);
    }
  },

  /**
   * 完整的换脸任务流程
   * 
   * @param {Object} params
   * @param {string} params.workflowId - 工作流 ID
   * @param {Buffer} params.photoBuffer - 用户照片 Buffer
   * @param {string} params.photoFileName - 照片文件名
   * @param {string} params.imageNodeId - 图片输入节点 ID
   * @param {string} params.imageFieldName - 图片字段名（默认 "image"）
   * @param {string} params.apiKey - API Key（可选）
   * @returns {Promise<{taskId: string, uploadedFileName: string}>}
   */
  async startFaceSwapTask(params) {
    const {
      workflowId,
      photoBuffer,
      photoFileName,
      imageNodeId,
      imageFieldName = 'image',
      apiKey,
    } = params;

    // 1. 上传用户照片到 RunningHub
    console.log('正在上传用户照片到 RunningHub...');
    const uploadResult = await this.uploadResource(photoBuffer, photoFileName, apiKey);
    console.log('照片上传成功:', uploadResult.fileName);

    // 2. 创建换脸任务
    console.log('正在创建换脸任务...');
    const nodeInfoList = [
      {
        nodeId: imageNodeId,
        fieldName: imageFieldName,
        fieldValue: uploadResult.fileName,
      },
    ];

    const taskResult = await this.createTask(workflowId, nodeInfoList, apiKey);
    console.log('任务创建成功:', taskResult.taskId);

    return {
      taskId: taskResult.taskId,
      uploadedFileName: uploadResult.fileName,
      taskStatus: taskResult.taskStatus,
    };
  },

  /**
   * 等待任务完成（轮询）
   * 
   * @param {string} taskId - 任务 ID
   * @param {Object} options
   * @param {number} options.maxWaitTime - 最大等待时间（毫秒），默认 30 分钟
   * @param {number} options.pollInterval - 轮询间隔（毫秒），默认 5 秒
   * @param {Function} options.onProgress - 进度回调
   * @param {string} options.apiKey - API Key（可选）
   * @returns {Promise<{status: string, outputs: Array}>}
   */
  async waitForTaskComplete(taskId, options = {}) {
    const {
      maxWaitTime = 30 * 60 * 1000, // 30 分钟
      pollInterval = 5000,           // 5 秒
      onProgress,
      apiKey,
    } = options;

    const startTime = Date.now();
    let lastStatus = '';

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getTaskStatus(taskId, apiKey);
      
      if (status !== lastStatus) {
        lastStatus = status;
        if (onProgress) {
          onProgress(status);
        }
      }

      if (status === TASK_STATUS.SUCCESS) {
        const outputs = await this.getTaskOutputs(taskId, apiKey);
        return { status, outputs };
      }

      if (status === TASK_STATUS.FAILED) {
        throw new Error('任务处理失败');
      }

      // 等待一段时间后继续轮询
      await sleep(pollInterval);
    }

    throw new Error('任务超时');
  },
};

/**
 * 根据文件名获取 Content-Type
 * @param {string} fileName 
 * @returns {string}
 */
function getContentType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const contentTypes = {
    // 图片
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    // 音频
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'flac': 'audio/flac',
    // 视频
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'mkv': 'video/x-matroska',
    // 压缩包
    'zip': 'application/zip',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * 休眠函数
 * @param {number} ms 
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  runningHubService,
  TASK_STATUS,
  config,
};

