# 贡献指南

感谢您对嘿哈项目的关注！我们欢迎所有形式的贡献。

## 如何贡献

### 报告 Bug

如果您发现了 Bug，请：

1. 检查 [Issues](https://github.com/your-repo/issues) 中是否已有相关问题
2. 如果没有，请创建新的 Issue，包含：
   - Bug 的详细描述
   - 复现步骤
   - 预期行为 vs 实际行为
   - 环境信息（浏览器、操作系统等）
   - 截图（如果适用）

### 提出新功能

如果您有好的想法或建议：

1. 在 [Issues](https://github.com/your-repo/issues) 中创建 Feature Request
2. 详细描述功能需求和使用场景
3. 等待团队评估和反馈

### 提交代码

#### 1. Fork 项目

点击 GitHub 上的 Fork 按钮，将项目 Fork 到您的账户。

#### 2. 克隆您的 Fork

```bash
git clone https://github.com/your-username/heiha.git
cd heiha
```

#### 3. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

分支命名规范：
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `refactor/` - 代码重构
- `style/` - 代码格式调整

#### 4. 开发

- 遵循项目的代码规范
- 确保代码通过 TypeScript 类型检查：`npm run type-check`
- 确保代码通过 ESLint 检查：`npm run lint`
- 添加必要的注释和文档

#### 5. 提交更改

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复某个bug"
git commit -m "docs: 更新文档"
```

#### 6. 推送并创建 Pull Request

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

## 代码规范

### TypeScript

- 使用 TypeScript 进行类型检查
- 避免使用 `any` 类型
- 为函数和组件添加类型定义

### React 组件

- 使用函数式组件 + Hooks
- 组件名使用 PascalCase
- Props 接口以 `I` 开头（如 `IUserProps`）

### 命名规范

- 变量/函数：camelCase
- 组件：PascalCase
- 常量：UPPER_SNAKE_CASE
- 文件：PascalCase（组件）或 camelCase（工具函数）

### 代码格式

- 使用 2 个空格缩进
- 使用单引号
- 行尾不加分号（根据项目配置）
- 最大行长度：100 字符

## 测试

在提交 PR 之前，请确保：

1. ✅ 代码通过 TypeScript 类型检查
2. ✅ 代码通过 ESLint 检查
3. ✅ 项目可以正常构建
4. ✅ 新功能在浏览器中测试通过

## Pull Request 流程

1. **创建 PR** - 在 GitHub 上创建 Pull Request
2. **描述变更** - 详细描述您的更改和原因
3. **等待审查** - 团队成员会审查您的代码
4. **处理反馈** - 根据反馈进行修改
5. **合并** - 审查通过后，代码将被合并

## 行为准则

- 尊重所有贡献者
- 接受建设性的批评
- 专注于对项目最有利的事情
- 对其他社区成员表示同理心

感谢您的贡献！🎉
