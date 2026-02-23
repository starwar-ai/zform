# ZForm 后端安装指南

## 前置要求

在开始之前，请确保系统已安装：

- **Node.js** 18.x 或更高版本
- **PostgreSQL** 14.x 或更高版本
- **npm** 或 **pnpm** 包管理器

## 安装步骤

### 1. 安装 PostgreSQL

#### Windows

1. 下载 PostgreSQL 安装程序：https://www.postgresql.org/download/windows/
2. 运行安装程序，设置超级用户密码（记住此密码）
3. 默认端口：5432

#### macOS

```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. 创建数据库

使用 PostgreSQL 命令行工具创建数据库：

```bash
# 连接到 PostgreSQL（Windows）
psql -U postgres

# 创建数据库
CREATE DATABASE zform;

# 创建用户（可选，推荐）
CREATE USER zform_user WITH PASSWORD 'your_password';

# 授权
GRANT ALL PRIVILEGES ON DATABASE zform TO zform_user;

# 退出
\q
```

### 3. 配置环境变量

编辑 `server/.env` 文件，配置数据库连接：

```env
# 使用 postgres 超级用户
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/zform?schema=public"

# 或使用创建的专用用户
DATABASE_URL="postgresql://zform_user:your_password@localhost:5432/zform?schema=public"

PORT=3001
NODE_ENV=development
```

**连接字符串格式：**
```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?schema=public
```

### 4. 安装依赖

```bash
cd server
npm install
```

### 5. 生成 Prisma Client

```bash
npm run prisma:generate
```

### 6. 创建数据库表

```bash
npm run prisma:migrate
```

第一次运行会提示输入迁移名称，例如：`init`

### 7. 运行种子数据（可选）

```bash
npm run prisma:seed
```

这会创建示例数据：
- 1 个部门
- 1 个品牌
- 1 个产品分类
- 1 个海关编码
- 1 个包装方式
- 4 个产品（标准产品、客户产品、辅料、组件）
- BOM 和辅料关系

### 8. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

### 9. 验证安装

打开浏览器或使用 curl 测试：

```bash
# 健康检查
curl http://localhost:3001/health

# 获取产品列表
curl http://localhost:3001/api/products
```

预期响应：

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 4,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  },
  "timestamp": "2026-02-07T..."
}
```

## 使用 Prisma Studio

可视化管理数据库数据：

```bash
npm run prisma:studio
```

浏览器会自动打开 `http://localhost:5555`

## 常见问题

### Q1: 数据库连接失败

**错误信息：**
```
Error: P1001: Can't reach database server at `localhost:5432`
```

**解决方法：**
1. 检查 PostgreSQL 服务是否运行：
   ```bash
   # Windows
   services.msc  # 查找 postgresql 服务

   # macOS
   brew services list

   # Linux
   sudo systemctl status postgresql
   ```

2. 检查端口是否正确（默认 5432）
3. 检查防火墙设置

### Q2: 认证失败

**错误信息：**
```
Error: P1001: Authentication failed against database server
```

**解决方法：**
1. 检查 `.env` 中的用户名和密码
2. 重置 PostgreSQL 用户密码：
   ```sql
   ALTER USER postgres PASSWORD 'new_password';
   ```

### Q3: 迁移失败

**错误信息：**
```
Error: Migration failed to apply
```

**解决方法：**
1. 重置数据库（开发环境）：
   ```bash
   npm run prisma:migrate reset
   ```

2. 或手动删除迁移记录：
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

### Q4: 端口冲突

**错误信息：**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决方法：**
修改 `.env` 中的端口：
```env
PORT=3002
```

### Q5: Prisma Client 版本不匹配

**解决方法：**
重新生成 Prisma Client：
```bash
npm run prisma:generate
```

## 数据库维护

### 备份数据库

```bash
# 备份到文件
pg_dump -U postgres -d zform > backup.sql

# 使用自定义格式（推荐）
pg_dump -U postgres -Fc -d zform -f backup.dump
```

### 恢复数据库

```bash
# 从 SQL 文件恢复
psql -U postgres -d zform < backup.sql

# 从自定义格式恢复
pg_restore -U postgres -d zform backup.dump
```

### 查看数据库大小

```sql
SELECT pg_size_pretty(pg_database_size('zform'));
```

### 清理测试数据

```bash
# 重置数据库（会删除所有数据）
npm run prisma:migrate reset

# 重新运行种子数据
npm run prisma:seed
```

## 生产环境部署建议

### 环境变量

创建 `.env.production`：

```env
DATABASE_URL="postgresql://user:password@production-host:5432/zform?schema=public&sslmode=require"
PORT=3001
NODE_ENV=production
```

### 构建生产版本

```bash
npm run build
npm run start
```

### 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/index.js --name zform-server

# 查看日志
pm2 logs zform-server

# 重启应用
pm2 restart zform-server
```

### 数据库连接池

生产环境建议配置连接池：

```env
DATABASE_URL="postgresql://user:password@host:5432/zform?schema=public&connection_limit=10&pool_timeout=10"
```

### SSL 连接

生产环境启用 SSL：

```env
DATABASE_URL="postgresql://user:password@host:5432/zform?schema=public&sslmode=require"
```

## 下一步

安装完成后，可以：

1. 阅读 [API 文档](./README.md#api-端点)
2. 测试 API 端点
3. 集成前端应用
4. 添加自定义业务逻辑
5. 扩展其他模块（品牌、分类等）

## 获取帮助

如遇到问题：

1. 查看服务器日志：`npm run dev` 的控制台输出
2. 检查 Prisma 日志：`.env` 中添加 `DEBUG=*`
3. 使用 Prisma Studio 检查数据
4. 参考 [Prisma 文档](https://www.prisma.io/docs/)
