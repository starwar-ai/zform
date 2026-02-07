# 供应商和供应商报价 API 文档

## 概述

基于 `scm.txt` 中的供应商信息，已实现完整的供应商管理和报价管理 API。

## 数据模型

### 1. Supplier（供应商）

包含以下主要字段（共 50 项）：

#### 基本信息
- `code` - 供应商编码（必填，唯一）
- `name` - 供应商名称（必填）
- `nameEn` - 供应商英文名称
- `shortName` - 供应商简称
- `registeredCapital` - 注册资本
- `legalRepresentative` - 法定代表人
- `mainBusiness` - 主营业务

#### 地址信息
- `companyCity` - 公司所在城市
- `factoryCity` - 工厂所在城市
- `expressCity` - 快递所在城市
- `companyAddress` - 公司地址
- `factoryAddress` - 工厂地址
- `expressAddress` - 快递地址

#### 证照信息
- `businessLicenseNo` - 营业执照号
- `companyPhone` - 企业电话
- `fax` - 传真

#### 分类与等级
- `supplierType` - 供应商类型（MANUFACTURER | TRADER | SERVICE_PROVIDER | LOGISTICS | OTHER）
- `supplierLevel` - 供应商等级（A | B | C | D）
- `stage` - 客户阶段（POTENTIAL | FORMAL | RETIRED）

#### 财务信息
- `currency` - 币种（默认 CNY）
- `taxRate` - 税率
- `invoiceType` - 发票类型（VAT_GENERAL | VAT_SPECIAL | ORDINARY | RECEIPT）

#### 状态管理
- `approvalStatus` - 审核状态（PENDING | APPROVED | REJECTED）
- `isFormal` - 转正标识
- `isEnabled` - 是否启用

### 2. SupplierBankAccount（供应商银行账户）

包含 14 项字段：
- `supplierId` - 供应商ID
- `bankName` - 银行名称
- `accountNumber` - 银行账号
- `branchAddress` - 开户行地址
- `branchContact` - 开户行联系人
- `bankCode` - 银行行号
- `isDefault` - 是否默认账号

### 3. SupplierQuotation（供应商报价）

核心报价字段：
- `supplierId` - 供应商ID
- `productCode` - 产品编码
- `productName` - 产品名称
- `quotationNo` - 报价单号（唯一）
- `quotationDate` - 报价日期
- `validFrom` - 有效期开始
- `validTo` - 有效期结束
- `unitPrice` - 单价
- `moq` - 最小起订量
- `leadTime` - 交货周期（天）
- `status` - 审核状态
- `isActive` - 是否有效

## API 端点

### 供应商管理 API

#### 1. 创建供应商
```http
POST /api/suppliers
Content-Type: application/json

{
  "code": "SUP001",
  "name": "测试供应商",
  "nameEn": "Test Supplier",
  "supplierType": "MANUFACTURER",
  "stage": "POTENTIAL",
  "currency": "CNY",
  "taxRate": 13.00
}
```

#### 2. 获取供应商列表
```http
GET /api/suppliers?page=1&pageSize=20&search=测试&supplierType=MANUFACTURER&stage=FORMAL
```

#### 3. 获取供应商详情
```http
GET /api/suppliers/{id}
```

#### 4. 更新供应商
```http
PUT /api/suppliers/{id}
Content-Type: application/json

{
  "name": "更新后的供应商名称",
  "supplierLevel": "A"
}
```

#### 5. 删除供应商（软删除）
```http
DELETE /api/suppliers/{id}
```

#### 6. 审核供应商
```http
POST /api/suppliers/{id}/approve
Content-Type: application/json

{
  "approved": true
}
```

#### 7. 转正供应商
```http
POST /api/suppliers/{id}/make-formal
```

### 银行账户管理 API

#### 8. 获取供应商的银行账户列表
```http
GET /api/suppliers/{id}/bank-accounts
```

#### 9. 添加银行账户
```http
POST /api/suppliers/{id}/bank-accounts
Content-Type: application/json

{
  "bankName": "中国工商银行",
  "accountNumber": "6222021234567890",
  "branchAddress": "北京市朝阳区支行",
  "branchContact": "张三",
  "bankCode": "102100099996",
  "isDefault": true
}
```

