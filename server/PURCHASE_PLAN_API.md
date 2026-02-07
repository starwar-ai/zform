# 采购计划 API 文档

## 概述

采购计划模块提供了完整的采购计划管理功能，包括：
- 采购计划的增删改查
- 从销售合同自动生成采购计划
- 采购计划审核流程
- 采购计划明细管理
- 采购计划统计

## 数据模型

### 采购计划主表 (PurchasePlan)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| code | String | 计划编号（唯一） |
| planDate | DateTime | 计划日期 |
| expectedDeliveryDate | DateTime | 预计交期 |
| planStatus | Enum | 计划状态（DRAFT/PENDING/APPROVED/IN_PROGRESS/COMPLETED/CLOSED/CANCELLED） |
| approvalStatus | Enum | 审核状态（PENDING/APPROVED/REJECTED） |
| sourceType | Enum | 来源单类型（SALES_CONTRACT/PURCHASE_PLAN/OTHER） |
| salesContractId | String | 销售合同主键 |
| salesContractCode | String | 销售合同编号 |
| customerId | String | 客户ID |
| customerCode | String | 客户编号 |
| buyer | String | 采购员 |
| salesPerson | String | 业务员 |
| merchandiser | String | 跟单员 |
| isAccessoryPurchase | Boolean | 是否辅料采购 |
| remark | String | 备注 |

### 采购计划明细表 (PurchasePlanItem)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| purchasePlanId | String | 采购计划ID |
| lineNumber | Int | 行号 |
| productId | String | 产品ID |
| productCode | String | SKU编号 |
| productName | String | 产品名称 |
| customerProductNo | String | 客户货号 |
| specification | String | 规格 |
| salesQuantity | Decimal | 销售数量 |
| contractQuantity | Decimal | 合同数量 |
| purchaseQuantity | Decimal | 采购数量 |
| pendingQuantity | Decimal | 待采购数量 |
| convertedQuantity | Decimal | 已转合同数量 |
| supplierId | String | 供应商ID |
| supplierCode | String | 供应商编号 |
| supplierName | String | 供应商名称 |
| unitPrice | Decimal | 采购单价 |
| totalAmount | Decimal | 总价 |
| currency | String | 币种 |
| deliveryDate | DateTime | 交货日期 |

## API 接口

### 1. 获取采购计划列表

```http
GET /api/purchase-plans
```

**查询参数:**
- `page` (number, optional): 页码，默认 1
- `pageSize` (number, optional): 每页数量，默认 20
- `search` (string, optional): 搜索关键词（计划编号、销售合同编号、客户编号）
- `planStatus` (string, optional): 计划状态
- `approvalStatus` (string, optional): 审核状态
- `customerId` (string, optional): 客户ID
- `buyer` (string, optional): 采购员
- `startDate` (string, optional): 开始日期 (YYYY-MM-DD)
- `endDate` (string, optional): 结束日期 (YYYY-MM-DD)

**响应示例:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "clxxx",
        "code": "PP202602070001",
        "planDate": "2026-02-07T00:00:00.000Z",
        "expectedDeliveryDate": "2026-03-07T00:00:00.000Z",
        "planStatus": "DRAFT",
        "approvalStatus": "PENDING",
        "salesContractCode": "SC202602070001",
        "customerCode": "C001",
        "buyer": "张三",
        "items": [...]
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### 2. 获取采购计划详情

```http
GET /api/purchase-plans/:id
```

