# ZForm - 企业单据管理系统

ZForm 是一个完整的企业单据管理系统，包含前端和后端两部分。

## 项目概述

- **前端**: React + TypeScript + Vite，Schema-driven 动态表单系统
- **后端**: Node.js + Express + Prisma + PostgreSQL，RESTful API 服务

## 快速开始

### 前端开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

访问 `http://localhost:5173`

### 后端开发

详细的后端安装和配置指南，请查看 [server/SETUP.md](./server/SETUP.md)

**快速开始：**

```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 配置数据库（编辑 .env 文件）
cp .env.example .env

# 生成 Prisma Client
npm run prisma:generate

# 创建数据库表
npm run prisma:migrate

# 运行种子数据（可选）
npm run prisma:seed

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3001`

## 项目结构

```
zform/
├── src/                    # 前端源码
│   ├── core/               # 核心引擎
│   ├── components/         # React 组件
│   ├── stores/             # Zustand 状态管理
│   ├── hooks/              # React Hooks
│   └── examples/           # 示例代码
├── server/                 # 后端源码
│   ├── src/                # TypeScript 源码
│   │   ├── config/         # 配置文件
│   │   ├── routes/         # API 路由
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── middleware/     # 中间件
│   │   └── utils/          # 工具函数
│   ├── prisma/             # Prisma ORM
│   │   ├── schema.prisma   # 数据库 Schema
│   │   ├── migrations/     # 数据库迁移
│   │   └── seed.ts         # 种子数据
│   └── scripts/            # 辅助脚本
├── CLAUDE.md               # 项目开发规范
└── README.md               # 本文件
```

## 技术栈

### 前端

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand + Immer
- **表格**: TanStack Table
- **UI 组件**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS v4
- **数据校验**: Zod（预留）

### 后端

- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: PostgreSQL 14+
- **ORM**: Prisma
- **安全**: Helmet + CORS

## 核心功能

### 前端功能

- ✅ **动态表单**: 根据 Schema 自动渲染表单和表格
- ✅ **单据下推**: 从上游单据生成下游单据
- ✅ **追溯关系**: 双向追溯单据来源和去向
- ✅ **变更影响评估**: 修改时自动评估影响范围

### 后端功能

- ✅ **产品管理**: 完整的 CRUD API
  - 支持标准产品、客户产品、自营产品三种类型
  - 产品继承关系（客户产品/自营产品基于标准产品）
- ✅ **产品 BOM**: 产品与子产品的组成关系
- ✅ **产品辅料**: 产品与辅料的关联关系
- ✅ **变更记录**: 自动记录所有产品变更历史
- ✅ **分页查询**: 支持搜索、过滤、排序
- ✅ **软删除**: 所有删除操作可恢复

## API 文档

后端 API 端点：

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/products` | 创建产品 |
| GET | `/api/products` | 获取产品列表 |
| GET | `/api/products/:id` | 获取产品详情 |
| PUT | `/api/products/:id` | 更新产品 |
| DELETE | `/api/products/:id` | 删除产品 |
| POST | `/api/products/:id/bom` | 添加 BOM |
| POST | `/api/products/:id/accessories` | 添加辅料 |
| GET | `/api/products/:id/change-logs` | 获取变更历史 |

详细的 API 使用示例，请查看 [server/README.md](./server/README.md)

## 开发指南

### 前端开发

查看 [CLAUDE.md](./CLAUDE.md) 了解：
- 项目架构和设计理念
- 核心概念（DocumentSchema、PushDownRule、ChangeRule）
- 开发约定和最佳实践

### 后端开发

查看 [server/README.md](./server/README.md) 了解：
- 项目结构和技术选型
- 数据模型设计
- API 使用方法
- 开发注意事项

### 数据库管理

使用 Prisma Studio 可视化管理数据：

```bash
cd server
npm run prisma:studio
```

## 环境要求

### 前端

- Node.js 18+
- npm 或 pnpm

### 后端

- Node.js 18+
- PostgreSQL 14+
- npm 或 pnpm

## 部署

### 前端部署

```bash
npm run build
```

构建产物在 `dist/` 目录，可部署到任何静态文件服务器。

### 后端部署

```bash
cd server
npm run build
npm run start
```

推荐使用 PM2 进行进程管理：

```bash
pm2 start dist/index.js --name zform-server
```

## 后续规划

- [ ] 品牌管理 API
- [ ] 海关编码管理 API
- [ ] 包装方式管理 API
- [ ] 用户认证与授权（JWT）
- [ ] 文件上传服务
- [ ] 数据导入导出（Excel）
- [ ] API 文档（Swagger）
- [ ] 单元测试
- [ ] Docker 部署配置
- [ ] 前后端集成

## 故障排查

### 前端常见问题

- **端口冲突**: 修改 `vite.config.ts` 中的端口配置
- **依赖安装失败**: 删除 `node_modules` 和 `package-lock.json` 后重新安装

### 后端常见问题

查看 [server/SETUP.md](./server/SETUP.md#常见问题) 了解详细的故障排查步骤。

## 文档

- **前端**: [CLAUDE.md](./CLAUDE.md) - 项目开发规范
- **后端**:
  - [server/README.md](./server/README.md) - API 文档
  - [server/SETUP.md](./server/SETUP.md) - 安装指南

## 获取帮助

如遇到问题：

1. 查看相关文档
2. 检查日志输出
3. 使用 Prisma Studio 检查数据（后端）
4. 提交 Issue

## License

MIT
