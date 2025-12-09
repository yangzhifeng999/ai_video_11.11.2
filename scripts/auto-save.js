/**
 * 自动保存版本守护进程
 * 每2小时自动执行一次git提交
 */
const cron = require('node-cron');
const { autoCommit } = require('./auto-commit');

// 每2小时执行一次 (0 */2 * * * 表示每2小时的0分执行)
// 格式: 分钟 小时 日 月 星期
// 0 */2 * * * 表示每2小时的第0分钟执行
const schedule = '0 */2 * * *';

console.log('====================================');
console.log('自动保存版本服务已启动');
console.log(`执行频率: 每2小时一次`);
console.log(`调度表达式: ${schedule}`);
console.log('====================================');
console.log('服务运行中，按 Ctrl+C 停止...\n');

// 立即执行一次
console.log('执行初始提交...');
autoCommit().then(() => {
  console.log('初始提交完成\n');
}).catch((error) => {
  console.error('初始提交失败:', error.message);
});

// 设置定时任务
const task = cron.schedule(schedule, async () => {
  console.log('\n=== 定时任务触发 ===');
  await autoCommit();
  console.log('=== 任务完成 ===\n');
}, {
  scheduled: true,
  timezone: "Asia/Shanghai"
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n正在停止自动保存服务...');
  task.stop();
  console.log('服务已停止');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在停止自动保存服务...');
  task.stop();
  console.log('服务已停止');
  process.exit(0);
});

