# 更新日志

停止维护，后续迁移到新的项目

- 版本信息修改：`web\static\config.json`

## v0.3.3

**Release time:** 2025-12-1

- 修改头像上传大小限制从1MB提升至5MB
- 使用image-conversion库优化图片压缩算法
- 修复PWA模式下设置页面跳转问题

## v0.3.3

**Release time:** 2025-11-17

- feat: 添加任务内容展开/收起功能并优化图片压缩。

## v0.3.2

**Release time:** 2025-11-16

- feat(ui): 优化移动端侧边栏关闭动画和响应式设计

## v0.3.1

**Release time:** 2025-11-16

- feat(API): 实现 API Token 管理功能，为 API 令牌添加名称字段以区分不同用途。
- feat(文档): 更新 iPhone 快捷指令使用说明并改进功能。
- fix(上传): 按用户 ID 归档任务图片上传目录。
- feat(UI): 为搜索框添加清除按钮功能。
- refactor(设置): 改进令牌管理 UI 并添加硬删除功能。

## v0.3.0

**Release time:** 2025-11-16

- feat: 优化移动端 UI 交互并添加图片 webp 转换功能：
  调整移动端任务卡片、搜索框和边距的样式
  实现可拖动并记住位置的返回顶部按钮
  添加图片上传自动转换为 webp 格式功能
  优化移动端编辑任务时的滚动行为

## v0.2.9

**Release time:** 2025-11-15

- feat: 添加主题色自动更新功能。
- feat: 添加任务计数提示和返回顶部按钮。
- feat(settings): 添加版本信息展示功能并优化移动端设置。

## v0.2.8

**Release time:** 2025-11-15

- feat: 优化页面显示效果
- feat: 添加独立设置页面路由
- feat(ui): 改进移动端视口适配和安全区域处理

## v0.2.7

**Release time:** 2025-9-15

- feat: 实现任务图片上传功能

## v0.2.6

**Release time:** 2025-9-15

- feat(pwa): 实现完整的 PWA 功能支持

## v0.2.4

**Release time:** 2025-9-1

✨ **New Features**

- Click on a selected tag to cancel filtering and show all tasks
- Added remember username/password functionality on login page
- Added pull-to-refresh feature

🔄 **Changes**

- Merged todo and completed task lists and removed fold functionality
- Login page remember username/password layout

🎨 **UI Improvements**

- When clicking settings button on mobile sidebar, settings window appears in front
- Optimized send button style in input box

⚡ **Behavior Changes**

- Task page auto-refreshes to show new comments after adding comment and closing window

---

**Release time:** 2025-9-1

✨ **新增功能**

- 点击已选中的标签取消筛选，显示所有任务
- 登录页面添加记住用户名密码功能
- 添加下拉刷新功能

🔄 **功能变更**

- 合并待办和已完成任务列表并移除折叠功能
- 调整登录页面记住用户名密码布局

🎨 **界面优化**

- 移动端点击侧边栏设置按钮时，设置窗口显示在最前方
- 优化输入框发送按钮样式

⚡ **行为改动**

- 新增评论后关闭窗口时，任务页面会自动刷新显示新增评论

## v0.2.3

**Release time:** 2025-8-29

✨ **New Features**

- Added dark mode support and refactored theme configuration
- Added click logo to return to top and focus input box functionality

🐛 **Bug Fixes**

- Fixed keyboard event handling logic for input boxes on desktop and mobile
- Unified search box placeholder text and removed tag autocomplete feature
- Adjusted theme configuration loading priority

🔧 **Optimizations**

- Optimized theme switching performance
- Improved input box focus state visual feedback

---

**发布时间:** 2025-8-29

✨ **新增功能**

- 添加深色模式支持并重构主题配置
- 添加点击 Logo 返回顶部并聚焦输入框功能

🐛 **问题修复**

- 修正桌面端和移动端输入框的键盘事件处理逻辑
- 统一搜索框占位符文本并移除标签自动完成功能
- 调整主题配置加载优先级

🚀 **优化改进**

- 优化主题切换性能
- 改进输入框聚焦状态视觉反馈

## v0.2.2

**发布时间:** 2025-8-29

✨ **新增**

- 将点击加载更多改为滚动自动加载
- 扩展颜色调色板以提供更多选择