#### 10. 更新银行账户
```http
PUT /api/suppliers/{id}/bank-accounts/{bankAccountId}
Content-Type: application/json

{
  "isDefault": true
}
```

#### 11. 删除银行账户
```http
DELETE /api/suppliers/{id}/bank-accounts/{bankAccountId}
```

### 供应商报价管理 API

#### 12. 创建报价
```http
POST /api/quotations
Content-Type: application/json

{
  "supplier": { "connect": { "id": "supplier_id" } },
  "productCode": "PROD001",
  "productName": "测试产品",
  "quotationNo": "QUO-2024-001",
  "quotationDate": "2024-01-01",
  "validFrom": "2024-01-01",
  "validTo": "2024-12-31",
  "unitPrice": 100.50,
  "currency": "CNY",
  "unit": "PCS",
  "moq": 1000,
  "leadTime": 30,
  "taxRate": 13.00,
  "paymentTerms": "30天账期"
}
```

#### 13. 获取报价列表
```http
GET /api/quotations?page=1&pageSize=20&search=PROD001&supplierId=xxx&status=APPROVED
```

#### 14. 获取报价详情
```http
GET /api/quotations/{id}
```

#### 15. 根据报价单号查询
```http
GET /api/quotations/by-quotation-no/{quotationNo}
```

#### 16. 获取供应商的所有报价
```http
GET /api/quotations/by-supplier/{supplierId}
```

#### 17. 更新报价
```http
PUT /api/quotations/{id}
Content-Type: application/json

{
  "unitPrice": 95.00,
  "moq": 500
}
```

#### 18. 删除报价
```http
DELETE /api/quotations/{id}
```

#### 19. 审核报价
```http
POST /api/quotations/{id}/approve
Content-Type: application/json

{
  "approved": true
}
```

#### 20. 激活/停用报价
```http
POST /api/quotations/{id}/set-active
Content-Type: application/json

{
  "isActive": false
}
```

#### 21. 获取有效报价
```http
GET /api/quotations/valid?supplierId=xxx&productCode=PROD001&asOfDate=2024-06-01
```

#### 22. 比价（获取同一产品的所有有效报价，按价格排序）
```http
GET /api/quotations/compare/{productCode}?asOfDate=2024-06-01
```

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": { /* 数据对象 */ },
  "message": "操作成功"
}
```

### 分页响应
```json
{
  "success": true,
  "data": [/* 数据数组 */],
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

## 使用流程

### 1. 供应商管理流程
```
创建供应商 → 添加银行账户 → 审核供应商 → 转正供应商
```

### 2. 报价管理流程
```
创建报价 → 审核报价 → 激活报价 → 比价选择
```

## 数据库迁移

运行以下命令生成数据库：

```bash
# 生成 Prisma Client
npm run prisma:generate

# 创建数据库迁移
npm run prisma:migrate

# 查看数据库（可选）
npm run prisma:studio
```

## Swagger 文档

启动服务器后访问：
```
http://localhost:3001/api-docs
```

## 注意事项

1. **所有写操作都需要提供用户ID**：通过请求头 `x-user-id` 传递
2. **软删除**：删除操作不会真正删除数据，只是设置 `deletedAt` 字段
3. **版本控制**：供应商每次更新都会递增 `version` 字段
4. **默认银行账户**：设置新的默认账户时会自动取消其他账户的默认状态
5. **报价有效性**：报价查询会检查有效期和审核状态
6. **比价功能**：自动获取同一产品的所有有效报价并按价格升序排列

## 扩展功能建议

1. **供应商评级**：基于历史交易数据自动计算供应商等级
2. **价格趋势分析**：追踪产品报价历史，分析价格走势
3. **供应商绩效评估**：记录交货准时率、质量合格率等指标
4. **批量导入**：支持 Excel 批量导入供应商和报价数据
5. **价格预警**：当报价超过历史平均价格一定比例时发出预警
