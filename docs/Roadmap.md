## Planing

- 实现向飞书多维表格一样的智能问答功能
- 参考[memos](https://github.com/usememos/memos)，它使用了 codemirror 编辑器，请对项目输入框和任务列表进行升级，支持 Markdown 输入和渲染。
- 使用[OverType](https://github.com/panphora/overtype)对任务输入框增强和编辑，支持 Markdown。

## Test

```bash
go build -o taskgo.exe ./cmd/main.go # Build
.\taskgo.exe # Run the Go application.
```
登录 http://localhost:8080，注册一个测试账号：tabor 123678，就可以体验了。