**路径参数:**
- `id` (string, required): 采购计划ID

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "code": "PP202602070001",
    "planDate": "2026-02-07T00:00:00.000Z",
    "expectedDeliveryDate": "2026-03-07T00:00:00.000Z",
    "planStatus": "DRAFT",
    "items": [
      {
        "id": "clyyy",
        "lineNumber": 1,
        "productCode": "P001",
        "productName": "产品A",
        "purchaseQuantity": 100,
        "unitPrice": 50.00,
        "totalAmount": 5000.00
      }
    ]
  }
}
```

### 3. 创建采购计划

```http
POST /api/purchase-plans
```

**请求头:**
- `x-user-id` (string): 用户ID

**请求体示例:**
```json
{
  "code": "PP202602070001",
  "planDate": "2026-02-07",
  "expectedDeliveryDate": "2026-03-07",
  "customerId": "clxxx",
  "customerCode": "C001",
  "buyer": "张三",
  "items": {
    "create": [
      {
        "lineNumber": 1,
        "productCode": "P001",
        "productName": "产品A",
        "purchaseQuantity": 100,
        "unitPrice": 50.00
      }
    ]
  }
}
```

### 4. 从销售合同生成采购计划

```http
POST /api/purchase-plans/from-sales-contract/:salesContractId
```

**路径参数:**
- `salesContractId` (string, required): 销售合同ID

**请求头:**
- `x-user-id` (string): 用户ID

**功能说明:**
- 自动从销售合同复制客户、产品、数量等信息
- 自动生成采购计划编号
- 建立采购计划与销售合同的追溯关系
- 更新销售合同的"转采购计划"标记

**响应示例:**
```json
{
  "success": true,
  "message": "从销售合同生成采购计划成功",
  "data": {
    "id": "clxxx",
    "code": "PP202602070001",
    "salesContractId": "clyyy",
    "salesContractCode": "SC202602070001",
    "items": [...]
  }
}
```

### 5. 更新采购计划

```http
PUT /api/purchase-plans/:id
```

**路径参数:**
- `id` (string, required): 采购计划ID

**请求头:**
- `x-user-id` (string): 用户ID

**请求体示例:**
```json
{
  "buyer": "李四",
  "expectedDeliveryDate": "2026-03-15",
  "remark": "更新交期"
}
```

### 6. 审核通过采购计划

```http
POST /api/purchase-plans/:id/approve
```

**路径参数:**
- `id` (string, required): 采购计划ID

**请求头:**
- `x-user-id` (string): 用户ID

**功能说明:**
- 将审核状态更新为 APPROVED
- 将计划状态更新为 APPROVED

### 7. 拒绝采购计划

```http
POST /api/purchase-plans/:id/reject
```

**路径参数:**
- `id` (string, required): 采购计划ID

**请求头:**
- `x-user-id` (string): 用户ID

**请求体:**
```json
{
  "reason": "采购价格过高，需要重新询价"
}
```

### 8. 取消采购计划

```http
POST /api/purchase-plans/:id/cancel
```

**路径参数:**
- `id` (string, required): 采购计划ID

**请求头:**
- `x-user-id` (string): 用户ID

**注意:** 只能取消未完成或未结案的采购计划

### 9. 删除采购计划

```http
DELETE /api/purchase-plans/:id
```

**路径参数:**
- `id` (string, required): 采购计划ID

**请求头:**
- `x-user-id` (string): 用户ID

**注意:** 只能删除草稿或已取消的采购计划（软删除）

### 10. 添加采购计划明细

```http
POST /api/purchase-plans/:planId/items
```

**路径参数:**
- `planId` (string, required): 采购计划ID

**请求头:**
- `x-user-id` (string): 用户ID

**请求体示例:**
```json
{
  "productCode": "P002",
  "productName": "产品B",
  "purchaseQuantity": 200,
  "unitPrice": 30.00,
  "supplierId": "S001",
  "supplierCode": "SUP001",
  "supplierName": "供应商A"
}
```

### 11. 更新采购计划明细

```http
PUT /api/purchase-plans/:planId/items/:itemId
```

**路径参数:**
- `planId` (string, required): 采购计划ID
- `itemId` (string, required): 明细ID

**请求头:**
- `x-user-id` (string): 用户ID

**请求体示例:**
```json
{
  "purchaseQuantity": 250,
  "unitPrice": 28.00
}
```

**功能说明:**
- 自动重新计算 totalAmount 和 totalAmountWithTax

### 12. 删除采购计划明细

```http
DELETE /api/purchase-plans/:planId/items/:itemId
```

**路径参数:**
- `planId` (string, required): 采购计划ID
- `itemId` (string, required): 明细ID

### 13. 获取采购计划统计

```http
GET /api/purchase-plans/statistics
```

**查询参数:**
- `startDate` (string, optional): 开始日期
- `endDate` (string, optional): 结束日期
- `customerId` (string, optional): 客户ID
- `buyer` (string, optional): 采购员

**响应示例:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "draft": 20,
      "pending": 30,
      "approved": 40,
      "inProgress": 35,
      "completed": 20,
      "closed": 3,
      "cancelled": 2
    }
  }
}
```

## 业务流程

### 标准流程

1. **创建采购计划**
   - 方式1: 从销售合同自动生成
   - 方式2: 手动创建

2. **编辑采购计划**
   - 补充供应商信息
   - 填写采购价格
   - 调整采购数量

3. **提交审核**
   - 采购员提交
   - 采购主管审核

4. **审核通过**
   - 状态变更为 APPROVED
   - 可以下推生成采购合同

5. **执行采购**
   - 状态变更为 IN_PROGRESS
   - 跟踪采购进度

6. **完成采购**
   - 状态变更为 COMPLETED
   - 记录完成时间

7. **结案**
   - 状态变更为 CLOSED
   - 记录结案时间

## 编号规则

采购计划编号格式: `PP{YYYYMMDD}{序号}`

示例:
- `PP202602070001` - 2026年2月7日第1个采购计划
- `PP202602070002` - 2026年2月7日第2个采购计划

## 状态流转

```
DRAFT (草稿)
  ↓ 提交审核
PENDING (待审核)
  ↓ 审核通过          ↓ 拒绝
APPROVED (已审核)    DRAFT (草稿)
  ↓ 开始执行
IN_PROGRESS (执行中)
  ↓ 完成
COMPLETED (已完成)
  ↓ 结案
CLOSED (已结案)

任何状态 → CANCELLED (已取消)
```

## 注意事项

1. 从销售合同生成采购计划时，会自动建立追溯关系
2. 采购计划明细的数量和价格更新会自动计算总额
3. 删除和取消操作有状态限制，请注意状态检查
4. 所有写操作需要传递 `x-user-id` 请求头
5. 日期格式统一使用 ISO 8601 格式
