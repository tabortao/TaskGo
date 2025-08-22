# GitHub Actions 工作流

此目录包含 TaskGo 项目的 GitHub Actions 工作流。

## CI/CD 流水线 (`cicd.yml`)

此工作流自动化构建 TaskGo Docker 镜像并将其推送到 Docker Hub 的过程。

### 触发器

-   **推送标签:** 当匹配 `v*.*.*` 模式的新标签被推送到存储库时，工作流将自动触发。
-   **手动调度:** 可以从 GitHub 存储库的 Actions 选项卡手动触发工作流。这需要提供一个发布标签 (例如, `v1.0.0`)。

### 作业

-   **`build-and-push`:**
    1.  签出代码。
    2.  设置 Go 环境。
    3.  使用 `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN` 秘密登录到 Docker Hub。
    4.  提取元数据以使用发布标签和 `latest` 标记 Docker 镜像。
    5.  构建 Docker 镜像并将其推送到 Docker Hub。

## 发布 Go 二进制文件 (`release.yml`)

此工作流自动化为不同操作系统构建 Go 二进制文件并创建 GitHub Release 的过程。

### 触发器

-   **推送标签:** 当匹配 `v*.*.*` 模式的新标签被推送到存储库时，工作流将自动触发。
-   **手动调度:** 可以从 GitHub 存储库的 Actions 选项卡手动触发工作流。这需要提供一个发布标签 (例如, `v1.0.0`)。

### 作业

-   **`build-and-release`:**
    -   在操作系统 (Linux, Windows, macOS) 和架构 (amd64) 的矩阵上运行。
    1.  签出代码。
    2.  设置 Go 环境。
    3.  从触发工作流的事件中确定发布标签。
    4.  根据操作系统设置输出可执行文件的名称 (`TaskGo.exe` 用于 Windows, `TaskGo` 用于其他系统)。
    5.  为特定的操作系统和架构构建 Go 二进制文件。
    6.  将二进制文件和 `web` 目录打包成一个压缩文件 (`.zip` 用于 Windows, `.tar.gz` 用于其他系统)。
    7.  创建一个新的 GitHub Release 并将压缩文件作为资产上传。