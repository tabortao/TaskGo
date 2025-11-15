## 当前问题与目标
- 控制台报错：`TypeError: Cannot read properties of null (reading 'style')` 来源于 `web/static/js/script.js:542`，点击头像区域时尝试切换不存在的 `#user-menu`。
- 目标：优化左侧导航布局、增强 Tags 区、提供独立设置页面与交互反馈，并记录用户操作日志，同时保证响应式与视觉一致性。

## 修复与架构调整
- 修复报错：
  - 在头像区域添加一个实际存在的下拉菜单容器 `#user-menu`（或改为空元素占位），并在 JS 中加入空值保护：`const menu = document.getElementById('user-menu'); if (menu) { ... }`。
  - 同时通过全局错误捕获记录异常：`window.addEventListener('error', ...)` 与 `unhandledrejection`。

## 导航栏布局
- 保持现有结构：`header`（头像与用户名）、`flex-1 overflow-y-auto`（导航与Tags）、`p-4 border-t`（底部 Settings/Logout）。
- 固定底部显示：当前结构已满足固定底部，确保上方区域滚动不影响底部；如需进一步稳固，给中间滚动区设置 `overflow-y-auto` 与高度限制。

## Tags 区增强
- 折叠/展开：
  - 在 Tags 标题右侧加入切换按钮（chevron 图标），点击切换折叠态；默认状态从 `localStorage('tagsCollapsed')` 读取，支持配置。
  - 折叠/展开动画：`transition-[max-height,opacity] duration-300 ease-out`，折叠时 `max-h-0 opacity-0`；展开时恢复。
- 可视区域滚动：
  - 为 `#tag-list` 容器设置 `max-h`（如 `max-h-[40vh]` 或依据屏幕高度动态计算）与 `overflow-y-auto`。
  - 滚动条样式：在 `style.css` 添加轻量化的 `::-webkit-scrollbar` 与 `scrollbar-color`，颜色使用主题令牌（`border-border`/`secondary`），与 UI 保持一致。

## 设置独立页面
- 在 `index.html` 内新增一个独立的 `#settings-page` 区域（隐藏显示切换），包含：
  - 顶部栏：左上角返回图标（`<`），点击返回主界面。
  - 内容：沿用现有设置项（头像上传、主题选择、密码修改），增加统一的“保存”按钮；保存后提示成功并返回或留在页面。
- 路由与导航：
  - 点击侧边栏 Settings 进入 `#settings-page`，隐藏主应用；返回按钮反向切换。
  - 可选：`history.pushState` 管理浏览器返回行为（移动端友好）。

## 交互与视觉反馈
- 点击态：所有交互按钮增加 `active:scale-95`、`hover:bg-background`/`hover:text-primary`、`focus:ring-primary`。
- 平滑滚动：为滚动容器开启 `scroll-behavior: smooth`（或 Tailwind `scroll-smooth` 类）。
- 动画统一：折叠/展开、菜单与模态统一使用 `transition` 与 `ease` 曲线（200–300ms）。

## 日志记录
- 统一日志函数：`logEvent(type, payload)` 将事件记录到 `localStorage('taskgo_logs')` 并 `console.log`。包含时间戳、页面上下文与关键数据。
- 记录范围：
  - 标签折叠/展开、滚动触发、标签选择/右键菜单操作。
  - 设置修改（主题、密码、头像）与保存按钮点击。
  - 导航跳转（进入/退出设置页）。
  - 错误日志：全局 `error` 与 `unhandledrejection` 捕获，包括当前的 `TypeError`。
- 可选：提供轻量“日志查看”入口（仅开发态显示）。

## 响应式与移动优化
- 在 `sm|md|lg|xl` 断点检视侧边栏宽度与 `collapsed` 行为，保证移动端抽屉与滚动良好，触控区域足够大（按钮最小触控尺寸 44px）。
- Tags 滚动在移动端使用更大的滚动区与更粗的滚动条；触控切换按钮添加 `touch-action` 与更明显的点击反馈。

## 一致性与令牌
- 使用已扩展的设计令牌：`bg-surface/dark:bg-surface-dark`、`bg-background/dark:bg-background-dark`、`border-border/dark:border-border-dark`、`text-secondary(-200)`。
- 图标与间距采用统一尺寸（`w-5 h-5`、`p-2`、`space-x-2`）。

## 交付与验证
- 修改 `index.html`（结构与新区域）、`style.css`（滚动条与动画辅助类）、`script.js`（折叠逻辑、设置页导航与日志）。
- 构建并在 `http://localhost:8080/` 验证：
  - Settings/Logout 固定底部；
  - Tags 折叠/展开与滚动条样式；
  - 进入设置页与返回；保存逻辑生效；
  - 日志在控制台与 `localStorage` 可见；
  - 修复 `TypeError` 不再出现。

若确认该方案，我将开始实施并提供预览与日志示例。