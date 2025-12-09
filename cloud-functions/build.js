/**
 * 构建脚本
 * 将 shared 目录复制到每个函数目录中
 */

const fs = require('fs');
const path = require('path');

const functionsDir = path.join(__dirname, 'functions');
const sharedDir = path.join(functionsDir, 'shared');

// 需要复制 shared 目录的函数列表
const functions = ['auth', 'user', 'video', 'order', 'upload', 'payment', 'taskCheck', 'admin'];

// 复制目录
function copyDir(src, dest) {
  // 创建目标目录
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // 读取源目录内容
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 删除目录
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        removeDir(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    }
    fs.rmdirSync(dir);
  }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                    构建云函数                              ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// 检查 shared 目录是否存在
if (!fs.existsSync(sharedDir)) {
  console.error('❌ shared 目录不存在:', sharedDir);
  process.exit(1);
}

console.log('📦 复制 shared 目录到各函数...\n');

for (const fn of functions) {
  const fnDir = path.join(functionsDir, fn);
  const fnSharedDir = path.join(fnDir, 'shared');
  
  if (!fs.existsSync(fnDir)) {
    console.log(`⏭️  跳过 ${fn} - 函数目录不存在`);
    continue;
  }
  
  // 删除旧的 shared 目录（如果存在）
  if (fs.existsSync(fnSharedDir)) {
    removeDir(fnSharedDir);
  }
  
  // 复制 shared 目录
  copyDir(sharedDir, fnSharedDir);
  console.log(`✅ ${fn}/shared - 已复制`);
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    构建完成！                              ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('\n下一步: 运行 tcb framework deploy 部署云函数');
console.log('');

