@echo off
chcp 65001 >nul
echo ==========================================
echo     车型技术知识库管理系统
echo     Laragon 环境专用启动脚本
echo ==========================================
echo.
echo [1/5] 检查 Laragon 环境...
if not exist "C:\laragon\bin\nodejs" (
    echo ❌ 警告：未检测到 Laragon Node.js，请确保 Laragon 已启动
)
echo ✅ Laragon 环境检查完成

echo.
echo [2/5] 检查 Node.js 版本...
node --version
npm --version

echo.
echo [3/5] 检查项目依赖...
if not exist "node_modules" (
    echo 📦 正在安装依赖包...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
) else (
    echo ✅ 依赖包已存在
)

echo.
echo [4/5] 类型检查...
npm run type-check
if errorlevel 1 (
    echo ⚠️  类型检查发现问题，但继续启动...
)

echo.
echo [5/5] 启动开发服务器...
echo 🌐 开发地址: http://localhost:3001
echo 🌐 Laragon 代理: http://knowledge-base.test:3001
echo 📱 局域网访问: http://%COMPUTERNAME%.local:3001
echo 🛑 按 Ctrl+C 停止服务器
echo ==========================================
echo.
npm run dev