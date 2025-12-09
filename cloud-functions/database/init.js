/**
 * 数据库初始化脚本
 * 用于创建集合、索引和初始数据
 * 
 * 使用方法：
 * 1. 在腾讯云控制台打开云函数
 * 2. 创建一个临时函数，将此脚本内容复制进去
 * 3. 执行一次即可
 */

const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({
  env: process.env.TCB_ENV || 'your-env-id',
});

const db = app.database();

// 集合定义
const collections = [
  {
    name: 'users',
    indexes: [
      { fields: [{ name: 'phone', direction: 'asc' }], unique: true },
      { fields: [{ name: 'wxOpenId', direction: 'asc' }], unique: true },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
  {
    name: 'videos',
    indexes: [
      { fields: [{ name: 'creatorId', direction: 'asc' }] },
      { fields: [{ name: 'category', direction: 'asc' }] },
      { fields: [{ name: 'status', direction: 'asc' }] },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
  {
    name: 'orders',
    indexes: [
      { fields: [{ name: 'userId', direction: 'asc' }] },
      { fields: [{ name: 'orderNo', direction: 'asc' }], unique: true },
      { fields: [{ name: 'status', direction: 'asc' }] },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
  {
    name: 'works',
    indexes: [
      { fields: [{ name: 'creatorId', direction: 'asc' }] },
      { fields: [{ name: 'videoId', direction: 'asc' }] },
      { fields: [{ name: 'status', direction: 'asc' }] },
    ],
  },
  {
    name: 'comments',
    indexes: [
      { fields: [{ name: 'videoId', direction: 'asc' }] },
      { fields: [{ name: 'userId', direction: 'asc' }] },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
  {
    name: 'likes',
    indexes: [
      { fields: [{ name: 'userId', direction: 'asc' }, { name: 'videoId', direction: 'asc' }], unique: true },
    ],
  },
  {
    name: 'collections',
    indexes: [
      { fields: [{ name: 'userId', direction: 'asc' }, { name: 'videoId', direction: 'asc' }], unique: true },
    ],
  },
  {
    name: 'follows',
    indexes: [
      { fields: [{ name: 'followerId', direction: 'asc' }, { name: 'followingId', direction: 'asc' }], unique: true },
      { fields: [{ name: 'followingId', direction: 'asc' }] },
    ],
  },
  {
    name: 'point_records',
    indexes: [
      { fields: [{ name: 'userId', direction: 'asc' }] },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
  {
    name: 'earnings',
    indexes: [
      { fields: [{ name: 'creatorId', direction: 'asc' }] },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
  {
    name: 'withdrawals',
    indexes: [
      { fields: [{ name: 'userId', direction: 'asc' }] },
      { fields: [{ name: 'status', direction: 'asc' }] },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
  {
    name: 'messages',
    indexes: [
      { fields: [{ name: 'userId', direction: 'asc' }] },
      { fields: [{ name: 'isRead', direction: 'asc' }] },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
  {
    name: 'admin_users',
    indexes: [
      { fields: [{ name: 'username', direction: 'asc' }], unique: true },
    ],
  },
  {
    name: 'admin_logs',
    indexes: [
      { fields: [{ name: 'adminId', direction: 'asc' }] },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
  {
    name: 'system_config',
    indexes: [
      { fields: [{ name: 'key', direction: 'asc' }], unique: true },
    ],
  },
  // tasks 集合 - AI换脸任务
  {
    name: 'tasks',
    indexes: [
      { fields: [{ name: 'taskId', direction: 'asc' }], unique: true },
      { fields: [{ name: 'userId', direction: 'asc' }] },
      { fields: [{ name: 'orderId', direction: 'asc' }] },
      { fields: [{ name: 'status', direction: 'asc' }] },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
  // review_logs 集合 - 审核日志
  {
    name: 'review_logs',
    indexes: [
      { fields: [{ name: 'videoId', direction: 'asc' }] },
      { fields: [{ name: 'operatorId', direction: 'asc' }] },
      { fields: [{ name: 'action', direction: 'asc' }] },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
  // review_messages 集合 - 审核沟通记录
  {
    name: 'review_messages',
    indexes: [
      { fields: [{ name: 'videoId', direction: 'asc' }] },
      { fields: [{ name: 'senderId', direction: 'asc' }] },
      { fields: [{ name: 'createdAt', direction: 'desc' }] },
    ],
  },
];

/**
 * 主函数
 */
exports.main = async (event, context) => {
  const results = [];

  for (const collection of collections) {
    try {
      // 创建集合
      await db.createCollection(collection.name);
      console.log(`集合 ${collection.name} 创建成功`);
      results.push({ collection: collection.name, created: true });
    } catch (err) {
      if (err.code === 'DATABASE_COLLECTION_EXIST') {
        console.log(`集合 ${collection.name} 已存在`);
        results.push({ collection: collection.name, created: false, exists: true });
      } else {
        console.error(`创建集合 ${collection.name} 失败:`, err);
        results.push({ collection: collection.name, created: false, error: err.message });
      }
    }

    // 创建索引
    if (collection.indexes) {
      for (const index of collection.indexes) {
        try {
          // TODO: CloudBase SDK 创建索引
          // 注意：需要在控制台手动创建索引，或使用 CLI
          console.log(`需要为 ${collection.name} 创建索引:`, index.fields);
        } catch (err) {
          console.error(`创建索引失败:`, err);
        }
      }
    }
  }

  // 创建默认管理员
  try {
    const bcrypt = require('bcryptjs');
    const adminExists = await db.collection('admin_users').where({ username: 'admin' }).count();
    
    if (adminExists.total === 0) {
      await db.collection('admin_users').add({
        username: 'admin',
        password: bcrypt.hashSync('yang0313', 10),
        nickname: '超级管理员',
        role: 'super_admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('默认管理员创建成功 (账号: admin, 密码: yang0313)');
      results.push({ admin: true, created: true });
    } else {
      console.log('管理员已存在');
      results.push({ admin: true, exists: true });
    }
  } catch (err) {
    console.error('创建管理员失败:', err);
    results.push({ admin: true, error: err.message });
  }

  // 创建默认系统配置
  try {
    const configExists = await db.collection('system_config').where({ key: 'main' }).count();
    
    if (configExists.total === 0) {
      await db.collection('system_config').add({
        key: 'main',
        // 平台配置
        platformName: '嘿哈',
        platformLogo: '',
        // 费用配置
        platformRate: 0.3, // 平台抽成比例
        minWithdrawAmount: 1000, // 最低提现金额（分）
        // 新用户配置
        newUserPoints: 1000, // 新用户赠送积分
        dailyCheckInPoints: 10, // 每日签到积分
        // 功能开关
        enableWechatLogin: true,
        enableAlipay: true,
        enableWithdraw: true,
        // 其他
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('默认系统配置创建成功');
      results.push({ config: true, created: true });
    } else {
      console.log('系统配置已存在');
      results.push({ config: true, exists: true });
    }
  } catch (err) {
    console.error('创建系统配置失败:', err);
    results.push({ config: true, error: err.message });
  }

  return {
    success: true,
    results,
  };
};

