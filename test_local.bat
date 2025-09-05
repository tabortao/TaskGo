@echo off
echo ========================================
echo TaskGo 本地运行测试脚本
echo ========================================
echo.

echo [1/4] 检查 Go 环境...
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Go 未安装或未配置
    echo 请先安装 Go: https://golang.org/dl/
    pause
    exit /b 1
) else (
    echo ✅ Go 环境正常
)

echo.
echo [2/4] 清理旧的数据库文件...
if exist "taskgo.db" (
    del "taskgo.db"
    echo ✅ 清理完成
) else (
    echo ✅ 无需清理
)

echo.
echo [3/4] 安装依赖包...
go mod tidy
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
) else (
    echo ✅ 依赖安装完成
)

echo.
echo [4/4] 启动 TaskGo 应用...
echo 正在启动，请稍候...
echo.
echo ========================================
echo 🎉 TaskGo 启动中...
echo ========================================
echo 访问地址: http://localhost:8080
echo 按 Ctrl+C 停止应用
echo ========================================
echo.

go run ./cmd/main.go