# ZForm 后端服务

基于 Node.js + Express + Prisma + PostgreSQL 的企业单据管理系统后端服务。

## 技术栈

- **框架**: Express.js 4.x
- **语言**: TypeScript 5.x
- **数据库**: PostgreSQL 14+
- **ORM**: Prisma 5.x
- **运行时**: Node.js 18+

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制环境变量模板并配置数据库连接：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/zform?schema=public"
PORT=3001
NODE_ENV=development
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 创建数据库迁移
npm run prisma:migrate

# 运行种子数据
npm run prisma:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热重载） |
| `npm run build` | 编译 TypeScript 到 JavaScript |
| `npm run start` | 启动生产服务器 |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:migrate` | 创建/应用数据库迁移 |
| `npm run prisma:studio` | 打开 Prisma Studio（数据库可视化工具） |
| `npm run prisma:seed` | 运行种子数据 |

## API 端点

### 健康检查

```
GET /health
```

### 产品管理

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/products` | 创建产品 |
| GET | `/api/products` | 获取产品列表（分页、搜索、过滤） |
| GET | `/api/products/:id` | 获取产品详情 |
| PUT | `/api/products/:id` | 更新产品 |
| DELETE | `/api/products/:id` | 删除产品（软删除） |
| POST | `/api/products/:id/bom` | 添加 BOM 项 |
| POST | `/api/products/:id/accessories` | 添加辅料 |
| GET | `/api/products/:id/change-logs` | 获取变更历史 |

## API 使用示例

### 创建产品

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -d '{
    "code": "PROD001",
    "name": "测试产品",
    "productType": "STANDARD",
    "status": "ACTIVE",
    "unit": "PCS",
    "material": "PC",
    "salePrice": 9.99
  }'
```

### 获取产品列表

```bash
# 基础查询
curl http://localhost:3001/api/products?page=1&pageSize=20

# 搜索
curl http://localhost:3001/api/products?search=手机壳

# 过滤
curl http://localhost:3001/api/products?productType=STANDARD&status=ACTIVE
```

### 获取产品详情

```bash
curl http://localhost:3001/api/products/{product-id}
```

### 更新产品

```bash
curl -X PUT http://localhost:3001/api/products/{product-id} \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -d '{
    "name": "更新后的产品名称",
    "salePrice": 12.99
  }'
```

### 添加 BOM

```bash
curl -X POST http://localhost:3001/api/products/{product-id}/bom \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -d '{
    "childProductId": "{child-product-id}",
    "quantity": 2
  }'
```

### 添加辅料

```bash
curl -X POST http://localhost:3001/api/products/{product-id}/accessories \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -d '{
    "accessoryId": "{accessory-product-id}",
    "productRatio": 1,
    "accessoryRatio": 1
  }'
```

## 数据模型

### 核心实体

- **Product** - 产品主表
  - 支持三种类型：标准产品（STANDARD）、客户产品（CUSTOMER）、自营产品（SELF_OWNED）
  - 客户产品和自营产品可以基于标准产品创建（`baseProductId`）

- **ProductBom** - 产品 BOM 关系
  - 记录产品与子产品的组成关系
  - 支持版本管理

- **ProductAccessory** - 产品辅料关系
  - 记录产品与辅料的关联关系
  - 支持比例配置

- **ProductChangeLog** - 产品变更记录
  - 自动记录所有产品变更
  - 支持版本追溯

### 基础数据

- **Department** - 部门
- **Brand** - 品牌
- **ProductCategory** - 产品分类（支持多级）
- **HsCode** - 海关编码（支持多级）
- **PackageMethod** - 包装方式

## 项目结构

```
server/
├── src/
│   ├── config/              # 配置文件
│   │   └── database.ts      # 数据库连接
│   ├── routes/              # API 路由
│   │   ├── products.ts      # 产品路由
│   │   └── index.ts         # 路由聚合
│   ├── controllers/         # 控制器
│   │   └── product.controller.ts
│   ├── services/            # 业务逻辑层
│   │   └── product.service.ts
│   ├── middleware/          # 中间件
│   │   └── error-handler.ts
│   ├── utils/               # 工具函数
│   │   └── response.ts      # 统一响应格式
│   └── index.ts             # 入口文件
├── prisma/
│   ├── schema.prisma        # Prisma Schema
│   ├── migrations/          # 数据库迁移
│   └── seed.ts              # 种子数据
├── .env                     # 环境变量（不提交）
├── .env.example             # 环境变量模板
├── tsconfig.json            # TypeScript 配置
└── package.json             # 依赖配置
```

## 开发注意事项

### 软删除

所有删除操作使用 `deletedAt` 字段标记，不进行物理删除：

```typescript
await prisma.product.update({
  where: { id },
  data: { deletedAt: new Date() }
});
```

查询时自动过滤已删除记录：

```typescript
where: { deletedAt: null }
```

### 变更追踪

关键操作自动记录到 `ProductChangeLog` 表，包括：
- 创建（CREATE）
- 更新（UPDATE）
- 删除（DELETE）
- 状态变更（STATUS_CHANGE）

### 用户标识

API 请求需要携带 `X-User-Id` 请求头用于审计追踪：

```bash
-H "X-User-Id: user123"
```

如果未提供，默认使用 `system` 作为用户标识。

### 响应格式

所有 API 响应遵循统一格式：

**成功响应：**
```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-02-07T..."
}
```

**分页响应：**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  },
  "timestamp": "2026-02-07T..."
}
```

**错误响应：**
```json
{
  "success": false,
  "message": "错误信息",
  "code": 500,
  "timestamp": "2026-02-07T..."
}
```

## 数据库管理

### Prisma Studio

可视化管理数据库：

```bash
npm run prisma:studio
```

浏览器访问 `http://localhost:5555`

### 数据库迁移

创建新迁移：

```bash
npx prisma migrate dev --name migration_name
```

应用迁移：

```bash
npx prisma migrate deploy
```

重置数据库（开发环境）：

```bash
npx prisma migrate reset
```

## 故障排查

### 数据库连接失败

1. 检查 PostgreSQL 服务是否启动
2. 验证 `.env` 中的 `DATABASE_URL` 配置
3. 确认数据库用户权限

### Prisma Client 未生成

```bash
npm run prisma:generate
```

### 端口冲突

修改 `.env` 中的 `PORT` 值：

```env
PORT=3002
```

## 后续扩展

- [ ] 品牌管理 API
- [ ] 海关编码管理 API
- [ ] 包装方式管理 API
- [ ] 用户认证与授权（JWT）
- [ ] 文件上传（产品图片、附件）
- [ ] 数据导入导出（Excel）
- [ ] API 文档（Swagger/OpenAPI）
- [ ] 单元测试（Jest）
- [ ] Docker 部署配置

## License

MIT
