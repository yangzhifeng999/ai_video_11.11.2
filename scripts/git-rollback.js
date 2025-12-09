/**
 * Git回退脚本
 * 支持回退到之前的N个版本（最多20步）
 * 使用方法: node scripts/git-rollback.js [steps]
 * 例如: node scripts/git-rollback.js 3  (回退3步)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// 日志文件路径
const logDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'git-rollback.log');

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

// 获取提交历史
function getCommitHistory(maxCount = 20) {
  const result = execGit(`git log --oneline -n ${maxCount}`, { silent: true });
  if (!result.success) {
    return [];
  }
  
  return result.output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line, index) => {
      const [hash, ...messageParts] = line.split(' ');
      return {
        index: index + 1,
        hash: hash.substring(0, 7),
        fullHash: hash,
        message: messageParts.join(' '),
      };
    });
}

// 显示提交历史
function showCommitHistory() {
  log('\n=== 最近的提交历史（最多20条）===');
  const commits = getCommitHistory(20);
  
  if (commits.length === 0) {
    log('没有找到提交历史', 'warn');
    return commits;
  }

  commits.forEach((commit) => {
    console.log(`  ${commit.index}. [${commit.hash}] ${commit.message}`);
  });
  
  log('======================\n');
  return commits;
}

// 回退到指定步数
function rollback(steps) {
  if (steps < 1 || steps > 20) {
    log('错误: 回退步数必须在 1-20 之间', 'error');
    return false;
  }

  const commits = getCommitHistory(steps + 1);
  if (commits.length < steps + 1) {
    log(`错误: 只有 ${commits.length} 个提交，无法回退 ${steps} 步`, 'error');
    return false;
  }

  const targetCommit = commits[steps];
  log(`准备回退到: [${targetCommit.hash}] ${targetCommit.message}`);

  // 检查是否有未提交的更改
  if (hasUncommittedChanges()) {
    log('警告: 检测到未提交的更改', 'warn');
    log('建议先提交或暂存当前更改，然后再回退', 'warn');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question('是否继续回退？(y/N): ', (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          performRollback(targetCommit.fullHash, steps);
          resolve(true);
        } else {
          log('回退操作已取消', 'info');
          resolve(false);
        }
      });
    });
  } else {
    return performRollback(targetCommit.fullHash, steps);
  }
}

// 检查是否有未提交的更改
function hasUncommittedChanges() {
  const result = execGit('git status --porcelain', { silent: true });
  if (!result.success) {
    return false;
  }
  return result.output.trim().length > 0;
}

// 执行回退操作
function performRollback(targetHash, steps) {
  log(`开始回退 ${steps} 步到提交 ${targetHash}...`);

  // 使用 git reset --soft 保留工作区的更改
  // 使用 git reset --hard 完全回退（危险）
  // 这里使用 --soft 更安全
  const result = execGit(`git reset --soft ${targetHash}`);
  
  if (!result.success) {
    log(`回退失败: ${result.error}`, 'error');
    return false;
  }

  log(`✅ 成功回退 ${steps} 步到提交 ${targetHash}`, 'success');
  log('注意: 更改已保留在暂存区，可以使用以下命令:');
  log('  - git commit 重新提交');
  log('  - git reset HEAD 取消暂存');
  log('  - git checkout . 丢弃更改');
  
  return true;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const steps = args[0] ? parseInt(args[0], 10) : null;

  log('====================================');
  log('Git 回退工具');
  log('====================================\n');

  // 显示提交历史
  const commits = showCommitHistory();

  if (commits.length === 0) {
    log('没有提交历史，无法回退', 'error');
    process.exit(1);
  }

  // 如果没有指定步数，显示交互式菜单
  if (!steps || isNaN(steps)) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`请输入要回退的步数 (1-20，当前有 ${commits.length} 个提交): `, (answer) => {
      rl.close();
      const inputSteps = parseInt(answer, 10);
      
      if (isNaN(inputSteps) || inputSteps < 1 || inputSteps > 20) {
        log('无效的输入，请输入 1-20 之间的数字', 'error');
        process.exit(1);
      }

      if (inputSteps >= commits.length) {
        log(`错误: 只有 ${commits.length} 个提交，无法回退 ${inputSteps} 步`, 'error');
        process.exit(1);
      }

      rollback(inputSteps);
    });
  } else {
    if (steps >= commits.length) {
      log(`错误: 只有 ${commits.length} 个提交，无法回退 ${steps} 步`, 'error');
      process.exit(1);
    }
    rollback(steps);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { rollback, showCommitHistory };




