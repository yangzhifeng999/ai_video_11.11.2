/**
 * 数据库连接和操作模块
 * 使用 CloudBase TCB 数据库 (MongoDB)
 */

const cloudbase = require('@cloudbase/node-sdk');

// 环境 ID（优先使用环境变量，否则使用默认值）
const ENV_ID = process.env.TCB_ENV || 'yang0313-7g4dqwd46c63d876';

// 初始化 CloudBase
const app = cloudbase.init({
  env: ENV_ID,
});

// 获取数据库实例
const db = app.database();
const _ = db.command;

// 集合名称常量
const COLLECTIONS = {
  USERS: 'users',
  VIDEOS: 'videos',
  ORDERS: 'orders',
  WORKS: 'works',
  COMMENTS: 'comments',
  LIKES: 'likes',
  COLLECTIONS: 'collections',
  FOLLOWS: 'follows',
  POINT_RECORDS: 'point_records',
  EARNINGS: 'earnings',
  WITHDRAWALS: 'withdrawals',
  MESSAGES: 'messages',
  // AI 任务相关
  TASKS: 'tasks',               // AI 换脸任务
  // 后台管理相关
  ADMIN_USERS: 'admin_users',
  ADMIN_LOGS: 'admin_logs',
  SYSTEM_CONFIG: 'system_config',
  // 审核相关
  REVIEW_LOGS: 'review_logs',
  REVIEW_MESSAGES: 'review_messages',
};

/**
 * 通用数据库操作
 */
const dbUtils = {
  /**
   * 创建文档
   */
  async create(collection, data) {
    const now = new Date().toISOString();
    const result = await db.collection(collection).add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return result.id;
  },

  /**
   * 根据ID查询文档
   */
  async findById(collection, id) {
    const result = await db.collection(collection).doc(id).get();
    return result.data[0] || null;
  },

  /**
   * 条件查询
   */
  async find(collection, query = {}, options = {}) {
    let ref = db.collection(collection).where(query);
    
    if (options.orderBy) {
      ref = ref.orderBy(options.orderBy, options.order || 'desc');
    }
    
    if (options.skip) {
      ref = ref.skip(options.skip);
    }
    
    if (options.limit) {
      ref = ref.limit(options.limit);
    }
    
    const result = await ref.get();
    return result.data;
  },

  /**
   * 查询单条记录
   */
  async findOne(collection, query) {
    const result = await db.collection(collection).where(query).limit(1).get();
    return result.data[0] || null;
  },

  /**
   * 条件查询（简化版）
   */
  async findWhere(collection, query) {
    const result = await db.collection(collection).where(query).get();
    return result.data;
  },

  /**
   * 更新文档
   */
  async update(collection, id, data) {
    const result = await db.collection(collection).doc(id).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return result.updated;
  },

  /**
   * 条件更新
   */
  async updateWhere(collection, query, data) {
    const result = await db.collection(collection).where(query).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return result.updated;
  },

  /**
   * 删除文档（软删除）
   */
  async softDelete(collection, id) {
    return this.update(collection, id, {
      deletedAt: new Date().toISOString(),
    });
  },

  /**
   * 删除文档（硬删除）
   */
  async delete(collection, id) {
    const result = await db.collection(collection).doc(id).remove();
    return result.deleted;
  },

  /**
   * 统计数量
   */
  async count(collection, query = {}) {
    const result = await db.collection(collection).where(query).count();
    return result.total;
  },

  /**
   * 分页查询
   */
  async paginate(collection, query = {}, page = 1, pageSize = 20, options = {}) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.find(collection, query, { ...options, skip, limit: pageSize }),
      this.count(collection, query),
    ]);
    
    return {
      list: data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /**
   * 自增操作
   */
  async increment(collection, id, field, value = 1) {
    const result = await db.collection(collection).doc(id).update({
      [field]: _.inc(value),
      updatedAt: new Date().toISOString(),
    });
    return result.updated;
  },
};

module.exports = {
  app,
  db,
  _,
  COLLECTIONS,
  dbUtils,
};

