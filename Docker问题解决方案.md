# TaskGo Docker 启动问题解决方案 🐳

## 问题描述
启动 Docker 时出现以下错误：
```
panic: Failed to connect to database: unable to open database file: out of memory (14)
```

## 问题原因分析 🔍

1. **缺少数据目录**：Docker Compose 配置中映射的 `./taskgo_data/` 目录不存在
2. **权限问题**：容器内用户权限设置可能导致数据库文件无法创建或访问
3. **Docker 未安装**：系统中没有安装 Docker 或 Docker Compose

## 解决方案 ✅

### 🚀 快速解决方案（推荐）：本地运行
如果你不想安装 Docker，可以直接在本地运行 TaskGo：

1. **运行本地测试脚本**：
   - 双击 `test_local.bat` 文件
   - 脚本会自动检查环境、安装依赖并启动应用
   - 访问 http://localhost:8080

2. **手动本地运行**：
   ```bash
   # 安装依赖
   go mod tidy
   
   # 启动应用
   go run ./cmd/main.go
   ```

### 🐳 Docker 解决方案

#### 步骤 1：安装 Docker Desktop
1. 访问 [Docker Desktop 官网](https://www.docker.com/products/docker-desktop/)
2. 下载并安装适合 Windows 的 Docker Desktop
3. 安装完成后重启计算机
4. 启动 Docker Desktop 并等待其完全启动

### 步骤 2：创建必要的数据目录
已经为你创建了以下目录结构：
```
taskgo_data/
├── db/              # 数据库文件存储
├── avatars/         # 用户头像存储
├── images/          # 任务图片存储
└── attachments/     # 附件存储（预留）
```

### 步骤 3：Docker Compose 配置优化
已经修改了 `docker-compose.yml` 文件：
- 注释掉了 `user: "1001:1001"` 配置，使用默认权限
- 这样可以避免权限冲突导致的数据库访问问题

### 步骤 4：启动应用
在项目根目录执行以下命令：
```bash
# 启动容器（后台运行）
docker compose up -d

# 查看容器状态
docker compose ps

# 查看容器日志
docker compose logs taskgo

# 停止容器
docker compose down
```

## 验证解决方案 🧪

1. **检查容器状态**：
   ```bash
   docker compose ps
   ```
   应该显示 taskgo 容器状态为 "Up"

2. **检查应用访问**：
   - 打开浏览器访问：http://localhost:21280
   - 应该能正常看到 TaskGo 应用界面

3. **检查数据库文件**：
   ```bash
   ls -la taskgo_data/db/
   ```
   应该能看到 `taskgo.db` 文件

## 常见问题排查 🛠️

### 如果仍然出现数据库错误：
1. **清理旧数据**：
   ```bash
   docker compose down
   rm -rf taskgo_data/db/*
   docker compose up -d
   ```

2. **检查磁盘空间**：
   确保系统有足够的磁盘空间创建数据库文件

3. **检查权限**：
   ```bash
   # Windows PowerShell
   icacls taskgo_data /grant Everyone:F /T
   ```

### 如果 Docker 命令不工作：
1. 确认 Docker Desktop 已启动
2. 重启 PowerShell 或命令提示符
3. 检查 Docker 是否添加到系统 PATH

## 后续建议 💡

1. **定期备份**：定期备份 `taskgo_data/db/` 目录中的数据库文件
2. **监控日志**：使用 `docker compose logs -f taskgo` 监控应用运行状态
3. **更新镜像**：定期更新 Docker 镜像以获取最新功能和安全修复

## 联系支持 📞

如果问题仍然存在，请提供以下信息：
- Docker Desktop 版本
- Windows 版本
- 完整的错误日志
- `docker compose logs taskgo` 的输出

祝你使用愉快！🎉