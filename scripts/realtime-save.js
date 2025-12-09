/**
 * 实时文件监控和自动提交脚本
 * 监听文件变化，每次变化后自动提交到Git
 * 保留最近5个提交历史，支持回退功能
 */

const chokidar = require('chokidar');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置
const CONFIG = {
  // 监控的目录和文件
  watchPaths: [
    'src/**/*',
    'public/**/*',
    '*.{ts,tsx,js,jsx,json,css,html,md}',
  ],
  // 忽略的文件和目录
  ignored: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.git/**',
    '**/logs/**',
    '**/*.log',
    '**/.vite/**',
    '**/coverage/**',
  ],
  // 防抖延迟（毫秒）- 文件变化后等待500ms再提交
  debounceDelay: 500,
  // 最大保留的提交数量（用于回退功能）
  maxCommits: 20,
};

// 日志文件路径
const logDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'realtime-save.log');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志函数
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  
  console.log(logMessage);
  
  try {
    fs.appendFileSync(logFile, logMessage + '\n');
  } catch (error) {
    console.error('写入日志失败:', error.message);
  }
}

// 执行Git命令
function execGit(command, options = {}) {
  try {
    const result = execSync(command, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 检查是否有未提交的更改
function hasChanges() {
  const result = execGit('git status --porcelain', { silent: true });
  if (!result.success) {
    return false;
  }
  return result.output.trim().length > 0;
}

// 自动提交
function autoCommit() {
  if (!hasChanges()) {
    log('没有检测到文件变化，跳过提交');
    return;
  }

  log('检测到文件变化，开始自动提交...');

  // 添加所有更改
  const addResult = execGit('git add -A');
  if (!addResult.success) {
    log('添加文件到暂存区失败', 'error');
    return;
  }

  // 生成提交信息
  const timestamp = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const commitMessage = `chore: 实时保存 - ${timestamp}`;

  // 提交
  const commitResult = execGit(`git commit -m "${commitMessage}"`);
  if (!commitResult.success) {
    log('提交失败', 'error');
    return;
  }

  log(`✅ 自动提交成功: ${commitMessage}`);

  // 清理旧的提交（保留最近maxCommits个）
  cleanupOldCommits();
}

// 清理旧的提交，只保留最近N个
function cleanupOldCommits() {
  try {
    // 获取所有提交的哈希值
    const result = execGit('git log --oneline --format="%H"', { silent: true });
    if (!result.success) {
      return;
    }

    const commits = result.output.trim().split('\n').filter(Boolean);
    
    // 如果提交数量超过maxCommits，需要清理
    if (commits.length > CONFIG.maxCommits) {
      log(`当前有 ${commits.length} 个提交，保留最近 ${CONFIG.maxCommits} 个`);
      
      // 注意：这里我们不删除提交，而是创建一个标记分支来记录历史
      // 实际回退时使用 git reset 或 git revert
      // 为了安全，我们只记录日志，不实际删除提交
      log('提交历史已保留，可通过回退脚本恢复', 'info');
    }
  } catch (error) {
    log(`清理提交历史时出错: ${error.message}`, 'error');
  }
}

// 防抖定时器
let debounceTimer = null;

// 文件变化处理函数
function handleFileChange(event, filePath) {
  // 忽略日志文件自身的变化
  if (filePath.includes('logs') || filePath.includes('.log')) {
    return;
  }

  log(`文件变化: ${event} - ${filePath}`);

  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // 设置新的定时器
  debounceTimer = setTimeout(() => {
    autoCommit();
    debounceTimer = null;
  }, CONFIG.debounceDelay);
}

// 启动文件监控
function startWatching() {
  log('====================================');
  log('实时文件监控和自动保存服务已启动');
  log(`监控路径: ${CONFIG.watchPaths.join(', ')}`);
  log(`防抖延迟: ${CONFIG.debounceDelay}ms`);
  log(`最大保留提交数: ${CONFIG.maxCommits}`);
  log('====================================');
  log('服务运行中，按 Ctrl+C 停止...\n');

  // 创建文件监控器
  const watcher = chokidar.watch(CONFIG.watchPaths, {
    ignored: CONFIG.ignored,
    ignoreInitial: true, // 忽略初始扫描
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 200, // 文件写入稳定后200ms才触发
      pollInterval: 100,
    },
  });

  // 监听文件变化事件
  watcher
    .on('add', (path) => handleFileChange('add', path))
    .on('change', (path) => handleFileChange('change', path))
    .on('unlink', (path) => handleFileChange('unlink', path))
    .on('error', (error) => log(`监控错误: ${error.message}`, 'error'))
    .on('ready', () => {
      log('文件监控器已就绪，开始监听文件变化...\n');
    });

  // 优雅退出
  process.on('SIGINT', () => {
    log('\n正在停止实时保存服务...');
    watcher.close().then(() => {
      log('服务已停止');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    log('\n正在停止实时保存服务...');
    watcher.close().then(() => {
      log('服务已停止');
      process.exit(0);
    });
  });
}

// 启动服务
startWatching();




