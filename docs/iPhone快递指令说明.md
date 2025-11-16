# iPhone 快捷指令用法（概述步骤）

- 准备：在设置页生成一个 API Token，复制保存。
- 创建快捷指令：
  - 动作 1：获取剪贴板文本
  - 动作 2：获取 http://localhost:8080/api/tasks （ GET ， Authorization: Bearer <token> ），解析返回任务中的标签，去重作为选项
  - 动作 3：让用户从标签列表中选择一个标签
  - 动作 4：向 POST http://localhost:8080/api/tasks 发送 JSON {"content": "<剪贴板文本>", "tags": "<选择的标签>"} ，头部 Authorization: Bearer <token> ， Content-Type: application/json
  - 可绑定“轻点背面”触发：在 iOS 设置 → 辅助功能 → 触控 → 轻点背面，对应选择该快捷指令
- 注意：如果部署到非本机，请替换为实际域名；Token 吊销后需更新到快捷指令。
