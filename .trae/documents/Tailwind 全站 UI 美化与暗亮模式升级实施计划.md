## 现状评估
- 当前前端位于 `web/`，仅有 `web/templates/index.html` 页面，使用 Tailwind CDN 与自定义样式。
- 已存在暗色模式逻辑：`darkMode: 'class'`（`web/static/js/tailwind_config.js`），系统偏好监听与手动设置（`web/static/js/script.js:419-454`）。
- 现有样式分散在 Tailwind 工具类与自定义 CSS（`style.css`、`theme.css`）之间，暗色样式部分依赖 `.dark …` 选择器，`dark:` 修饰符使用不统一。

## 设计系统与主题配置
- 扩展 Tailwind 主题（保留 CDN 方案）：在 `web/static/js/tailwind_config.js` 中补充完整设计令牌：
  - 颜色：`primary`、`secondary`、`success`、`warning`、`danger`、`background`、`surface`、`surface-dark`、`border`、`muted`。
  - 字体：系统字体栈与中文字体优先级（如 `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei'`）。
  - 圆角、阴影、间距的统一刻度（如 `rounded-lg`、`shadow-sm|md|lg`、`space-x/y-*`）。
- 统一视觉语言：规范标题层级、正文字号与行高；统一卡片（`card`）、按钮（`btn`）、表单（`input`）等元素的样式基线。

## 深色/浅色模式支持
- 保留系统偏好自动切换：沿用 `prefers-color-scheme` 监听（`script.js:444-454`）。
- 手动切换：
  - 保留设置弹窗中的单选按钮；新增页眉快速切换按钮（图标开关），与 `applyTheme` 复用存储逻辑（`localStorage: 'theme-mode'`）。
- 全面引入 `dark:` 修饰符：
  - 模板中将 `bg-surface` 等类统一为 `bg-surface dark:bg-surface-dark`，并在必要位置增加 `dark:text-*`、`dark:border-*`。
  - 逐步减少 `theme.css` 中通过 `.dark` 选择器覆盖的样式，迁移到 Tailwind 工具类。
- 可读性与舒适度：确保两种模式下对比度符合 WCAG AA；为交互元素增加清晰的 `focus` 与 `hover` 态。

## 具体实施要求与页面改造
- 响应式优化：
  - 检查导航、侧边栏、任务列表、模态框在 `sm|md|lg|xl` 断点的布局与间距，统一容器宽度 `max-w-screen-xl` 与内边距 `p-*`。
- 排版系统：
  - 标题采用统一层级（如 `text-xl|2xl` 与 `font-semibold|medium`），正文统一 `text-base`，次级文本统一 `text-secondary` 并在暗色态用 `dark:text-secondary-200`。
- 交互元素统一：
  - 按钮：主按钮统一 `bg-primary text-white hover:bg-primary/90`，次按钮统一 `bg-background border border-border text-secondary hover:bg-gray-50`。
  - 表单：输入框统一 `bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary`；统一圆角与内边距。
  - 卡片：统一 `bg-surface border border-border/50 rounded-xl shadow-sm`；在暗色态加 `dark:bg-surface-dark`。
- 过渡动画：页面交互统一 `transition-colors|opacity|transform` 与 `duration-200|300`；为菜单、模态、侧边栏增添统一的进出场动画。

## 无障碍（WCAG）改造
- 语义与 ARIA：为图标按钮补充 `aria-label`，侧边栏折叠/展开使用 `aria-expanded`；模态框添加 `role="dialog" aria-modal="true"`。
- 键盘可达：菜单与模态支持 `Esc` 关闭与 `Tab` 循环；焦点态使用高可见度 `ring` 类。
- 对比度：通过统一令牌保证主文案与关键控件在暗亮模式的对比度均达标。

## 质量保障与测试
- 设备与浏览器矩阵：Chrome/Firefox/Safari/Edge 最新版；iOS Safari、Android Chrome；Windows 高分屏与低分屏；深色/浅色系统偏好。
- 自动化与工具：使用 Lighthouse 与 axe DevTools 进行性能与无障碍扫描（报告整理为交付物）。
- PWA 复核：Service Worker 与安装提示在暗亮模式下的视觉一致性；独立显示模式下安全区（`env(safe-area-inset-*)`）检查。

## 文件改动清单
- `web/static/js/tailwind_config.js`：扩展主题令牌与字体配置；保留 `darkMode: 'class'`。
- `web/templates/index.html`：
  - 增加页眉暗亮切换按钮；
  - 全面替换/补充 `dark:` 修饰符；
  - 统一按钮/表单/卡片类名与结构；补充无障碍属性。
- `web/static/js/script.js`：
  - 复用 `applyTheme`，接入新切换按钮事件；
  - 保持系统偏好监听与本地存储逻辑不变；
  - 细化无障碍相关的事件与属性设置。
- `web/static/css/style.css`：
  - 添加少量复用类（如 `.btn`, `.btn-secondary`, `.card`, `.input`），以最小自定义 CSS 达成统一风格；
  - 保留已有交互与 PWA 样式，消除重复与冲突。
- `web/static/css/theme.css`：
  - 缩减 `.dark` 选择器覆盖内容，迁移到 Tailwind `dark:`；保留必要的基础体感设置（如 `color-scheme: dark`）。
- 文档交付：新增 `docs/StyleGuide.md`（样式使用说明，中文），`docs/TestReport.md`（跨浏览器与无障碍测试报告，中文）。

## 里程碑与实施顺序
1. 扩展主题令牌与字体（不破坏现有逻辑）。
2. 统一按钮/表单/卡片的类与结构（局部替换，逐段验证）。
3. 暗色模式迁移：为主要模块加 `dark:` 修饰符，消减 `theme.css` 覆盖。
4. 响应式与动画统一：检视断点与过渡效果，消除不一致。
5. 无障碍增强：ARIA、焦点态、键盘操作与对比度检查。
6. 测试与报告：浏览器/设备矩阵验证，生成报告与使用文档。

## 验证与运行
- 按项目规则使用开发命令：构建 `go build -o taskgo.exe ./cmd/main.go`，运行 `./taskgo.exe`，访问 `http://localhost:8080/` 验证。
- 前端修改后重启已运行的 `taskgo.exe` 终端并刷新预览。

## 风险与应对
- 若个别组件迁移到 `dark:` 后出现视觉偏差，短期保留对应的 `.dark` 覆盖作为回退；逐步收敛到 Tailwind 工具类。
- 维持最小自定义 CSS，避免与 Tailwind 工具类冲突。

## 交付物
- 更新后的完整项目代码（遵循 `project_rules.md`，后端不改动时不重编译）。
- 暗亮模式切换组件（页眉按钮 + 设置弹窗单选）。
- 样式使用文档（中文，包含设计令牌与组件用法）。
- 跨浏览器与无障碍测试报告（中文）。

请确认该实施计划，确认后我将开始逐步落实改造并提供可预览与文档。