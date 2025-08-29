# Trae.md

This file provides guidance to Trae (trae.ai) when working with code in this repository.

重要：
1. 项目采用gin框架，数据库采用sqlite。
2. 项目采用project_rules.md规范，所有代码均需要符合project_rules.md规范。
3. 代码需有中文注释
4. 后端代码未修改时，不需要重新编译，后端编译需遵循`Development Commands`中的命令。
5. 前端代码修改后，不需要重启，项目支持刷新热加载。
6. 项目目录结构规范：
   - web/: 存放前端静态资源和模板
     - static/: 静态资源(css/js/images)
     - templates/: HTML模板
   - internal/: 核心业务逻辑
     - auth/: 认证相关
     - database/: 数据库操作
     - handlers/: HTTP请求处理
     - middleware/: 中间件
     - models/: 数据模型
     - router/: 路由定义
7. 代码组织原则：
   - 按功能模块划分目录
   - 每个模块包含完整的业务逻辑
   - 遵循单一职责原则



## 项目版本及依赖

go 1.24.1

```bash
require (
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/gin-gonic/gin v1.10.1
	github.com/glebarez/sqlite v1.11.0
	golang.org/x/crypto v0.41.0
	gorm.io/gorm v1.30.1
)
```

## Development Commands

```bash
# Build binary
go build -o taskgo.exe ./cmd/main.go
# Run the application
.\taskgo.exe 
```
