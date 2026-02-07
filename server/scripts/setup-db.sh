#!/bin/bash

# ZForm 数据库快速设置脚本

echo "🚀 ZForm 数据库设置向导"
echo "========================"
echo ""

# 检查 PostgreSQL 是否安装
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL 未安装"
    echo "请先安装 PostgreSQL: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL 已安装"
echo ""

# 提示输入数据库信息
read -p "数据库名称 [zform]: " DB_NAME
DB_NAME=${DB_NAME:-zform}

read -p "数据库用户 [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "数据库密码: " DB_PASSWORD
echo ""

read -p "数据库主机 [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "数据库端口 [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo "正在创建数据库..."

# 创建数据库
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"

if [ $? -eq 0 ]; then
    echo "✅ 数据库创建成功"
else
    echo "❌ 数据库创建失败"
    exit 1
fi

# 生成 .env 文件
ENV_FILE="../.env"
echo ""
echo "正在生成 .env 文件..."

cat > $ENV_FILE << EOF
# 数据库连接
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

# 服务器配置
PORT=3001
NODE_ENV=development
EOF

echo "✅ .env 文件已生成"
echo ""
echo "下一步："
echo "  1. 运行 'npm install' 安装依赖"
echo "  2. 运行 'npm run prisma:generate' 生成 Prisma Client"
echo "  3. 运行 'npm run prisma:migrate' 创建数据库表"
echo "  4. 运行 'npm run prisma:seed' 创建示例数据（可选）"
echo "  5. 运行 'npm run dev' 启动开发服务器"
echo ""
echo "🎉 设置完成！"
