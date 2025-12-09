/**
 * 数据库初始化云函�?
 * 用于创建集合和初始管理员账号
 */

const cloudbase = require('@cloudbase/node-sdk');
const bcrypt = require('bcryptjs');

// 环境 ID
const ENV_ID = process.env.TCB_ENV || 'yang0313-7g4dqwd46c63d876';

// 初始�?CloudBase
const app = cloudbase.init({
  env: ENV_ID,
});

const db = app.database();

// 需要创建的集合
const COLLECTIONS = [
  'users',
  'videos',
  'orders',
  'works',
  'comments',
  'likes',
  'collections',
  'follows',
  'point_records',
  'earnings',
  'withdrawals',
  'messages',
  'tasks',
  'admin_users',
  'admin_logs',
  'system_config',
  'review_logs',
  'review_messages',
];

/**
 * 主处理函�?
 */
exports.main = async (event, context) => {
  const results = {
    collections: [],
    admin: null,
    config: null,
  };

  console.log('开始初始化数据�?..');
  console.log('环境ID:', ENV_ID);

  // 1. 创建集合
  for (const collName of COLLECTIONS) {
    try {
      await db.createCollection(collName);
      console.log(`集合 ${collName} 创建成功`);
      results.collections.push({ name: collName, created: true });
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log(`集合 ${collName} 已存在`);
        results.collections.push({ name: collName, exists: true });
      } else {
        console.error(`创建集合 ${collName} 失败:`, err.message);
        results.collections.push({ name: collName, error: err.message });
      }
    }
  }

  // 2. 创建/更新管理员账�?
  try {
    console.log('检查管理员账号...');
    const existingAdmin = await db.collection('admin_users')
      .where({ username: 'admin' })
      .get();

    if (existingAdmin.data && existingAdmin.data.length > 0) {
      // 更新密码
      console.log('更新管理员密�?..');
      const hashedPassword = bcrypt.hashSync('yang0313', 10);
      await db.collection('admin_users')
        .doc(existingAdmin.data[0]._id)
        .update({
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        });
      results.admin = { updated: true, id: existingAdmin.data[0]._id };
      console.log('管理员密码已更新');
    } else {
      // 创建新管理员
      console.log('创建新管理员...');
      const hashedPassword = bcrypt.hashSync('yang0313', 10);
      const result = await db.collection('admin_users').add({
        username: 'admin',
        password: hashedPassword,
        nickname: '超级管理�?,
        role: 'super_admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      results.admin = { created: true, id: result.id };
      console.log('管理员创建成功，ID:', result.id);
    }
  } catch (err) {
    console.error('管理员操作失�?', err);
    results.admin = { error: err.message };
  }

  // 3. 创建默认系统配置
  try {
    console.log('检查系统配�?..');
    const existingConfig = await db.collection('system_config')
      .where({ key: 'main' })
      .get();

    if (!existingConfig.data || existingConfig.data.length === 0) {
      console.log('创建默认系统配置...');
      await db.collection('system_config').add({
        key: 'main',
        platformName: '嘿哈',
        platformLogo: '',
        platformRate: 0.3,
        minWithdrawAmount: 1000,
        newUserPoints: 1000,
        dailyCheckInPoints: 10,
        enableWechatLogin: true,
        enableAlipay: true,
        enableWithdraw: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      results.config = { created: true };
      console.log('系统配置创建成功');
    } else {
      results.config = { exists: true };
      console.log('系统配置已存�?);
    }
  } catch (err) {
    console.error('系统配置操作失败:', err);
    results.config = { error: err.message };
  }

  console.log('初始化完�?);
  console.log('============================================');
  console.log('管理员账�? admin');
  console.log('管理员密�? yang0313');
  console.log('============================================');

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      code: 0,
      message: '初始化完�?,
      data: results,
    }),
  };
};

