# TaskGo 样式使用说明（Tailwind 设计系统）

## 设计令牌
- 颜色：
  - `text-primary` / `bg-primary` / `border-primary`
  - `text-secondary` / `text-secondary-200`
  - `bg-background` / `dark:bg-background-dark`
  - `bg-surface` / `dark:bg-surface-dark`
  - `border-border` / `dark:border-border-dark`
  - 语义色：`success`、`warning`、`danger`
- 字体：`font-sans`（已通过 Tailwind CDN 的 `fontFamily.sans` 指定系统与中文字体栈）
- 圆角与阴影：统一使用 `rounded-lg|xl` 与 `shadow-sm|md|lg`

## 暗色模式
- Tailwind 配置使用 `darkMode: 'class'`
- 系统偏好自动切换与手动覆盖：
  - 设置弹窗单选：`Light` / `Dark` / `System`
  - 页眉与移动端按钮：点击依次在 `Light → Dark → System` 间循环
- 模板中统一使用 `dark:` 修饰符。例如：
  - 容器：`bg-surface dark:bg-surface-dark`
  - 边框：`border-border dark:border-border-dark`
  - 输入：`bg-background dark:bg-background-dark`

## 组件样式基线
- 按钮（主）：`bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors`
- 按钮（次）：`bg-background border border-border text-secondary hover:bg-gray-50 dark:bg-background-dark dark:border-border-dark`
- 输入框：`bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary dark:bg-background-dark dark:border-border-dark`
- 卡片容器：`bg-surface dark:bg-surface-dark border border-border/50 dark:border-border-dark rounded-xl shadow-sm`
- 模态与菜单：容器 `bg-surface dark:bg-surface-dark`，内容区维持与卡片一致的视觉层次。

## 可访问性（WCAG）
- 为图标按钮补充 `aria-label` 与 `aria-pressed`（主题切换）。
- 侧边栏开合状态使用 `aria-expanded`。
- 焦点态统一 `focus:outline-none focus:ring-1 focus:ring-primary`。
- 保证暗亮模式下对比度达标（AA）。

## 文件位置
- 主题配置：`web/static/js/tailwind_config.js`
- 模板页面：`web/templates/index.html`
- 交互脚本：`web/static/js/script.js`
- 自定义样式：`web/static/css/style.css`、`web/static/css/theme.css`