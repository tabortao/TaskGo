## TODO

- 参考[memos](https://github.com/usememos/memos)，它使用了 codemirror 编辑器，请对项目输入框和任务列表进行升级，支持 Markdown 输入和渲染。
- 使用[OverType](https://github.com/panphora/overtype)对任务输入框增强和编辑，支持 Markdown。

🚀 **改进**
*   美化任务列表样式，添加单独线框和间隔
*   调整任务列表UI以适应Markdown内容

✨ **新增**
*   集成CodeMirror编辑器支持Markdown输入
*   实现Markdown渲染功能
*   在设置页面添加项目版本号显示

🐛 **修复**
*   测试Markdown功能和样式效果
## Doing


Favorites页面中，Completed默认不要折叠。
任务列表中菜单图标增加新增标签的功能。
任务输入框：输入#，显示最近使用的标签，输入内容后自动匹配相关标签供用户选择。
网页打开，默认显示Favorites页面。
任务列表中点击标签，切换到该标签下的任务列表，取消点击标签后弹出的编辑标签和删除标签功能；左侧导航栏右击标签，可进行标签编辑和删除。

## 测试

```bash
go build -o taskgo.exe ./cmd/main.go # Build
.\taskgo.exe # Run the Go application.
```

登录 http://localhost:8080，注册一个测试账号：tabor 123678，就可以体验了。