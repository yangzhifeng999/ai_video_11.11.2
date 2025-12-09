/**
 * 创建默认管理员账号
 */

const cloudbase = require('@cloudbase/node-sdk');
const bcrypt = require('bcryptjs');

const ENV_ID = 'yang0313-7g4dqwd46c63d876';

async function createAdmin() {
  try {
    console.log('初始化 CloudBase...');
    const app = cloudbase.init({
      env: ENV_ID,
    });

    const db = app.database();
    
    console.log('检查管理员是否存在...');
    const existingAdmin = await db.collection('admin_users')
      .where({ username: 'admin' })
      .get();

    if (existingAdmin.data && existingAdmin.data.length > 0) {
      console.log('管理员已存在，删除旧记录...');
      await db.collection('admin_users')
        .doc(existingAdmin.data[0]._id)
        .remove();
    }

    console.log('创建新管理员...');
    const hashedPassword = bcrypt.hashSync('yang0313', 10);
    console.log('加密密码:', hashedPassword);

    const result = await db.collection('admin_users').add({
      _id: 'admin001',
      username: 'admin',
      password: hashedPassword,
      nickname: '超级管理员',
      role: 'super_admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ 管理员创建成功！');
    console.log('账号: admin');
    console.log('密码: yang0313');
    console.log('结果:', result);

  } catch (error) {
    console.error('❌ 创建失败:', error);
  }
}

createAdmin();



