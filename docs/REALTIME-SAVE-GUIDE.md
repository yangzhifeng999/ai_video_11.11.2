# 实时保存和回退功能使用指南

## 功能概述

本功能实现了**每一步代码更改都自动保存到Git**，并支持**回退到之前的5个版本**。

### 主要特性

1. ✅ **实时监控文件变化**：自动检测文件修改、新增、删除
2. ✅ **自动提交到Git**：文件变化后500ms自动提交（防抖处理）
3. ✅ **保留提交历史**：自动保留最近5个提交，支持回退
4. ✅ **安全回退**：支持回退1-5步，保留工作区更改
5. ✅ **详细日志**：所有操作都有日志记录

## 快速开始

### 1. 启动实时保存服务

**方式一：使用npm命令**
```bash
npm run realtime-save
```

**方式二：使用批处理脚本（Windows）**
```bash
scripts\start-realtime-save.bat
```

**方式三：直接运行Node.js脚本**
```bash
node scripts/realtime-save.js
```

### 2. 使用回退功能

**方式一：使用npm命令**
```bash
# 交互式回退（会显示菜单）
npm run rollback

# 直接回退N步
npm run rollback -- 3
```

**方式二：使用批处理脚本（Windows）**
```bash
# 交互式回退
scripts\rollback.bat

# 直接回退3步
scripts\rollback.bat 3
```

**方式三：直接运行Node.js脚本**
```bash
node scripts/git-rollback.js 3
```

## 详细说明

### 实时保存服务

#### 工作原理

1. **文件监控**：使用 `chokidar` 监听以下路径的文件变化：
   - `src/**/*` - 源代码目录
   - `public/**/*` - 公共资源目录
   - `*.{ts,tsx,js,jsx,json,css,html,md}` - 根目录配置文件

2. **忽略的文件**：
   - `node_modules/**`
   - `dist/**`
   - `.git/**`
   - `logs/**`
   - `*.log`
   - `.vite/**`

3. **防抖处理**：文件变化后等待500ms再提交，避免频繁提交

4. **自动提交**：
   - 检测到变化 → 等待500ms → `git add -A` → `git commit`
   - 提交信息格式：`chore: 实时保存 - YYYY-MM-DD HH:mm:ss`

#### 日志文件

所有操作日志保存在：`logs/realtime-save.log`

#### 停止服务

按 `Ctrl+C` 停止实时保存服务

### 回退功能

#### 使用方法

1. **交互式回退**：
   ```bash
   npm run rollback
   ```
   会显示最近的提交历史，然后提示输入要回退的步数（1-5）

2. **直接回退**：
   ```bash
   npm run rollback -- 3
   ```
   直接回退3步

#### 回退机制

- **回退方式**：使用 `git reset --soft`，保留工作区的更改
- **安全提示**：如果检测到未提交的更改，会提示确认
- **最大步数**：最多回退5步（可配置）

#### 回退后的操作

回退后，更改会保留在暂存区，你可以：

```bash
# 重新提交
git commit -m "你的提交信息"

# 取消暂存（保留更改）
git reset HEAD

# 丢弃更改（危险）
git checkout .
```

#### 日志文件

回退操作日志保存在：`logs/git-rollback.log`

## 配置说明

### 修改监控配置

编辑 `scripts/realtime-save.js` 中的 `CONFIG` 对象：

```javascript
const CONFIG = {
  watchPaths: [
    'src/**/*',
    // 添加更多监控路径
  ],
  ignored: [
    '**/node_modules/**',
    // 添加更多忽略路径
  ],
  debounceDelay: 500,      // 防抖延迟（毫秒）
  maxCommits: 5,           // 最大保留提交数
};
```

### 修改回退步数限制

编辑 `scripts/git-rollback.js`，修改回退步数的检查逻辑。

## 注意事项

### ⚠️ 重要提示

1. **Git仓库要求**：确保项目已初始化Git仓库（`git init`）

2. **首次提交**：如果还没有任何提交，需要先手动创建一个初始提交：
   ```bash
   git add .
   git commit -m "初始提交"
   ```

3. **频繁提交**：实时保存会产生大量提交记录，建议定期整理：
   ```bash
   # 查看提交历史
   git log --oneline -20
   
   # 如果需要，可以压缩提交历史
   git rebase -i HEAD~10
   ```

4. **回退限制**：回退功能最多支持5步，如果需要回退更多，请使用Git命令：
   ```bash
   git log --oneline
   git reset --soft <commit-hash>
   ```

5. **备份重要更改**：虽然支持回退，但建议重要更改前先手动提交

### 最佳实践

1. **开发时启动**：在开发时启动实时保存服务，确保每一步都有记录

2. **定期整理**：每天或每周整理一次提交历史，合并相关的提交

3. **重要节点手动提交**：完成重要功能后，手动提交并添加详细说明

4. **使用分支**：建议在功能分支上使用实时保存，主分支保持整洁

## 故障排除

### 问题1：实时保存服务无法启动

**可能原因**：
- Node.js未安装或版本过低
- 缺少依赖包

**解决方法**：
```bash
# 检查Node.js版本
node --version

# 安装依赖
npm install

# 检查chokidar是否安装
npm list chokidar
```

### 问题2：文件变化后没有自动提交

**可能原因**：
- 文件在忽略列表中
- Git仓库未初始化
- 文件变化太快，被防抖过滤

**解决方法**：
- 检查 `logs/realtime-save.log` 查看详细日志
- 确认文件不在 `ignored` 列表中
- 确认已执行 `git init`

### 问题3：回退功能无法使用

**可能原因**：
- 提交历史不足
- 有未提交的更改

**解决方法**：
- 确保至少有2个提交（当前提交 + 要回退到的提交）
- 先提交或暂存当前更改

## 示例场景

### 场景1：开发新功能

```bash
# 1. 启动实时保存服务
npm run realtime-save

# 2. 开始编写代码
# ... 修改文件 ...

# 3. 文件自动保存（500ms后自动提交）
# 查看日志：tail -f logs/realtime-save.log

# 4. 如果写错了，回退3步
npm run rollback -- 3

# 5. 重新开始编写
```

### 场景2：测试不同实现方案

```bash
# 1. 实现方案A
# ... 编写代码 ...
# 自动保存为提交1

# 2. 回退并尝试方案B
npm run rollback -- 1
# ... 编写代码 ...
# 自动保存为提交2

# 3. 对比两个方案
git log --oneline -5
git diff HEAD~1 HEAD
```

## 相关文件

- `scripts/realtime-save.js` - 实时保存主脚本
- `scripts/git-rollback.js` - 回退功能脚本
- `scripts/start-realtime-save.bat` - Windows启动脚本
- `scripts/rollback.bat` - Windows回退脚本
- `logs/realtime-save.log` - 实时保存日志
- `logs/git-rollback.log` - 回退操作日志

## 更新日志

- **v1.0.0** (2025-01-XX)
  - 初始版本
  - 实现实时文件监控和自动提交
  - 实现Git回退功能（最多5步）




