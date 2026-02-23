# 采购计划模块部署指南

## 1. 数据库迁移

### 1.1 生成 Prisma Client

```bash
cd server
npm install
npx prisma generate
```

### 1.2 创建数据库迁移

```bash
npx prisma migrate dev --name add_purchase_plan
```

这将会创建以下数据表：
- `purchase_plans` - 采购计划主表
- `purchase_plan_items` - 采购计划明细表

并添加相关的枚举类型：
- `PurchasePlanStatus` - 计划状态
- `SourceType` - 来源单类型
- `SalesType` - 销售类型
- `PurchaseType` - 采购类型
- `PurchaseMode` - 采购模式

### 1.3 同步到生产环境

```bash
npx prisma migrate deploy
```

## 2. 已创建的文件清单

### 2.1 数据模型
- ✅ `server/prisma/schema.prisma` - 添加了采购计划相关的数据模型

### 2.2 服务层
- ✅ `server/src/services/purchase-plan.service.ts` - 采购计划业务逻辑

包含的方法：
- `create()` - 创建采购计划
- `createFromSalesContract()` - 从销售合同生成采购计划
- `findMany()` - 分页查询采购计划
- `findById()` - 获取采购计划详情
- `update()` - 更新采购计划
- `updateItem()` - 更新明细
- `addItem()` - 添加明细
- `deleteItem()` - 删除明细
- `approve()` - 审核通过
- `reject()` - 拒绝
- `cancel()` - 取消
- `delete()` - 删除
- `getStatistics()` - 获取统计数据
- `generatePlanCode()` - 生成计划编号

### 2.3 控制器层
- ✅ `server/src/controllers/purchase-plan.controller.ts` - HTTP 请求处理

### 2.4 路由层
- ✅ `server/src/routes/purchase-plans.ts` - API 路由定义
- ✅ `server/src/routes/index.ts` - 注册采购计划路由

### 2.5 文档
- ✅ `server/PURCHASE_PLAN_API.md` - API 接口文档
- ✅ `server/PURCHASE_PLAN_SETUP.md` - 本部署指南

## 3. 启动服务

### 3.1 开发环境

```bash
cd server
npm run dev
```

服务将在 `http://localhost:3000` 启动

### 3.2 生产环境

```bash
cd server
npm run build
npm start
```

## 4. API 测试

### 4.1 使用 Swagger UI

访问: `http://localhost:3000/api-docs`

在 Swagger UI 中可以找到 `PurchasePlans` 标签，包含所有采购计划相关的 API。

### 4.2 使用 REST Client 测试

创建 `test-purchase-plan.http` 文件：

```http
### 获取采购计划列表
GET http://localhost:3000/api/purchase-plans
x-user-id: user-001

### 获取采购计划详情
GET http://localhost:3000/api/purchase-plans/{{planId}}
x-user-id: user-001

### 从销售合同生成采购计划
POST http://localhost:3000/api/purchase-plans/from-sales-contract/{{salesContractId}}
x-user-id: user-001

### 创建采购计划
POST http://localhost:3000/api/purchase-plans
Content-Type: application/json
x-user-id: user-001

{
  "code": "PP202602070001",
  "planDate": "2026-02-07",
  "expectedDeliveryDate": "2026-03-07",
  "customerId": "customer-001",
  "customerCode": "C001",
  "buyer": "张三"
}

### 审核通过
POST http://localhost:3000/api/purchase-plans/{{planId}}/approve
x-user-id: user-001

### 获取统计
GET http://localhost:3000/api/purchase-plans/statistics?startDate=2026-01-01&endDate=2026-12-31
x-user-id: user-001
```

## 5. 数据库表结构

### 5.1 采购计划主表 (purchase_plans)

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PK | 主键 |
| code | TEXT | UNIQUE, NOT NULL | 计划编号 |
| plan_date | TIMESTAMP | NOT NULL | 计划日期 |
| expected_delivery_date | TIMESTAMP | NOT NULL | 预计交期 |
| plan_status | ENUM | NOT NULL, DEFAULT 'DRAFT' | 计划状态 |
| approval_status | ENUM | NOT NULL, DEFAULT 'PENDING' | 审核状态 |
| source_type | ENUM | | 来源单类型 |
| sales_contract_id | TEXT | | 销售合同ID |
| sales_contract_code | TEXT | | 销售合同编号 |
| customer_id | TEXT | | 客户ID |
| customer_code | TEXT | | 客户编号 |
| buyer | TEXT | | 采购员 |
| sales_person | TEXT | | 业务员 |
| merchandiser | TEXT | | 跟单员 |
| is_accessory_purchase | BOOLEAN | DEFAULT false | 是否辅料采购 |
| remark | TEXT | | 备注 |
| created_by | TEXT | | 创建人 |
| created_at | TIMESTAMP | DEFAULT now() | 创建时间 |
| updated_by | TEXT | | 修改人 |
| updated_at | TIMESTAMP | | 修改时间 |
| deleted_at | TIMESTAMP | | 删除时间 |
| version | INTEGER | DEFAULT 1 | 版本号 |

