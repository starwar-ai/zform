# 客户管理 API 文档

基于 `crm.txt` 中的 CRM 客户表结构设计的 RESTful API 接口。

## 数据表结构

### 1. crm_cust (客户主表)
- 51个字段，包含客户基本信息、业务信息、审核状态等
- 支持版本控制、软删除、审核流程

### 2. crm_cust_bankaccount (客户银行账户)
- 14个字段，存储客户的银行账户信息
- 支持多账户、默认账户设置

### 3. crm_cust_poc (客户联系人)
- Point of Contact，存储客户联系人信息
- 支持多联系人、默认联系人设置

---

## API 端点

### 客户管理

#### 1. 创建客户
```http
POST /api/customers
Content-Type: application/json
X-User-Id: user123

{
  "code": "CUST001",
  "name": "XX科技有限公司",
  "shortName": "XX科技",
  "countryCode": "CN",
  "website": "https://example.com",
  "email": "contact@example.com",
  "stage": "POTENTIAL",
  "phone": "010-12345678",
  "businessAddress": "北京市朝阳区XX路XX号",
  "isForeign": false,
  "isAgent": false,
  "isEnabled": true
}
```

**响应**：
```json
{
  "success": true,
  "message": "客户创建成功",
  "data": {
    "id": "cm...",
    "code": "CUST001",
    "name": "XX科技有限公司",
    ...
  },
  "timestamp": "2025-02-07T12:00:00.000Z"
}
```

#### 2. 获取客户列表（分页）
```http
GET /api/customers?page=1&pageSize=20&search=XX&stage=POTENTIAL&isEnabled=true
```

**查询参数**：
- `page`: 页码（默认 1）
- `pageSize`: 每页数量（默认 20）
- `search`: 搜索关键词（客户编号、名称、简称）
- `stage`: 客户阶段（POTENTIAL-潜在客户、FORMAL-正式客户、RETIRED-退休客户）
- `approvalStatus`: 审核状态（PENDING-待审核、APPROVED-已审核、REJECTED-已拒绝）
- `isEnabled`: 是否启用
- `isAgent`: 是否代理
- `isForeign`: 是否国外客户

**响应**：
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
  "timestamp": "2025-02-07T12:00:00.000Z"
}
```

#### 3. 获取客户详情
```http
GET /api/customers/{id}
```

**响应**：包含客户基本信息、所有银行账户和联系人

#### 4. 更新客户
```http
PUT /api/customers/{id}
Content-Type: application/json
X-User-Id: user123

{
  "name": "XX科技股份有限公司",
  "email": "newemail@example.com"
}
```

#### 5. 删除客户（软删除）
```http
DELETE /api/customers/{id}
X-User-Id: user123
```

#### 6. 审核客户
```http
POST /api/customers/{id}/approve
Content-Type: application/json
X-User-Id: user123

{
  "approved": true
}
```

#### 7. 转正客户
将潜在客户转为正式客户：
```http
POST /api/customers/{id}/make-formal
X-User-Id: user123
```

---

### 银行账户管理

#### 1. 获取客户的银行账户列表
```http
GET /api/customers/{id}/bank-accounts
```

#### 2. 添加银行账户
```http
POST /api/customers/{id}/bank-accounts
Content-Type: application/json
X-User-Id: user123

{
  "bankName": "中国工商银行",
  "bankAccount": "公司账户",
  "accountNumber": "6222021234567890123",
  "branchAddress": "北京朝阳支行",
  "branchContact": "张经理",
  "isDefault": true
}
```

**说明**：
- 如果 `isDefault: true`，会自动取消该客户其他账户的默认状态
- 首次添加的账户建议设为默认

#### 3. 更新银行账户
```http
PUT /api/customers/{customerId}/bank-accounts/{bankAccountId}
Content-Type: application/json
X-User-Id: user123

{
  "branchContact": "李经理",
  "isDefault": true
}
```

#### 4. 删除银行账户（软删除）
```http
DELETE /api/customers/{customerId}/bank-accounts/{bankAccountId}
X-User-Id: user123
```

---

### 联系人管理

#### 1. 获取客户的联系人列表
```http
GET /api/customers/{id}/contacts
```

#### 2. 添加联系人
```http
POST /api/customers/{id}/contacts
Content-Type: application/json
X-User-Id: user123

