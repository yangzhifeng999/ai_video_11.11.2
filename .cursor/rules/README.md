# Cursor Rules 目录说明

本目录包含项目的开发规范文件，按优先级和类别组织。

## 文件说明

### 00-critical-rules.md
**最高优先级** - 关键禁止项，必须严格遵守
- TypeScript 类型安全
- 存储安全
- React Hooks 规范
- 空值检查
- 代码分割
- 环境变量规范
- 调试代码规范

### 01-typescript.md
TypeScript 严格规范
- 类型定义
- 接口命名
- 禁止使用 any
- 类型守卫
- 泛型使用

### 02-react-hooks.md
React Hooks 规范
- useState
- useEffect（依赖项、清理函数）
- useCallback
- useMemo
- 自定义 Hooks

### 03-security.md
安全规范
- 前端安全（Token 存储、输入验证）
- API 安全
- 支付安全

### 04-performance.md
性能优化规范
- 代码分割
- 组件优化
- 资源优化

### 05-error-handling.md
错误处理规范
- API 错误处理
- 错误边界
- 用户友好的错误提示

### 06-project-specific.md
项目特定规范
- 技术栈
- 文件组织
- 命名规范
- 腾讯云集成
- 支付集成

## 使用方式

Cursor IDE 会自动读取本目录下的规则文件，在代码生成时应用这些规范。

## 优先级

规则文件按文件名排序，数字越小优先级越高。`00-critical-rules.md` 中的规则是最高优先级，不可违反。

