# 付款计划相关代码和数据库整理

## 一、数据库表结构

### 1. scm_payment_plan（付款计划主表）

**表名**: `scm_payment_plan`

**字段说明**:

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | bigint PK AI | 主键 | |
| contract_code | varchar(20) | 合同编号 | 关联采购合同 |
| step | tinyint | 步骤 | 付款步骤序号 |
| payment_method | tinyint | 支付方式 | |
| payment_name | varchar(100) NN | 付款方式名称 | |
| payment_msg | json NN | 付款信息 | JSON格式存储付款详细信息 |
| date_type | tinyint | 起始点 | 日期计算起始点类型 |
| start_date | datetime | 起始日 | 付款计划起始日期 |
| days | int NN | 天数 | 从起始日计算的天数 |
| expected_receipt_date | datetime | 预计付款日 | 计算得出的预计付款日期 |
| payment_ratio | decimal(19, 6) NN | 付款比例 | 本次付款占总金额的比例 |
| real_payment_ratio | decimal(19, 6) NN | 实际付款比例 | 实际执行时的付款比例 |
| receivable_amount | json NN | 应付金额 | JSON格式，可能包含多币种 |
| receivable_amount_value | decimal(10, 2) | 应付金额 | 数值型应付金额 |
| received_amount | json NN | 实付金额 | JSON格式，实际已支付金额 |
| applied_amount | json NN | 已申请金额 | JSON格式，已申请但未支付的金额 |
| payment_time | datetime | 付款时间 | 实际付款时间 |
| annex | json | 水单 | 付款凭证附件（JSON数组） |
| control_invoice_flag | tinyint NN | 是否控制发票 | 0-否，1-是 |
| control_purchase_flag | tinyint NN | 是否控制采购 | 0-否，1-是 |
| exe_status | tinyint NN | 状态 | 执行状态 |
| creator | int | 创建人 | |
| create_time | datetime | 创建时间 | |
| updater | int | 修改人 | |
| update_time | datetime | 修改时间 | |
| deleted | tinyint(1) NN | 删除标记 | 0-有效，1-删除 |

**业务说明**:
- 付款计划关联到采购合同（通过 `contract_code`）
- 一个采购合同可以有多个付款计划步骤（通过 `step` 区分）
- 支持多币种金额存储（使用 JSON 字段）
- 支持付款凭证附件（水单）

### 2. scm_payment_apply（付款申请表）

**表名**: `scm_payment_apply`

**关键字段**:
- `payment_plan_id` (bigint): 付款计划ID，关联到 `scm_payment_plan.id`
- `payment_plan` (json): 流程实例状态（JSON格式）
- `apply_payment_plan_list` (json): 付款计划信息（JSON数组）
- `purchase_contract_code_list` (varchar(500)): 采购合同编号列表

**业务说明**:
- 付款申请基于付款计划创建
- 一个付款申请可以关联多个采购合同
- 付款计划信息以 JSON 格式存储在申请表中

### 3. scm_payment_apply_item（付款申请明细表）

**表名**: `scm_payment_apply_item`

**关键字段**:
- `purchase_contract_item_id` (bigint): 采购合同明细ID
- `step` (tinyint NN): 付款步骤，对应付款计划的步骤
- `paid_amount` (decimal): 已付金额
- `applied_amount` (decimal): 已申请金额
- `apply_amount` (bigint): 本次请款金额
- `invoice_status` (tinyint): 开票状态

**业务说明**:
- 付款申请明细关联到采购合同明细行
- 记录每个明细行的付款情况
- 支持按步骤（step）区分不同的付款阶段

### 4. system_payment_plan（系统付款计划模板表）

**表名**: `system_payment_plan`

**字段说明**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | bigint PK AI | 主键 |
| payment_id | bigint | 收款方式主键 |
| step | tinyint | 步骤 |
| date_type | tinyint | 起始点 |
| days | int NN | 天数 |
| payment_ratio | decimal(19, 6) NN | 付款比例 |
| payment_method | tinyint | 支付方式 |
| control_invoice_flag | tinyint NN | 是否控制发票 |
| control_purchase_flag | tinyint NN | 是否控制采购 |
| exe_status | tinyint NN | 状态 |
| creator | int | 创建人 |
| create_time | datetime | 创建时间 |
| updater | int | 修改人 |
| update_time | datetime | 修改时间 |
| deleted | tinyint(1) NN | 删除标记 |

**业务说明**:
- 系统级别的付款计划模板
- 用于定义通用的付款计划规则
- 可以作为创建具体付款计划的模板

## 二、代码层面现状

### 1. 后端代码

**当前状态**: ❌ **未实现**

