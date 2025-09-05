@echo off
echo ========================================
echo TaskGo Docker 启动测试脚本
echo ========================================
echo.

echo [1/5] 检查 Docker 是否安装...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未安装或未启动
    echo 请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
) else (
    echo ✅ Docker 已安装
)

echo.
echo [2/5] 检查数据目录是否存在...
if not exist "taskgo_data\db" (
    echo ❌ 数据目录不存在，正在创建...
    mkdir taskgo_data\db taskgo_data\avatars taskgo_data\images taskgo_data\attachments
    echo ✅ 数据目录创建完成
) else (
    echo ✅ 数据目录已存在
)

echo.
echo [3/5] 停止现有容器（如果存在）...
docker compose down >nul 2>&1
echo ✅ 清理完成

echo.
echo [4/5] 启动 TaskGo 容器...
docker compose up -d
if %errorlevel% neq 0 (
    echo ❌ 容器启动失败
    echo 查看详细日志: docker compose logs taskgo
    pause
    exit /b 1
) else (
    echo ✅ 容器启动成功
)

echo.
echo [5/5] 等待应用启动...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo 🎉 TaskGo 启动完成！
echo ========================================
echo 访问地址: http://localhost:21280
echo 查看日志: docker compose logs -f taskgo
echo 停止应用: docker compose down
echo ========================================
echo.

echo 按任意键打开浏览器...
pause >nul
start http://localhost:21280