## 实施目标
- 新增独立 HTML 设置页面 `settings.html`，包含完整的头部、主体与脚本，复用项目现有设计规范与主题体系。
- 在 `router.go` 注册 `/settings` 路由，按现有模式返回模板渲染，保证与当前路由架构一致。
- 点击侧边栏 Settings 跳转到 `/settings`，资源加载与交互正常，不影响其他路由。

## 页面内容
- 头部：`meta`、`title`、Tailwind CDN、`/static/css/style.css`、`/static/js/tailwind_config.js`、`/static/css/theme.css`。
- 主体：
  - 顶部返回按钮（左上角），跳转到 `/`。
  - 主题外观设置（Light/Dark/System 单选与应用逻辑）。
  - 头像上传（独立表单与保存流程）。
  - 密码修改（独立表单与保存流程）。
- 脚本：在页面底部内联 JS，包含：
  - 主题应用与系统偏好支持（`applyTheme` 与 `prefers-color-scheme` 监听）。
  - 头像上传与密码修改的 `fetch` 调用（使用现有 API 与本地 `token`）。
  - 返回按钮与保存提示。

## 路由注册
- 在 `internal/router/router.go`：新增 `r.GET("/settings", ...)` 返回 `settings.html`，保持与 `/` 路由一致的模板渲染方式。
- 保持现有静态资源与模板加载模式（`r.Static` 与 `r.LoadHTMLGlob`）。

## 关联改动
- 更新侧边栏 `Settings` 链接为跳转到 `/settings`（避免与旧的弹窗行为冲突）。
- 保留原有设置弹窗以兼容，但优先跳转至独立页面。

## 测试验证
- 构建并运行后通过浏览器访问 `http://localhost:8080/settings` 验证加载与交互。
- 检查资源请求、主题切换、头像上传与密码修改均正常。
- 验证现有路由（`/` 与 `/api/*`）不受影响。

确认后我将新增 `settings.html`、更新 `router.go` 与侧边栏 Settings 跳转，并完成构建与预览验证。