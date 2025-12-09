# ⚠️ 关键禁止项（最高优先级 - 必须严格遵守）

## TypeScript 类型安全（不可违反）
- ❌ **严格禁止使用 `any` 类型**：必须定义具体类型或使用 `unknown` 并进行类型守卫。
  - 示例：`function processData(data: unknown) { if (typeof data === 'string') { /* ... */ } }`
- ✅ **所有函数参数必须有类型注解**。
- ✅ **所有函数返回值必须有类型注解**。
- ✅ **所有变量必须有明确类型**（或通过类型推断）。
- ✅ **启用 TypeScript 的 `strict` 模式**。

## 存储安全（不可违反）
- ❌ **严格禁止在 `localStorage` 或 `sessionStorage` 存储敏感信息**（如 Token、密码、支付信息、用户个人身份信息）。
- ✅ **Token 必须存储在内存中**（例如使用 Zustand store，但不持久化到本地存储）或使用 `httpOnly Cookie`。
- ✅ **所有用户输入必须进行严格的验证和过滤**，以防止注入攻击。

## React Hooks 规范（防止常见 Bug 和性能问题）
- ✅ **`useEffect` 必须包含完整的依赖项数组**：确保所有外部依赖（变量、函数）都列在依赖数组中。
  - ❌ 错误示例：`useEffect(() => { fetchData(); }, []);` 如果 `fetchData` 在外部定义。
  - ✅ 正确示例：`useEffect(() => { const fetchData = () => {}; fetchData(); }, [fetchData]);` 或将 `fetchData` 移入 `useEffect`。
- ✅ **有副作用的 `useEffect` 必须提供清理函数**：例如，清除定时器、取消订阅、移除事件监听器。
  - 示例：`useEffect(() => { const timer = setInterval(() => {}, 1000); return () => clearInterval(timer); }, []);`
- ✅ **避免在渲染过程中创建函数或对象**：对于作为 props 传递的函数，**必须使用 `useCallback` 包装**；对于计算成本高的值，**必须使用 `useMemo` 缓存**。

## 空值检查（防止运行时错误）
- ✅ **对象属性访问必须使用可选链 `?.`**：防止访问 `null` 或 `undefined` 的属性。
  - 示例：`user?.profile?.name`
- ✅ **必须使用空值合并操作符 `??` 提供默认值**：当左侧操作数为 `null` 或 `undefined` 时。
  - 示例：`const userName = user?.name ?? 'Guest';`
- ✅ **数组访问前必须检查长度或使用可选链**：防止访问空数组的索引。
  - 示例：`items?.[0]` 或 `if (items && items.length > 0) { /* ... */ }`
- ✅ **API 响应数据必须验证存在性**：在解构或使用前检查数据是否为 `null` 或 `undefined`。

## 代码分割（强制性能优化）
- ✅ **所有路由组件必须使用 `React.lazy()` 进行代码分割**：结合 `Suspense` 实现按需加载。
  - 示例：`const HomePage = lazy(() => import('./pages/Home'));`
- ✅ **大型组件或库也应考虑按需加载**。

## 环境变量规范（配置正确性）
- ✅ **Vite 项目中，所有前端环境变量必须以 `VITE_` 前缀开头**（例如 `VITE_API_BASE_URL`）。
  - ❌ 错误：`REACT_APP_` 前缀是 Create React App 项目使用的。
- ✅ **敏感信息（如 API 密钥、Secret）禁止直接提交到 Git 仓库**。
- ✅ **必须使用 `.env.example` 文件作为环境变量模板**。

## 调试代码（代码质量）
- ❌ **禁止提交 `console.log`、`console.error`、`console.warn` 到 Git 仓库**。
- ✅ 开发时可以使用，但在提交 Pull Request 前必须移除。
- ✅ 如需日志记录，请使用项目统一的日志服务或工具。