🚀 **改进**

- 调整主内容区宽度和居中显示
- 移除标签选择标题的硬编码文本

🐛 **修复**

- 将双击切换功能改为单击侧边栏顶部切换
- 修改移动端 Enter 键默认行为为换行

## v0.2.1

**发布时间:** 2025-08-29

✨ **新增**

- 输入#自动横排显示最近标签
- 支持模糊搜索最近标签

💬 **评论系统升级**

- 新增任务评论数显示功能
- 优化评论中用户名的显示样式

🎯 **任务操作增强**

- 菜单栏新增"复制任务"功能
- 菜单栏新增"编辑任务"选项
- 支持双击任务直接进入编辑模式

✨ **交互优化**

- 改进任务编辑的快捷操作方式
- 优化菜单栏功能布局
- 提升任务操作的完整性和便利性

> 本次更新着重强化了任务管理功能，提升了编辑效率和操作流畅度

## v0.2.0

**发布时间:** 2025-08-26

✨ **新增功能**

- 实现任务输入框标签自动完成 (#触发使用记录/智能匹配)
- 新增左侧导航栏标签右键菜单(支持编辑/删除操作)
- 为任务菜单添加"Add Tag"快速标签功能

🔄 **交互优化**

- 优化标签点击行为(直接切换至对应标签任务列表)
- 调整 Favorites 页面显示逻辑(已完任务默认展开)
- 设置 Favorites 为默认首页(取代原 All Tasks)

💻 **技术调整**

- 重构多个核心函数(handleTagClick/renderTasks 等)
- 新增 tags 管理相关功能函数
- 优化菜单系统交互逻辑

> 本次更新大幅改进了标签管理系统，增强了任务的快速分类和组织能力

## v0.1.10

**发布时间:** 2025-08-25

🐛 **修复**

- 解决收藏功能显示问题（侧边栏点击无法显示收藏任务）
- 修复事件监听器和导航状态管理

✨ **新增**

- 任务布局全新设计：
  - 时间显示移到任务左上角（移除冗杂标签）
  - 操作图标常显（收藏/备注/菜单）

🚀 **改进**

- 优化任务文本换行（改用 break-words 实现自然换行）
- 提升任务卡片信息层次感和可读性
- 操作按钮常显提升交互便捷性

🖌️ **UI 更新**

- 统一操作图标视觉样式
- 优化任务内容区域布局
- 完善收藏任务筛选展示

## v0.1.9

**发布时间:** 2025-08-25

✨ **新增**

- 新增标签创建功能（含加号按钮和模态框）
- 实现任务收藏功能（前后端完整支持）
- 添加收藏任务页面路由和视图切换
- 新增空状态提示信息
- 在任务项右上角添加操作菜单(删除/置顶功能)
- 添加任务评论功能(含前后端实现)
- 为任务添加备注功能(前后端实现)

🛠️ **优化**

- 改进任务输入框高度自动重置逻辑
- 优化收藏状态图标交互体验
- 完善视图状态管理机制
- 优化任务列表 UI 布局(日期标签同行)
- 更新 CSS 样式适配新布局
- 后端新增评论表(Comment)模型

🔧 **技术改进**

- 后端 Task 模型新增 Favorite 字段
- 更新 API 支持收藏状态更新
- 保持代码风格和架构一致性

## v0.1.8

**发布时间:** 2025-08-24

🐛 **修复**

- 修改任务列表项为双击编辑而非单击编辑

✨ **新增**

- 实现 Enter 提交任务，Alt+Enter 换行功能
- 修改已完成任务的复选框为带对号样式

🚀 **改进**

- 修改已完成任务样式为灰色文字而非删除线
- 修改侧边栏标签点击后背景为蓝色
- 加深任务列表和侧边栏标签颜色并保持一致
- 优化输入框样式使其更清晰
- 增强任务复选框的可见性

## v0.1.1~v0.1.7

**发布时间:** 2025-08-23

🚀 **改进**

- 页面优化调整
- 任务列表项优化，添加任务标签功能

✨ **新增**

- 任务标签支持编辑和删除

## v0.1.0

**发布时间:** 2025-08-22

🎉 **重磅来袭**

- TaskGo 正式开源并发布啦！
