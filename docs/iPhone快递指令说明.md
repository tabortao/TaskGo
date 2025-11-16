# iPhone 快捷指令用法（概述步骤）

- 功能目标：剪贴板为空时提示输入内容，选择标签后发送到 TaskGo。
- 流程（iPhone 快捷指令内）：
- 取剪贴板，如果为空，用“询问文本”提示用户输入；将结果保存为变量 content 。
- 请求 GET https://你的域名/api/tasks （加 Authorization: Bearer <token> ），解析响应中的 tags 字段去重，作为“从列表中选择”的选项。
- 用户选择标签后，发送 POST https://你的域名/api/tasks ，Body： {"content": "<content>", "tags": "<选中的标签>"} ，头部同上。
- 绑定“轻点背面”：设置 → 辅助功能 → 触控 → 轻点背面 → 选择该快捷指令。
- 备注：
- 令牌生成与复制在设置页完成。
- 本地运行时用 http://localhost:8080 ；部署后替换为外网域名。
