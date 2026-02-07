# 销售合同 API 文档

## 概述

销售合同管理模块提供了完整的销售订单管理功能，包括主表和明细表的 CRUD 操作、审核流程、回签管理、打印记录等功能。

## 数据模型

### 销售合同主表 (SalesContract)

根据 sms.txt 中的 96 个字段，销售合同主表包含以下主要信息：

#### 基本信息
- `code`: 合同编号（唯一）
- `internalCode`: 内部生成编号
- `customerPoNo`: 客户PO号
- `orderLinkCode`: 订单链路编号
- `orderPath`: 订单路径

#### 客户信息
- `customerId`: 客户ID（关联客户表）
- `customerCode`: 客户编号
- `receivableCustomerCode`: 应收客户编号
- `deliveryCustomerCode`: 收货客户编号
- `deliveryAddress`: 送货地址

#### 人员信息
- `salesPerson`: 销售人员
- `merchandiser`: 跟单员
- `buyer`: 采购员

#### 金额与汇率
- `currency`: 交易币别（默认 USD）
- `usdRate`: 美元汇率
- `creationRate`: 创建时汇率
- `totalAmount`: 销售总金额
- `totalAmountUsd`: 销售总金额USD
- `originalCurrencyAmount`: 原币种金额

#### 收款信息
- `paymentAccountId`: 收款账号ID
- `paymentMethodName`: 收款方式名称
- `receivedAmount`: 收款合计
- `receivableRemittance`: 应收汇款

#### 物流信息
- `priceTerms`: 价格条款（FOB/CIF/CNF等）
- `transportMethod`: 运输方式
- `departurePortName`: 出运口岸名称
- `destinationPortName`: 目的口岸名称
- `customerDeliveryDate`: 客户交期

#### 柜型信息
- `container20ft`: 20尺柜数量
- `container40ft`: 40尺柜数量
- `container40hq`: 40尺高柜数量
- `bulkCargo`: 散货

#### 费用信息
- `containerFee`: 拖柜费
- `estimatedFreight`: 预估总运费
- `commission`: 佣金
- `platformFee`: 平台费
- `insuranceFee`: 保险费
- `sinosureFee`: 中信保费用
- `lumpSumFee`: 包干费
- `additionalAmount`: 加项金额
- `deductionAmount`: 减项金额
- `inspectionFee`: 验货费用

#### 统计信息
- `totalBoxes`: 箱数合计
- `totalGrossWeight`: 毛重合计
- `totalNetWeight`: 净重合计
- `totalVolume`: 体积合计
- `totalValue`: 货值合计
- `totalQuantity`: 数量合计

#### 成本与利润
- `inventoryCostTotal`: 库存成本合计
- `purchaseTotal`: 采购总金额
- `accessoryPurchaseTotal`: 配件采购合计
- `estimatedPackagingTotal`: 预计包材合计
- `taxRefundTotal`: 退税合计
- `orderGrossProfit`: 订单毛利
- `grossProfitMargin`: 毛利率

#### 状态字段
- `status`: 合同状态（DRAFT/PENDING/APPROVED/IN_PROGRESS/COMPLETED/CANCELLED）
- `contractType`: 合同类型（STANDARD/SAMPLE/TRIAL/REPEAT）
- `approvalStatus`: 审核状态（PENDING/APPROVED/REJECTED）
- `confirmStatus`: 确认状态（NOT_CONFIRMED/CONFIRMED/REJECTED）
- `changeStatus`: 变更状态

#### 打印与回签
- `printStatus`: 打印状态（NOT_PRINTED/PRINTED）
- `printCount`: 打印次数
- `signBackStatus`: 回签状态（NOT_SIGNED/SIGNED/PARTIAL）
- `signBackDate`: 回签日期
- `signBackPerson`: 回签人
- `signBackDescription`: 回签描述
- `signBackAttachments`: 回签附件（JSON）

### 销售合同明细表 (SalesContractItem)

- `lineNumber`: 行号
- `productId`: 产品ID
- `productCode`: 产品编码
- `productName`: 产品名称
- `productSpec`: 产品规格
- `quantity`: 数量
- `unit`: 单位
- `unitPrice`: 单价
- `currency`: 币种
- `amount`: 金额
- `boxes`: 箱数
- `grossWeight`: 毛重
- `netWeight`: 净重
- `volume`: 体积
- `purchasePrice`: 采购价
- `costPrice`: 成本价
- `taxRefund`: 退税
- `deliveryDate`: 交期
- `remark`: 备注

