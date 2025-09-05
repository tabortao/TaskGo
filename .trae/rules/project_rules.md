# TaskGo 项目开发规范

## 1. 项目概述

TaskGo 是一个基于 Go 语言和 Gin 框架构建的轻量级任务管理系统。它采用 SQLite 数据库进行数据存储，并提供了一个简洁、用户友好的响应式 Web 界面，支持 PWA 特性，方便用户随时随地管理任务。

## 2. 技术栈

- **后端:**
  - **Go 1.24+**
  - **Gin:** 高性能 Go Web 框架。
  - **GORM:** Go ORM 库，用于操作数据库。
  - **golang-jwt:** 用于生成和验证 JWT (JSON Web Tokens)。
  - **SQLite:** 轻量级、无服务器的嵌入式数据库。
- **前端:**
  - **HTML5 / CSS3**
  - **Vanilla JavaScript (ES6+):** 无前端框架，轻量且高效。
  - **Tailwind CSS:** 用于快速构建 UI 的实用程序优先的 CSS 框架。
- **容器化:**
  - **Docker & Docker Compose:** 用于快速构建、打包和部署应用。

## 3. 目录结构规范

项目遵循以下目录结构，以确保代码的组织性和可维护性：

```
/TaskGo
|-- cmd/                       # 程序主入口
|   `-- main.go
|-- docs/                      # 项目文档
|-- internal/                  # 核心业务逻辑，不对外暴露
|   |-- auth/                  # JWT 认证逻辑
|   |-- database/              # 数据库连接与初始化
|   |-- handlers/              # HTTP 请求处理器 (API 逻辑)
|   |-- middleware/            # Gin 中间件
|   |-- models/                # 数据模型 (structs)
|   `-- router/                # Gin 路由配置
|-- web/                       # 所有前端文件
|   |-- static/                # CSS, JavaScript, 图标等静态资源
|   |   |-- css/
|   |   |-- js/
|   |   |-- icons/
|   |   |-- images/
|   |   `-- avatars/
|   |-- templates/             # HTML 模板
|   |   `-- index.html
|   |-- manifest.json          # PWA 清单文件
|   `-- service-worker.js      # PWA Service Worker
|-- go.mod                     # Go 模块依赖
|-- go.sum
|-- Dockerfile                 # 用于构建生产环境的 Docker 镜像
|-- docker-compose.yml         # 用于本地开发的 Docker Compose 配置
`-- README.md                  # 项目主文档
```

## 4. 代码组织原则

- **按功能模块划分目录:** `internal` 目录下的子目录应清晰地表示不同的功能模块（如 `auth`, `handlers`, `models` 等）。
- **单一职责原则:** 每个文件、函数或结构体应只负责一个明确的职责，提高代码的内聚性。
- **状态管理与数据一致性:** 在处理数据时，尤其是在前端和后端交互时，需确保数据的一致性和同步更新。
- **拆分和复用逻辑:** 识别可复用的代码片段，并将其抽象为独立的函数或模块，减少重复代码。
- **代码注释与可读性:** 关键代码、复杂逻辑和公共接口应添加详细的中文注释，提高代码可读性。
- **常量化、持续模块化、数据管理层抽象:** 尽可能使用常量，将功能模块化，并对数据管理层进行抽象，以便于维护和扩展。

## 5. 前端规范

- **Tailwind CSS:** 所有前端样式应使用 Tailwind CSS 框架，遵循其原子化 CSS 的理念。
- **Vanilla JavaScript:** 避免使用大型前端框架，保持 JavaScript 代码的轻量和高效。
- **响应式设计:** 确保界面在不同尺寸的屏幕（桌面、平板、手机）上都能良好显示和操作。
- **PWA 支持:** 遵循 PWA 相关规范，确保 `manifest.json` 和 `service-worker.js` 的正确配置和功能实现。
- **HTML 模板:** `web/templates` 目录下的 HTML 文件应结构清晰，易于理解和维护。

## 6. 开发命令

- **构建后端应用:**
  ```bash
  go build -o taskgo.exe ./cmd/main.go
  ```
- **运行后端应用:**
  ```bash
  .\taskgo.exe
  ```
- **启动应用 (直接运行):**
  ```bash
  go run ./cmd/main.go
  ```
- **安装 Go 模块依赖:**
  ```bash
  go mod tidy
  ```

## 7. 注意事项

- **后端 API 优先:** 新功能开发时，如果需要后端 API 支持，应先完成后端 API 及相关代码的开发和测试，再进行前端页面的开发。
- **前端修改后重新启动:** 前端代码修改后，需要关闭当前运行的 `taskgo.exe` 进程，然后重新执行 `.\taskgo.exe` 命令，并刷新浏览器预览界面。
- **代码风格:** 遵循 Go 语言官方的代码风格指南 (`go fmt`) 和 Gin 框架的最佳实践。
- **安全性:** 编写代码时应始终考虑安全性，防止常见的 Web 漏洞（如 SQL 注入、XSS 等）。
- **性能优化:** 关注代码性能，尤其是在处理大量数据或高并发请求时。

希望这份规范能帮助我们更好地协作，共同打造高质量的 TaskGo 项目！😊
