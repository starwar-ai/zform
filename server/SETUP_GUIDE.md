# 销售合同后台设置指南

## 前置要求

- Node.js >= 18
- PostgreSQL >= 14
- pnpm 或 npm

## 安装步骤

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置数据库

确保 PostgreSQL 数据库已运行，并创建数据库：

```sql
CREATE DATABASE zform;
```

### 3. 配置环境变量

检查 `.env` 文件配置：

```env
# 数据库连接
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zform?schema=public"

# 服务器配置
PORT=3001
NODE_ENV=development
```

根据实际情况修改数据库连接字符串。

### 4. 生成 Prisma 客户端

```bash
npm run prisma:generate
```

如果遇到文件权限问题（Windows），可以尝试：
1. 以管理员身份运行命令提示符
2. 或者关闭可能占用文件的进程（如 VS Code、数据库客户端等）
3. 或者直接运行：`npx prisma generate`

### 5. 创建数据库迁移

```bash
npm run prisma:migrate
```

系统会提示输入迁移名称，例如：`add_sales_contract`

这将会创建数据库表结构，包括：
- `sales_contracts` - 销售合同主表
- `sales_contract_items` - 销售合同明细表
- 以及所有相关的枚举类型和索引

### 6. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动。

### 7. 访问 API 文档

打开浏览器访问：http://localhost:3001/api-docs

Swagger 文档提供了所有 API 的交互式测试界面。

## 数据库结构

运行迁移后，将创建以下主要表：

### 销售合同相关

1. **sales_contracts** - 销售合同主表
   - 96 个字段，覆盖完整的销售订单业务
   - 包含客户信息、金额、物流、成本、利润等

2. **sales_contract_items** - 销售合同明细表
   - 产品明细行
   - 数量、价格、包装等信息

### 其他已有表

- **customers** - 客户主表
- **customer_bank_accounts** - 客户银行账户
- **customer_contacts** - 客户联系人
- **suppliers** - 供应商主表
- **supplier_bank_accounts** - 供应商银行账户
- **supplier_quotations** - 供应商报价
- **products** - 产品主表
- **product_boms** - 产品BOM
- **product_accessories** - 产品辅料

## API 测试

### 使用 cURL 测试

#### 1. 创建销售合同

```bash
curl -X POST http://localhost:3001/api/sales-contracts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user" \
  -d '{
    "code": "SC202602001",
    "customerId": "test-customer-id",
    "customerCode": "C001",
    "customerName": "测试客户",
    "currency": "USD",
    "totalAmount": 10000,
    "items": [
      {
        "productName": "测试产品",
        "quantity": 100,
        "unitPrice": 100,
        "amount": 10000
      }
    ]
  }'
```

#### 2. 获取销售合同列表

```bash
curl http://localhost:3001/api/sales-contracts?page=1&pageSize=20
```

#### 3. 审核销售合同

```bash
curl -X POST http://localhost:3001/api/sales-contracts/{id}/approve \
  -H "Content-Type: application/json" \
  -H "X-User-Id: manager" \
  -d '{"approved": true}'
```

### 使用 Postman 测试

1. 导入 Swagger 文档到 Postman
2. 访问 http://localhost:3001/api-docs
3. 下载 OpenAPI JSON 规范
4. 在 Postman 中导入该文件

## 数据库管理

### Prisma Studio

使用 Prisma Studio 可视化管理数据库：

```bash
npm run prisma:studio
```

浏览器将自动打开 http://localhost:5555，可以直接查看和编辑数据。

### 查看迁移历史

```bash
npx prisma migrate status
```

### 重置数据库（开发环境）

```bash
npx prisma migrate reset
```

⚠️ 警告：这会删除所有数据！

### 运行种子数据

```bash
npm run prisma:seed
```

## 常见问题

### 1. Prisma 生成失败

**问题**：`EPERM: operation not permitted`

**解决方案**：
- Windows: 以管理员身份运行，或关闭占用文件的进程
- 删除 `node_modules` 和 `node_modules/.prisma` 后重新安装

### 2. 数据库连接失败

**问题**：`Can't reach database server`

**解决方案**：
- 确保 PostgreSQL 正在运行
- 检查 `.env` 中的数据库连接字符串
- 确认数据库、用户名、密码正确

### 3. 迁移失败

**问题**：`Migration failed`

**解决方案**：
- 检查数据库权限
- 查看迁移日志获取详细错误
- 如果是开发环境，可以重置数据库

### 4. 端口冲突

**问题**：`Port 3001 is already in use`

**解决方案**：
- 修改 `.env` 中的 `PORT` 值
- 或关闭占用 3001 端口的进程

## 生产环境部署

### 1. 构建项目

```bash
npm run build
```

### 2. 运行迁移

```bash
npx prisma migrate deploy
```

### 3. 启动服务

```bash
npm start
```

### 4. 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/index.js --name zform-server

# 查看日志
pm2 logs zform-server

# 重启
pm2 restart zform-server

# 停止
pm2 stop zform-server
```

### 5. Docker 部署（可选）

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

构建并运行：

```bash
docker build -t zform-server .
docker run -p 3001:3001 --env-file .env zform-server
```

## 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | - | ✅ |
| `PORT` | 服务器端口 | 3001 | ❌ |
| `NODE_ENV` | 运行环境 | development | ❌ |

## API 端点总览

### 销售合同

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/sales-contracts` | 创建销售合同 |
| GET | `/api/sales-contracts` | 获取销售合同列表 |
| GET | `/api/sales-contracts/statistics` | 获取统计数据 |
| GET | `/api/sales-contracts/:id` | 获取销售合同详情 |
| GET | `/api/sales-contracts/code/:code` | 根据编号获取 |
| PUT | `/api/sales-contracts/:id` | 更新销售合同 |
| DELETE | `/api/sales-contracts/:id` | 删除销售合同 |
| POST | `/api/sales-contracts/:id/approve` | 审核 |
| POST | `/api/sales-contracts/:id/confirm` | 确认 |
| PUT | `/api/sales-contracts/:id/status` | 更新状态 |
| POST | `/api/sales-contracts/:id/sign-back` | 回签 |
| POST | `/api/sales-contracts/:id/print` | 打印 |
| POST | `/api/sales-contracts/:id/to-purchase-plan` | 转采购计划 |
| GET | `/api/sales-contracts/:id/items` | 获取明细 |
| POST | `/api/sales-contracts/:id/items` | 添加明细 |
| PUT | `/api/sales-contracts/:id/items/:itemId` | 更新明细 |
| DELETE | `/api/sales-contracts/:id/items/:itemId` | 删除明细 |

### 其他模块

- `/api/customers` - 客户管理
- `/api/suppliers` - 供应商管理
- `/api/quotations` - 供应商报价
- `/api/products` - 产品管理

## 下一步

1. 根据业务需求添加权限验证中间件
2. 实现用户认证和授权
3. 添加数据验证（使用 Zod）
4. 实现文件上传功能（附件、设计稿等）
5. 添加审计日志
6. 实现推送通知
7. 集成第三方服务（支付、物流等）

## 技术支持

如有问题，请查看：
- API 文档：`SALES_CONTRACT_API.md`
- Prisma 文档：https://www.prisma.io/docs
- Express 文档：https://expressjs.com