**缺失内容**:
- ❌ 无 `PaymentPlan` Prisma Model 定义
- ❌ 无 `payment-plan.service.ts` 服务层
- ❌ 无 `payment-plans.ts` 路由文件
- ❌ 无付款计划相关的 API 接口

**相关文件位置**:
```
server/
├── prisma/
│   └── schema.prisma          # 需要添加 PaymentPlan 模型
├── src/
│   ├── services/              # 需要创建 payment-plan.service.ts
│   └── routes/                # 需要创建 payment-plans.ts
```

### 2. 前端代码

**当前状态**: ❌ **未实现**

**缺失内容**:
- ❌ 无付款计划 Schema 定义（类似 `purchase-plan-schemas.ts`）
- ❌ 无付款计划组件
- ❌ 无付款计划相关的 API 调用

**相关文件位置**:
```
src/
├── extrade/                   # 需要创建 payment-plan-schemas.ts
├── components/                # 需要创建付款计划相关组件
└── lib/                       # 需要创建 payment-plan-api.ts
```

### 3. 采购合同中的付款计划关联

**当前状态**: ⚠️ **部分实现**

在 `src/extrade/purchase-contract-schemas.ts` 中：
- ✅ 有付款相关字段：`paymentTerms`（付款条款）、`paymentMethod`（付款方式）
- ❌ 无付款计划明细表（detailTables）
- ❌ 无付款计划字段组

**建议补充**:
- 在采购合同 Schema 中添加付款计划明细表
- 支持在采购合同中直接管理付款计划

## 三、数据关联关系

```
采购合同 (PurchaseContract)
  └─ contract_code
      │
      ├─→ 付款计划 (scm_payment_plan)
      │     └─ contract_code (关联)
      │     └─ step (步骤序号)
      │
      └─→ 付款申请 (scm_payment_apply)
            ├─ payment_plan_id (关联付款计划)
            ├─ purchase_contract_code_list (关联多个合同)
            │
            └─→ 付款申请明细 (scm_payment_apply_item)
                  └─ purchase_contract_item_id (关联合同明细)
                  └─ step (对应付款计划步骤)
```

## 四、需要实现的功能模块

### 1. 数据库层（Prisma Schema）

**需要添加的模型**:

```prisma
// 付款计划状态枚举
enum PaymentPlanStatus {
  DRAFT         // 草稿
  ACTIVE        // 生效
  COMPLETED     // 已完成
  CANCELLED     // 已取消
}

// 付款计划主表
model PaymentPlan {
  id                    String              @id @default(cuid())
  contractCode          String              @map("contract_code") // 合同编号
  step                  Int                 // 步骤序号
  paymentMethod         Int?                @map("payment_method") // 支付方式
  paymentName           String?             @map("payment_name") // 付款方式名称
  paymentMsg            Json?               @map("payment_msg") // 付款信息（JSON）
  dateType              Int?                @map("date_type") // 起始点类型
  startDate             DateTime?           @map("start_date") // 起始日
  days                  Int                 // 天数
  expectedReceiptDate   DateTime?           @map("expected_receipt_date") // 预计付款日
  paymentRatio          Decimal             @db.Decimal(19, 6) @map("payment_ratio") // 付款比例
  realPaymentRatio      Decimal?            @db.Decimal(19, 6) @map("real_payment_ratio") // 实际付款比例
  receivableAmount      Json?               @map("receivable_amount") // 应付金额（JSON）
  receivableAmountValue Decimal?            @db.Decimal(10, 2) @map("receivable_amount_value") // 应付金额数值
  receivedAmount        Json?               @map("received_amount") // 实付金额（JSON）
  appliedAmount         Json?               @map("applied_amount") // 已申请金额（JSON）
  paymentTime           DateTime?           @map("payment_time") // 付款时间
  annex                 Json?               // 水单附件（JSON数组）
  controlInvoiceFlag    Int                 @default(0) @map("control_invoice_flag") // 是否控制发票
  controlPurchaseFlag   Int                 @default(0) @map("control_purchase_flag") // 是否控制采购
  exeStatus             Int                 @default(0) @map("exe_status") // 执行状态
  status                PaymentPlanStatus   @default(DRAFT) // 状态
  
  // 关联关系
  purchaseContract      PurchaseContract?   @relation(fields: [contractCode], references: [code])
  
  // 时间戳
  createdBy             String?             @map("created_by")
  createdAt             DateTime            @default(now()) @map("created_at")
  updatedBy             String?             @map("updated_by")
  updatedAt             DateTime            @updatedAt @map("updated_at")
  deletedAt             DateTime?           @map("deleted_at")
  
  @@unique([contractCode, step])
  @@index([contractCode])
  @@index([status])
  @@map("scm_payment_plan")
}
```