**索引:**
- idx_purchase_plans_code
- idx_purchase_plans_plan_status
- idx_purchase_plans_approval_status
- idx_purchase_plans_sales_contract_id
- idx_purchase_plans_customer_id
- idx_purchase_plans_plan_date
- idx_purchase_plans_expected_delivery_date

### 5.2 采购计划明细表 (purchase_plan_items)

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PK | 主键 |
| purchase_plan_id | TEXT | FK, NOT NULL | 采购计划ID |
| line_number | INTEGER | NOT NULL | 行号 |
| product_id | TEXT | | 产品ID |
| product_code | TEXT | NOT NULL | SKU编号 |
| product_name | TEXT | NOT NULL | 产品名称 |
| customer_product_no | TEXT | | 客户货号 |
| specification | TEXT | | 规格 |
| purchase_quantity | DECIMAL(10,2) | NOT NULL | 采购数量 |
| pending_quantity | DECIMAL(10,2) | DEFAULT 0 | 待采购数量 |
| converted_quantity | DECIMAL(10,2) | DEFAULT 0 | 已转合同数量 |
| supplier_id | TEXT | | 供应商ID |
| supplier_code | TEXT | | 供应商编号 |
| supplier_name | TEXT | | 供应商名称 |
| unit_price | DECIMAL(15,4) | NOT NULL | 采购单价 |
| total_amount | DECIMAL(15,2) | | 总价 |
| currency | TEXT | DEFAULT 'CNY' | 币种 |
| delivery_date | TIMESTAMP | | 交货日期 |
| created_by | TEXT | | 创建人 |
| created_at | TIMESTAMP | DEFAULT now() | 创建时间 |
| updated_by | TEXT | | 修改人 |
| updated_at | TIMESTAMP | | 修改时间 |

**索引:**
- idx_purchase_plan_items_purchase_plan_id
- idx_purchase_plan_items_product_id
- idx_purchase_plan_items_supplier_id
- idx_purchase_plan_items_line_number
- idx_purchase_plan_items_sales_contract_id

**外键约束:**
- purchase_plan_id REFERENCES purchase_plans(id) ON DELETE CASCADE

## 6. 权限配置

建议配置以下权限级别：

### 6.1 采购员权限
- 创建采购计划
- 查看采购计划
- 编辑自己创建的草稿采购计划
- 取消自己创建的采购计划

### 6.2 采购主管权限
- 采购员的所有权限
- 审核/拒绝采购计划
- 编辑任何采购计划
- 删除采购计划

### 6.3 系统管理员权限
- 所有权限

## 7. 常见问题

### 7.1 迁移失败

如果迁移失败，可以重置数据库：

```bash
npx prisma migrate reset
```

**警告:** 这将删除所有数据！

### 7.2 生成的编号重复

采购计划编号使用日期+序号的方式生成，如果出现重复：
1. 检查数据库中是否有相同编号
2. 确认编号生成逻辑是否正确
3. 考虑添加分布式锁

### 7.3 从销售合同生成失败

可能的原因：
1. 销售合同不存在
2. 销售合同已经生成过采购计划
3. 销售合同没有明细数据

解决方案：检查 `sales_contracts` 表的数据和 `to_purchase_plan` 字段。

## 8. 性能优化建议

### 8.1 数据库索引

已创建的索引可以满足大部分查询需求。如果有特殊查询场景，可以添加复合索引：

```sql
-- 按客户和状态查询
CREATE INDEX idx_purchase_plans_customer_status
ON purchase_plans(customer_id, plan_status);

-- 按采购员和日期查询
CREATE INDEX idx_purchase_plans_buyer_date
ON purchase_plans(buyer, plan_date);
```

### 8.2 分页优化

- 使用 cursor-based pagination 替代 offset-based pagination
- 限制 pageSize 最大值（建议不超过 100）

### 8.3 缓存策略

对于统计数据，可以考虑使用 Redis 缓存：
- 缓存过期时间: 5-10分钟
- 缓存键格式: `purchase-plan:stats:{params}`

## 9. 监控和日志

### 9.1 关键指标

- 采购计划创建数量/天
- 审核通过率
- 平均审核时长
- 从销售合同生成的比例

### 9.2 日志记录

建议记录以下操作日志：
- 采购计划创建/更新/删除
- 审核操作（通过/拒绝）
- 状态变更
- 从销售合同生成

## 10. 下一步开发

### 10.1 待实现功能

- [ ] 采购计划导出 Excel
- [ ] 批量审核
- [ ] 采购计划模板
- [ ] 供应商自动推荐
- [ ] 价格历史查询
- [ ] 邮件通知（审核、提醒等）
- [ ] 采购计划拆分/合并

### 10.2 优化方向

- [ ] 添加单元测试
- [ ] 添加集成测试
- [ ] 性能压力测试
- [ ] 添加 GraphQL 支持
- [ ] 实时消息推送

## 11. 相关文档

- [API 接口文档](./PURCHASE_PLAN_API.md)
- [Prisma 文档](https://www.prisma.io/docs)
- [Express 文档](https://expressjs.com/)
