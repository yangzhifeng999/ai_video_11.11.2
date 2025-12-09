/**
 * API 接口测试脚本
 * 使用 Node.js 内置的 https 模块
 */

const https = require('https');

// 忽略 SSL 证书验证（用于测试环境）
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'yang0313-7g4dqwd46c63d876-1318057968.ap-shanghai.app.tcloudbase.com';

// 测试结果记录
const results = [];

// 发起 HTTPS 请求
function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: json
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    // 设置超时
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 打印结果
function printResult(name, success, details) {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  results.push({ name, success, details });
}

// 测试 CORS（OPTIONS 请求）
async function testCORS() {
  console.log('\n📋 测试 1: CORS 预检请求 (OPTIONS)');
  console.log('─'.repeat(50));
  
  try {
    const res = await request('OPTIONS', '/api/auth/login', null, {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    });
    
    const corsOrigin = res.headers['access-control-allow-origin'];
    const corsMethods = res.headers['access-control-allow-methods'];
    const corsHeaders = res.headers['access-control-allow-headers'];
    
    if (corsOrigin && corsMethods) {
      printResult('CORS 配置正常', true, `Origin: ${corsOrigin}, Methods: ${corsMethods}`);
      return true;
    } else {
      printResult('CORS 配置缺失', false, `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.body).substring(0, 100)}`);
      return false;
    }
  } catch (e) {
    printResult('CORS 测试失败', false, e.message);
    return false;
  }
}

// 测试视频列表接口（公开，无需认证）
async function testVideoList() {
  console.log('\n📋 测试 2: 获取视频列表 (GET /api/videos)');
  console.log('─'.repeat(50));
  
  try {
    const res = await request('GET', '/api/videos?page=1&pageSize=10');
    
    if (res.statusCode === 200 && res.body.code === 0) {
      printResult('视频列表接口正常', true, `返回 ${res.body.data?.list?.length || 0} 条数据`);
      return true;
    } else if (res.statusCode === 200) {
      printResult('视频列表接口响应', true, `code: ${res.body.code}, message: ${res.body.message}`);
      return true;
    } else {
      printResult('视频列表接口异常', false, `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.body).substring(0, 200)}`);
      return false;
    }
  } catch (e) {
    printResult('视频列表测试失败', false, e.message);
    return false;
  }
}

// 测试注册接口
async function testRegister() {
  console.log('\n📋 测试 3: 用户注册 (POST /api/auth/register)');
  console.log('─'.repeat(50));
  
  try {
    const res = await request('POST', '/api/auth/register', {
      phone: '13800138000',
      password: '123456',
      code: '123456'
    });
    
    // 状态码 400 但返回业务错误码也是正常响应
    if (res.body.code === 0) {
      printResult('注册接口正常', true, `新用户注册成功`);
      return true;
    } else if (res.body.code === 3002) {
      // 用户已存在 - 这是正常的业务逻辑
      printResult('注册接口正常', true, `用户已存在（正常业务逻辑）`);
      return true;
    } else {
      printResult('注册接口响应', false, `code: ${res.body.code}, message: ${res.body.message}`);
      return false;
    }
  } catch (e) {
    printResult('注册测试失败', false, e.message);
    return false;
  }
}

// 测试登录接口
async function testLogin() {
  console.log('\n📋 测试 4: 用户登录 (POST /api/auth/login)');
  console.log('─'.repeat(50));
  
  try {
    const res = await request('POST', '/api/auth/login', {
      phone: '13800138000',
      password: '123456'
    });
    
    if (res.statusCode === 200) {
      if (res.body.code === 0 && res.body.data && res.body.data.token) {
        printResult('登录接口正常', true, `获取到 Token: ${res.body.data.token.substring(0, 30)}...`);
        return res.body.data.token;
      } else {
        printResult('登录接口响应', true, `code: ${res.body.code}, message: ${res.body.message}`);
        return null;
      }
    } else {
      printResult('登录接口异常', false, `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.body).substring(0, 200)}`);
      return null;
    }
  } catch (e) {
    printResult('登录测试失败', false, e.message);
    return null;
  }
}

// 测试获取用户信息（需要认证）
async function testUserProfile(token) {
  console.log('\n📋 测试 5: 获取用户信息 (GET /api/user/profile)');
  console.log('─'.repeat(50));
  
  if (!token) {
    printResult('跳过用户信息测试', false, '没有有效的 Token');
    return false;
  }
  
  try {
    const res = await request('GET', '/api/user/profile', null, {
      'Authorization': `Bearer ${token}`
    });
    
    if (res.statusCode === 200 && res.body.code === 0) {
      printResult('用户信息接口正常', true, `用户ID: ${res.body.data?.user?.id || res.body.data?.id}`);
      return true;
    } else if (res.statusCode === 200) {
      printResult('用户信息接口响应', true, `code: ${res.body.code}, message: ${res.body.message}`);
      return true;
    } else {
      printResult('用户信息接口异常', false, `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.body).substring(0, 200)}`);
      return false;
    }
  } catch (e) {
    printResult('用户信息测试失败', false, e.message);
    return false;
  }
}

// 测试订单列表（需要认证）
async function testOrderList(token) {
  console.log('\n📋 测试 6: 获取订单列表 (GET /api/orders)');
  console.log('─'.repeat(50));
  
  if (!token) {
    printResult('跳过订单列表测试', false, '没有有效的 Token');
    return false;
  }
  
  try {
    const res = await request('GET', '/api/orders?page=1&pageSize=10', null, {
      'Authorization': `Bearer ${token}`
    });
    
    if (res.statusCode === 200) {
      printResult('订单列表接口正常', true, `code: ${res.body.code}, message: ${res.body.message}`);
      return true;
    } else {
      printResult('订单列表接口异常', false, `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.body).substring(0, 200)}`);
      return false;
    }
  } catch (e) {
    printResult('订单列表测试失败', false, e.message);
    return false;
  }
}

// 测试上传签名（需要认证）
async function testUploadSign(token) {
  console.log('\n📋 测试 7: 获取COS上传签名 (POST /api/upload/cos-sign)');
  console.log('─'.repeat(50));
  
  if (!token) {
    printResult('跳过上传签名测试', false, '没有有效的 Token');
    return false;
  }
  
  try {
    const res = await request('POST', '/api/upload/cos-sign', {
      fileName: 'test.jpg',
      fileType: 'image',
      path: 'test/'
    }, {
      'Authorization': `Bearer ${token}`
    });
    
    if (res.statusCode === 200) {
      printResult('上传签名接口正常', true, `code: ${res.body.code}, message: ${res.body.message}`);
      return true;
    } else {
      printResult('上传签名接口异常', false, `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.body).substring(0, 200)}`);
      return false;
    }
  } catch (e) {
    printResult('上传签名测试失败', false, e.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    API 接口测试                            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ 基础地址: https://${BASE_URL} ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // 执行测试
  await testCORS();
  await testVideoList();
  await testRegister();
  const token = await testLogin();
  await testUserProfile(token);
  await testOrderList(token);
  await testUploadSign(token);
  
  // 打印总结
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    测试结果总结                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n总计: ${results.length} 项测试`);
  console.log(`✅ 通过: ${passed} 项`);
  console.log(`❌ 失败: ${failed} 项`);
  
  if (failed > 0) {
    console.log('\n❌ 失败的测试:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.details}`);
    });
  }
  
  console.log('\n');
}

// 运行测试
main().catch(console.error);