## API 端点

### 基础 CRUD

#### 1. 创建销售合同

```http
POST /api/sales-contracts
Content-Type: application/json
X-User-Id: user123

{
  "code": "SC202601001",
  "customerId": "customer-id-123",
  "customerCode": "C001",
  "customerName": "ABC公司",
  "customerPoNo": "PO-2026-001",
  "currency": "USD",
  "totalAmount": 50000.00,
  "salesPerson": "张三",
  "merchandiser": "李四",
  "items": [
    {
      "productName": "产品A",
      "productCode": "P001",
      "quantity": 1000,
      "unit": "PCS",
      "unitPrice": 50.00,
      "amount": 50000.00,
      "deliveryDate": "2026-03-01"
    }
  ]
}
```

#### 2. 获取销售合同列表

```http
GET /api/sales-contracts?page=1&pageSize=20&search=SC2026&status=APPROVED
```

查询参数：
- `page`: 页码（默认 1）
- `pageSize`: 每页数量（默认 20）
- `search`: 搜索关键词（编号、客户编号、客户名称、PO号）
- `customerId`: 客户ID
- `status`: 合同状态
- `approvalStatus`: 审核状态
- `contractType`: 合同类型
- `startDate`: 开始日期
- `endDate`: 结束日期

#### 3. 获取销售合同详情

```http
GET /api/sales-contracts/{id}
```

#### 4. 根据编号获取销售合同

```http
GET /api/sales-contracts/code/{code}
```

#### 5. 更新销售合同

```http
PUT /api/sales-contracts/{id}
Content-Type: application/json
X-User-Id: user123

{
  "totalAmount": 55000.00,
  "remark": "客户要求增加数量",
  "items": [
    {
      "productName": "产品A",
      "quantity": 1100,
      "unitPrice": 50.00,
      "amount": 55000.00
    }
  ]
}
```

#### 6. 删除销售合同（软删除）

```http
DELETE /api/sales-contracts/{id}
X-User-Id: user123
```

### 业务流程

#### 7. 审核销售合同

```http
POST /api/sales-contracts/{id}/approve
Content-Type: application/json
X-User-Id: user123

{
  "approved": true
}
```

#### 8. 确认销售合同

```http
POST /api/sales-contracts/{id}/confirm
X-User-Id: user123
```

#### 9. 更新合同状态

```http
PUT /api/sales-contracts/{id}/status
Content-Type: application/json
X-User-Id: user123

{
  "status": "IN_PROGRESS"
}
```

#### 10. 回签

```http
POST /api/sales-contracts/{id}/sign-back
Content-Type: application/json
X-User-Id: user123

{
  "signBackDate": "2026-02-08T10:00:00Z",
  "signBackDescription": "客户已确认并回签",
  "signBackAttachments": [
    "https://example.com/签字文件.pdf"
  ]
}
```

#### 11. 打印

```http
POST /api/sales-contracts/{id}/print
X-User-Id: user123
```

每次调用会自动增加打印次数。

#### 12. 转采购计划

```http
POST /api/sales-contracts/{id}/to-purchase-plan
X-User-Id: user123
```

标记合同已转为采购计划。

### 明细管理

#### 13. 获取明细列表

```http
GET /api/sales-contracts/{id}/items
```

#### 14. 添加明细行

```http
POST /api/sales-contracts/{id}/items
Content-Type: application/json
X-User-Id: user123

{
  "productName": "产品B",
  "productCode": "P002",
  "quantity": 500,
  "unit": "PCS",
  "unitPrice": 30.00,
  "currency": "USD",
  "amount": 15000.00,
  "boxes": 10,
  "grossWeight": 500.5,
  "netWeight": 450.0,
  "volume": 2.5,
  "deliveryDate": "2026-03-15"
}
```

系统会自动分配行号，并重新计算合同汇总信息。

#### 15. 更新明细行

```http
PUT /api/sales-contracts/{id}/items/{itemId}
Content-Type: application/json
X-User-Id: user123

{
  "quantity": 600,
  "amount": 18000.00
}
```

