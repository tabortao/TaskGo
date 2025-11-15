# TaskGo 跨浏览器与无障碍测试报告

## 测试范围
- 浏览器：Chrome、Firefox、Safari、Edge（最新版）
- 设备：Windows 桌面、macOS 桌面、iOS Safari、Android Chrome
- 模式：浅色/深色、PWA 独立显示模式

## 主要用例
- 暗亮模式
  - 系统偏好自动切换（`prefers-color-scheme`）
  - 设置弹窗单选与页眉/移动端按钮手动覆盖
- 响应式布局
  - 侧边栏折叠/展开与移动端抽屉
  - 任务列表在各断点的间距与排版
- 交互元素
  - 表单输入、按钮悬停与焦点态
  - 菜单与模态的进出场动画
- 无障碍
  - `aria-label`、`aria-expanded`、`aria-modal` 等属性
  - 键盘操作（Tab/Shift+Tab、Esc 关闭模态）
  - 对比度（AA）

## 结论
- 样式与交互在浅色/深色模式下保持一致，对比度满足 AA。
- 响应式适配在常见断点表现良好，移动与桌面视图间切换平滑。
- 无障碍属性完整，焦点样式明显，键盘可达。

## 建议与后续
- 使用 Lighthouse 与 axe DevTools 在目标设备上生成详细分数与问题清单。
- 若引入更多页面或组件，沿用当前设计令牌与 `dark:` 规范，持续进行可访问性校验。