### 2. 后端服务层

**需要创建**: `server/src/services/payment-plan.service.ts`

**主要功能**:
- 创建付款计划
- 查询付款计划列表（按合同编号）
- 更新付款计划
- 删除付款计划
- 计算预计付款日期
- 更新付款状态和金额

### 3. 后端路由层

**需要创建**: `server/src/routes/payment-plans.ts`

**API 端点**:
- `GET /api/payment-plans?contractCode=xxx` - 获取合同的付款计划列表
- `GET /api/payment-plans/:id` - 获取付款计划详情
- `POST /api/payment-plans` - 创建付款计划
- `PUT /api/payment-plans/:id` - 更新付款计划
- `DELETE /api/payment-plans/:id` - 删除付款计划

### 4. 前端 Schema 定义

**需要创建**: `src/extrade/payment-plan-schemas.ts`

**主要内容**:
- 付款计划 Schema 定义
- 付款计划字段配置
- 付款计划明细表配置（如果需要）

### 5. 前端组件

**需要创建**:
- `src/components/payment-plan-form.tsx` - 付款计划表单组件
- `src/components/payment-plan-list.tsx` - 付款计划列表组件
- `src/components/payment-plan-table.tsx` - 付款计划表格组件（用于在采购合同中展示）

### 6. 前端 API 调用

**需要创建**: `src/lib/payment-plan-api.ts`

**主要方法**:
- `getPaymentPlans(contractCode: string)` - 获取合同的付款计划
- `createPaymentPlan(data: PaymentPlanData)` - 创建付款计划
- `updatePaymentPlan(id: string, data: Partial<PaymentPlanData>)` - 更新付款计划
- `deletePaymentPlan(id: string)` - 删除付款计划

## 五、在采购合同中集成付款计划

### 建议方案

在采购合同的 Schema 中添加付款计划明细表：

```typescript
// 在 purchase-contract-schemas.ts 的 detailTables 中添加
{
  id: "paymentPlans",
  label: "付款计划",
  editable: true,
  fields: [
    {
      id: "step",
      label: "步骤",
      type: "number",
      required: true,
    },
    {
      id: "paymentMethod",
      label: "支付方式",
      type: "select",
      // ...
    },
    {
      id: "paymentRatio",
      label: "付款比例(%)",
      type: "number",
      required: true,
    },
    {
      id: "dateType",
      label: "起始点",
      type: "select",
      // ...
    },
    {
      id: "days",
      label: "天数",
      type: "number",
      required: true,
    },
    {
      id: "expectedReceiptDate",
      label: "预计付款日",
      type: "date",
      readOnly: true,
    },
    {
      id: "receivableAmount",
      label: "应付金额",
      type: "number",
      readOnly: true,
    },
    // ... 其他字段
  ],
}
```

## 六、数据迁移建议

### 1. 现有数据迁移

如果数据库中已有 `scm_payment_plan` 表的数据，需要：
1. 确保 Prisma Schema 中的字段映射正确
2. 运行 `npx prisma db pull` 从现有数据库生成模型
3. 或者手动编写迁移脚本

### 2. 字段类型转换

注意 JSON 字段的处理：
- `payment_msg` (json) - 付款信息
- `receivable_amount` (json) - 应付金额（可能包含多币种）
- `received_amount` (json) - 实付金额
- `applied_amount` (json) - 已申请金额
- `annex` (json) - 水单附件

这些字段在 Prisma 中应使用 `Json` 类型。

## 七、下一步行动建议

### 优先级 1（核心功能）
1. ✅ 添加 Prisma Schema 定义
2. ✅ 创建后端服务层
3. ✅ 创建后端路由
4. ✅ 创建前端 Schema 定义
5. ✅ 创建前端 API 调用

### 优先级 2（集成功能）
1. 在采购合同中添加付款计划明细表
2. 创建付款计划管理组件
3. 实现付款计划的计算逻辑（预计付款日等）

### 优先级 3（扩展功能）
1. 付款申请功能
2. 付款计划模板功能
3. 付款计划审批流程

## 八、注意事项

1. **JSON 字段处理**: 多个字段使用 JSON 类型存储复杂数据，需要定义好 JSON 结构
2. **多币种支持**: `receivable_amount`、`received_amount` 等字段支持多币种，需要统一数据结构
3. **步骤序号**: `step` 字段用于区分同一合同的多个付款计划步骤
4. **日期计算**: `expected_receipt_date` 需要根据 `start_date`、`date_type`、`days` 计算
5. **金额计算**: `receivable_amount_value` 需要根据合同总额和 `payment_ratio` 计算
6. **软删除**: 所有表都使用 `deleted` 字段实现软删除
