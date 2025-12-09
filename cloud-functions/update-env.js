/**
 * 更新云函数环境变量脚本
 * 使用腾讯云 CloudBase SDK 直接更新函数配置
 */

const tencentcloud = require('tencentcloud-sdk-nodejs-tcb');
const TcbClient = tencentcloud.tcb.v20180608.Client;

// 配置
const config = {
  secretId: 'AKIDiPuCHZkiZDet1zkJfrulRp45tXyBAvVs',
  secretKey: 'EE1bzEF3e2OXSAgy2yhCTZUCgwzpRq2z',
  region: 'ap-shanghai',
  envId: 'yang0313-7g4dqwd46c63d876',
};

// 环境变量
const envVariables = {
  TCB_ENV: 'yang0313-7g4dqwd46c63d876',
  JWT_SECRET: '306f9b145624e3a46f7f6335ea8f4364e660bed9f17c2a0f281d877304f2ad24',
  TENCENT_SECRET_ID: 'AKIDiPuCHZkiZDet1zkJfrulRp45tXyBAvVs',
  TENCENT_SECRET_KEY: 'EE1bzEF3e2OXSAgy2yhCTZUCgwzpRq2z',
  TENCENT_REGION: 'ap-shanghai',
  COS_BUCKET: 'yang0313-storage-1318057968',
  COS_REGION: 'ap-shanghai',
};

// 需要更新的函数列表
const functions = ['admin', 'auth', 'user', 'video', 'order', 'upload', 'payment'];

// 创建客户端
const client = new TcbClient({
  credential: {
    secretId: config.secretId,
    secretKey: config.secretKey,
  },
  region: config.region,
  profile: {
    httpProfile: {
      endpoint: 'tcb.tencentcloudapi.com',
    },
  },
});

// 更新单个函数的环境变量
async function updateFunctionEnv(functionName) {
  // 构建环境变量数组
  const envParams = Object.entries(envVariables).map(([key, value]) => ({
    Key: key,
    Value: value,
  }));

  const params = {
    EnvId: config.envId,
    FunctionName: functionName,
    EnvVariables: envParams,
  };

  try {
    console.log(`正在更新 ${functionName} 的环境变量...`);
    const result = await client.CreateCloudBaseRunServerVersion(params);
    console.log(`✅ ${functionName} 环境变量更新成功`);
    return result;
  } catch (error) {
    console.error(`❌ ${functionName} 环境变量更新失败:`, error.message);
    // 尝试其他方法
    return null;
  }
}

// 使用 DescribeCloudBaseBuildService 获取构建状态
async function checkBuildStatus() {
  try {
    const result = await client.DescribeCloudBaseBuildService({
      EnvId: config.envId,
    });
    console.log('构建状态:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.log('获取构建状态失败:', error.message);
    return null;
  }
}

// 主函数
async function main() {
  console.log('开始检查云开发状态...\n');
  
  // 先检查构建状态
  await checkBuildStatus();
  
  console.log('\n尝试更新函数环境变量...\n');
  
  for (const fn of functions) {
    try {
      await updateFunctionEnv(fn);
      // 等待 2 秒避免 API 限流
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`函数 ${fn} 更新失败，继续下一个...`);
    }
  }
  
  console.log('\n操作完成！');
}

main().catch(console.error);
