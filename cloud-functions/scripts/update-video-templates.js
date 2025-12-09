/**
 * 更新视频模板，添加 RunningHub 配置
 * 
 * 使用方法：
 * 1. 编辑本文件，在 VIDEO_CONFIGS 中配置您的视频模板
 * 2. 运行: node scripts/update-video-templates.js
 */

const cloudbase = require('@cloudbase/node-sdk');

const ENV_ID = process.env.TCB_ENV || 'yang0313-7g4dqwd46c63d876';

const app = cloudbase.init({ env: ENV_ID });
const db = app.database();

/**
 * 视频模板配置映射
 * 
 * 格式：{ videoId: { workflowId, imageNodeId, imageFieldName, paymentPageId } }
 * 
 * 如何获取 workflowId:
 * 1. 登录 https://www.runninghub.cn
 * 2. 打开目标工作流
 * 3. 查看地址栏，如：https://www.runninghub.cn/#/workflow/1850925505116598274
 * 4. workflowId 就是 1850925505116598274
 * 
 * 如何获取 imageNodeId 和 imageFieldName:
 * 1. 在工作流中找到图片输入节点（LoadImage）
 * 2. 查看节点 ID（通常是数字，如 10）
 * 3. 查看字段名（通常是 "image"）
 */
const VIDEO_CONFIGS = {
  // 示例配置（请根据实际情况修改）
  // 'video_001': {
  //   runningHubWorkflowId: '1850925505116598274',
  //   imageNodeId: '10',
  //   imageFieldName: 'image',
  //   paymentPageId: 'payment_page_001',
  // },
  // 'video_002': {
  //   runningHubWorkflowId: '1850925505116598275',
  //   imageNodeId: '10',
  //   imageFieldName: 'image',
  //   paymentPageId: 'payment_page_002',
  // },
};

/**
 * 更新单个视频模板
 */
async function updateVideoTemplate(videoId, config) {
  try {
    // 检查视频是否存在
    const videoDoc = await db.collection('videos').doc(videoId).get();
    
    if (videoDoc.data.length === 0) {
      console.log(`❌ 视频 ${videoId} 不存在，跳过`);
      return false;
    }

    const video = videoDoc.data[0];
    
    // 准备更新数据
    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    // 添加 RunningHub 配置
    if (config.runningHubWorkflowId) {
      updateData.runningHubWorkflowId = config.runningHubWorkflowId;
    }
    
    if (config.imageNodeId) {
      updateData.imageNodeId = config.imageNodeId;
    } else {
      updateData.imageNodeId = '10'; // 默认值
    }
    
    if (config.imageFieldName) {
      updateData.imageFieldName = config.imageFieldName;
    } else {
      updateData.imageFieldName = 'image'; // 默认值
    }
    
    if (config.paymentPageId) {
      updateData.paymentPageId = config.paymentPageId;
    }

    // 更新视频
    await db.collection('videos').doc(videoId).update(updateData);

    console.log(`✅ 已更新视频: ${videoId}`);
    console.log(`   - 标题: ${video.title || '未设置'}`);
    console.log(`   - Workflow ID: ${updateData.runningHubWorkflowId || '未设置'}`);
    console.log(`   - Image Node ID: ${updateData.imageNodeId}`);
    console.log(`   - Image Field: ${updateData.imageFieldName}`);
    console.log(`   - Payment Page: ${updateData.paymentPageId || '未设置'}\n`);
    
    return true;
  } catch (err) {
    console.error(`❌ 更新视频 ${videoId} 失败:`, err.message);
    return false;
  }
}

/**
 * 批量更新所有视频模板
 */
async function updateAllVideoTemplates() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           更新视频模板 RunningHub 配置                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (Object.keys(VIDEO_CONFIGS).length === 0) {
    console.log('⚠️  警告：VIDEO_CONFIGS 配置为空！');
    console.log('\n请在脚本中配置 VIDEO_CONFIGS 对象：');
    console.log(`
const VIDEO_CONFIGS = {
  'video_001': {
    runningHubWorkflowId: '1850925505116598274',
    imageNodeId: '10',
    imageFieldName: 'image',
    paymentPageId: 'payment_page_001',
  },
  // 添加更多视频配置...
};
`);
    console.log('\n如何获取配置信息：');
    console.log('1. workflowId: 在 RunningHub 工作流地址栏中获取');
    console.log('2. imageNodeId: 查看工作流中图片输入节点的 ID');
    console.log('3. imageFieldName: 通常是 "image"');
    console.log('4. paymentPageId: 对应的支付页面 ID\n');
    return;
  }

  console.log(`准备更新 ${Object.keys(VIDEO_CONFIGS).length} 个视频模板...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const [videoId, config] of Object.entries(VIDEO_CONFIGS)) {
    const success = await updateVideoTemplate(videoId, config);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    更新完成                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`❌ 失败: ${failCount} 个`);
  console.log(`📊 总计: ${Object.keys(VIDEO_CONFIGS).length} 个\n`);
}

// 执行更新
updateAllVideoTemplates().catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});