#### 16. 删除明细行（软删除）

```http
DELETE /api/sales-contracts/{id}/items/{itemId}
X-User-Id: user123
```

删除后会自动重新计算合同汇总信息。

### 统计分析

#### 17. 获取统计数据

```http
GET /api/sales-contracts/statistics?startDate=2026-01-01&endDate=2026-12-31&customerId=customer-id-123
```

返回数据：
```json
{
  "success": true,
  "data": {
    "totalCount": 120,
    "approvedCount": 100,
    "totalAmount": 5000000.00,
    "totalProfit": 500000.00
  }
}
```

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 分页响应

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误信息"
}
```

## 业务逻辑说明

### 1. 自动计算汇总信息

当添加、更新或删除明细行时，系统会自动重新计算以下汇总信息：
- `totalAmount`: 所有明细金额合计
- `totalQuantity`: 所有明细数量合计
- `totalBoxes`: 所有明细箱数合计
- `totalGrossWeight`: 毛重合计
- `totalNetWeight`: 净重合计
- `totalVolume`: 体积合计
- `taxRefundTotal`: 退税合计

### 2. 行号自动管理

- 创建合同时，明细行按数组顺序自动分配行号（从 1 开始）
- 添加新明细行时，自动分配下一个行号
- 更新合同时，可以重新排序明细行

### 3. 软删除机制

所有删除操作都是软删除，通过设置 `deletedAt` 时间戳实现。查询时自动过滤已删除的记录。

### 4. 版本控制

每次更新合同主表时，`version` 字段自动递增，用于变更追踪和并发控制。

### 5. 审核流程

1. 创建时状态为 `DRAFT`（草稿）
2. 提交审核后变为 `PENDING`（待审核）
3. 审核通过后变为 `APPROVED`（已审核）
4. 开始执行后变为 `IN_PROGRESS`（执行中）
5. 完成后变为 `COMPLETED`（已完成）

## 使用示例

### 完整的创建流程

```javascript
// 1. 创建销售合同
const response = await fetch('http://localhost:3001/api/sales-contracts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'user123'
  },
  body: JSON.stringify({
    code: 'SC202601001',
    customerId: 'customer-id-123',
    customerCode: 'C001',
    customerName: 'ABC公司',
    customerPoNo: 'PO-2026-001',
    currency: 'USD',
    salesPerson: '张三',
    merchandiser: '李四',
    items: [
      {
        productName: '产品A',
        productCode: 'P001',
        quantity: 1000,
        unit: 'PCS',
        unitPrice: 50.00,
        amount: 50000.00
      }
    ]
  })
});

const { data: contract } = await response.json();
const contractId = contract.id;

// 2. 提交审核
await fetch(`http://localhost:3001/api/sales-contracts/${contractId}/approve`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'manager123'
  },
  body: JSON.stringify({ approved: true })
});

// 3. 客户确认
await fetch(`http://localhost:3001/api/sales-contracts/${contractId}/confirm`, {
  method: 'POST',
  headers: { 'X-User-Id': 'user123' }
});

// 4. 回签
await fetch(`http://localhost:3001/api/sales-contracts/${contractId}/sign-back`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'user123'
  },
  body: JSON.stringify({
    signBackDescription: '客户已确认并回签',
    signBackAttachments: ['https://example.com/签字文件.pdf']
  })
});

// 5. 打印合同
await fetch(`http://localhost:3001/api/sales-contracts/${contractId}/print`, {
  method: 'POST',
  headers: { 'X-User-Id': 'user123' }
});

// 6. 转采购计划
await fetch(`http://localhost:3001/api/sales-contracts/${contractId}/to-purchase-plan`, {
  method: 'POST',
  headers: { 'X-User-Id': 'user123' }
});
```

## 注意事项

1. **用户认证**：所有需要修改数据的接口都需要提供 `X-User-Id` header
2. **数据校验**：创建和更新时会自动校验必填字段
3. **并发控制**：通过 `version` 字段实现乐观锁
4. **事务处理**：创建和更新操作使用数据库事务确保数据一致性
5. **软删除**：已删除的记录不会在查询中返回，但数据仍保留在数据库中