{
  "name": "张三",
  "position": "采购经理",
  "email": "zhangsan@example.com",
  "mobile": "13800138000",
  "phone": "010-12345678",
  "address": "北京市朝阳区XX路XX号",
  "wechat": "zhangsan123",
  "qq": "123456789",
  "businessCard": "http://example.com/card.jpg",
  "isDefault": true,
  "remark": "主要对接人"
}
```

**说明**：
- 如果 `isDefault: true`，会自动取消该客户其他联系人的默认状态
- 必填字段：`name`

#### 3. 更新联系人
```http
PUT /api/customers/{customerId}/contacts/{contactId}
Content-Type: application/json
X-User-Id: user123

{
  "position": "采购总监",
  "mobile": "13900139000"
}
```

#### 4. 删除联系人（软删除）
```http
DELETE /api/customers/{customerId}/contacts/{contactId}
X-User-Id: user123
```

---

## 数据模型说明

### 客户阶段 (stage)
- `POTENTIAL`: 潜在客户
- `FORMAL`: 正式客户
- `RETIRED`: 退休客户（已停止合作）

### 审核状态 (approvalStatus)
- `PENDING`: 待审核
- `APPROVED`: 审核通过
- `REJECTED`: 审核拒绝

### 收款方式
根据 crm.txt 中的字段，支持多种收款方式（需要关联收款方式字典表）

### 运输方式
- 海运
- 陆运
- 空运
- 供应商送货

---

## 业务流程示例

### 1. 新增客户完整流程
```bash
# 1. 创建客户（潜在客户）
POST /api/customers
{
  "code": "CUST001",
  "name": "XX科技有限公司",
  "stage": "POTENTIAL",
  ...
}

# 2. 添加联系人
POST /api/customers/{id}/contacts
{
  "name": "张三",
  "mobile": "13800138000",
  ...
}

# 3. 添加银行账户
POST /api/customers/{id}/bank-accounts
{
  "bankName": "工商银行",
  "accountNumber": "6222021234567890123",
  ...
}

# 4. 审核客户
POST /api/customers/{id}/approve
{
  "approved": true
}

# 5. 转正客户
POST /api/customers/{id}/make-formal
```

### 2. 查询场景
```bash
# 查询所有潜在客户
GET /api/customers?stage=POTENTIAL

# 查询待审核的客户
GET /api/customers?approvalStatus=PENDING

# 查询国外客户
GET /api/customers?isForeign=true

# 搜索客户
GET /api/customers?search=科技
```

---

## 技术说明

### 版本控制
- 每次更新客户信息时，`version` 字段自动递增
- 可用于乐观锁控制并发更新

### 软删除
- 所有删除操作都是软删除，只设置 `deletedAt` 字段
- 查询时自动过滤已删除数据
- 可根据需要实现数据恢复功能

### 用户追踪
- 通过 HTTP Header `X-User-Id` 传递操作用户
- 自动记录 `createdBy`、`updatedBy` 字段

### 默认值处理
- 银行账户和联系人的 `isDefault` 字段互斥
- 设置新的默认项时，自动取消其他默认项

---

## 错误处理

所有接口遵循统一的错误响应格式：

```json
{
  "success": false,
  "message": "客户不存在",
  "code": 500,
  "timestamp": "2025-02-07T12:00:00.000Z"
}
```

常见错误码：
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 注意事项

1. **必须先定义 Prisma Schema**：以上代码假设已在 `prisma/schema.prisma` 中定义了对应的模型
2. **枚举类型**：需要在 Prisma Schema 中定义相应的枚举（如 CustomerStage、ApprovalStatus 等）
3. **字段映射**：crm.txt 中的中文字段名已映射为英文字段名（如"企业名称" → name）
4. **关联关系**：Customer、CustomerBankAccount、CustomerContact 之间的关联需要在 Prisma Schema 中正确配置
5. **认证授权**：当前使用 Header 传递用户ID，生产环境应集成完整的认证授权机制

---

## 访问 Swagger 文档

启动服务后，访问：
```
http://localhost:3000/api-docs
```

可查看完整的 API 交互式文档。
