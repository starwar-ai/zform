@echo off
REM ZForm 数据库快速设置脚本 (Windows)

echo 🚀 ZForm 数据库设置向导
echo ========================
echo.

REM 检查 psql 是否可用
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL 未安装或未添加到 PATH
    echo 请先安装 PostgreSQL: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo ✅ PostgreSQL 已安装
echo.

REM 获取用户输入
set /p DB_NAME="数据库名称 [zform]: "
if "%DB_NAME%"=="" set DB_NAME=zform

set /p DB_USER="数据库用户 [postgres]: "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_PASSWORD="数据库密码: "

set /p DB_HOST="数据库主机 [localhost]: "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="数据库端口 [5432]: "
if "%DB_PORT%"=="" set DB_PORT=5432

echo.
echo 正在创建数据库...

REM 设置 PGPASSWORD 环境变量
set PGPASSWORD=%DB_PASSWORD%

REM 检查数据库是否存在
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -lqt | find "%DB_NAME%" >nul
if %ERRORLEVEL% NEQ 0 (
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -c "CREATE DATABASE %DB_NAME%"
    if %ERRORLEVEL% EQU 0 (
        echo ✅ 数据库创建成功
    ) else (
        echo ❌ 数据库创建失败
        pause
        exit /b 1
    )
) else (
    echo ℹ️  数据库已存在
)

REM 生成 .env 文件
echo.
echo 正在生成 .env 文件...

(
echo # 数据库连接
echo DATABASE_URL="postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%?schema=public"
echo.
echo # 服务器配置
echo PORT=3001
echo NODE_ENV=development
) > ..\\.env

echo ✅ .env 文件已生成
echo.
echo 下一步：
echo   1. 运行 'npm install' 安装依赖
echo   2. 运行 'npm run prisma:generate' 生成 Prisma Client
echo   3. 运行 'npm run prisma:migrate' 创建数据库表
echo   4. 运行 'npm run prisma:seed' 创建示例数据（可选）
echo   5. 运行 'npm run dev' 启动开发服务器
echo.
echo 🎉 设置完成！
echo.
pause
