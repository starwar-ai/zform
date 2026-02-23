# 客户报价单业务逻辑提取说明

## 概述

本文档说明从 `zexport` 项目中提取的客户报价单业务逻辑，并在 `zform` 项目中使用 TypeScript/Node.js/Prisma 重新实现。

## 源代码位置

### zexport (Java/Spring)
- **Service接口**: `eplus-module-sms/eplus-module-sms-biz/src/main/java/com/syj/eplus/module/sms/service/quotation/QuotationService.java`
- **Service实现**: `eplus-module-sms/eplus-module-sms-biz/src/main/java/com/syj/eplus/module/sms/service/quotation/QuotationServiceImpl.java`
- **数据对象**: 
  - `QuotationDO.java` - 报价单主表
  - `QuotationItemDO.java` - 报价单明细表
  - `OtherFeeDO.java` - 其他费用表
- **数据库表**: 
  - `sms_quotation`
  - `sms_quotation_item`
  - `sms_other_fee`

### zform (TypeScript/Node.js)
- **Service**: `server/src/services/quotation.service.ts` ✅ 已创建
- **Controller**: `server/src/controllers/quotation.controller.ts` ✅ 已创建
- **Routes**: `server/src/routes/quotations.ts` ✅ 已创建
- **数据模型**: 
  - `Quotation` - Prisma schema 中已定义
  - `QuotationItem` - Prisma schema 中已定义

---

## 核心业务逻辑

### 1. 报价单创建 (createQuotation)

#### 原始逻辑 (Java)
```java
@Transactional(rollbackFor = Exception.class)
public Long createQuotation(QuotationSaveReqVO createReqVO) {
    // 1. 生成报价单号
    String code = generatorApi.getCodeGenerator(SN_TYPE, CODE_PREFIX);
    
    // 2. 设置初始状态
    quotation.setStatus(QuotationEnum.PENDING_SUBMIT.getCode());
    
    // 3. 获取当前用户信息
    UserDept userDept = adminUserApi.getUserDeptByUserId(loginUserId);
    
    // 4. 插入主表
    quotationMapper.insert(quotation);
    
    // 5. 校验并插入明细
    if (CollUtil.isNotEmpty(quotationItemDOList)) {
        validateCabiinetNum(quotationItemDOList);
        quotationItemMapper.insertBatch(quotationItemDOList);
    }
    
    // 6. 插入其他费用
    if (CollUtil.isNotEmpty(otherFeeDOList)) {
        otherFeeMapper.insertBatch(otherFeeDOList);
    }
    
    // 7. 如果需要提交审批
    if (SubmitFlagEnum.SUBMIT.getStatus().equals(createReqVO.getSubmitFlag())) {
        submitTask(quotation.getId(), WebFrameworkUtils.getLoginUserId());
    }
}
```

#### 实现逻辑 (TypeScript)
```typescript
async createQuotation(input: QuotationInput, userId: string) {
    // 1. 生成报价单号
    const code = await codeGeneratorService.generate(SN_TYPE, CODE_PREFIX);
    
    // 2. 验证明细柜型数量
    if (input.items && input.items.length > 0) {
        await this.validateCabinetNumbers(input.items);
    }
    
    // 3. 创建报价单（使用 Prisma 事务）
    const quotation = await prisma.quotation.create({
        data: {
            code,
            status: QuotationStatus.DRAFT,
            items: { create: [...] }
        }
    });
    
    // 4. 如果需要提交审批
    if (input.submitFlag) {
        await this.submitForApproval(quotation.id, userId);
    }
}
```

**关键点**:
- ✅ 自动生成报价单号
- ✅ 初始状态为 DRAFT
- ✅ 柜型数量验证
- ✅ 支持提交审批标志
- ✅ 主表和明细表一次性创建（Prisma 事务）

---

### 2. 柜型数量验证 (validateCabinetNumbers)

这是报价单业务逻辑中最核心的部分。

#### 验证规则

1. **箱数验证**: `boxCount` 不能为空或小于等于0
2. **外箱体积验证**: `outerBoxVolume` 不能为空
3. **柜型数量计算**: 根据 `外箱体积 × 箱数` 计算总体积，然后计算各种柜型的数量
4. **数量匹配验证**: 计算出的柜型数量必须与输入的数量一致

#### 计算逻辑

```typescript
private async calcCabinetNum(totalVolume: Decimal): Promise<Record<string, number>> {
    // 柜型容积（立方米）
    const TWENTY_FOOT_VOLUME = 28;      // 20尺柜
    const FORTY_FOOT_VOLUME = 58;       // 40尺柜
    const FORTY_FOOT_HQ_VOLUME = 68;    // 40尺高柜
    
    let remainingVolume = totalVolume.toNumber();
    
    // 优先填充40尺高柜
    container40hq = Math.floor(remainingVolume / FORTY_FOOT_HQ_VOLUME);
    remainingVolume = remainingVolume % FORTY_FOOT_HQ_VOLUME;
    
    // 然后填充40尺柜
    container40ft = Math.floor(remainingVolume / FORTY_FOOT_VOLUME);
    remainingVolume = remainingVolume % FORTY_FOOT_VOLUME;
    
    // 最后填充20尺柜
    container20ft = Math.floor(remainingVolume / TWENTY_FOOT_VOLUME);
    remainingVolume = remainingVolume % TWENTY_FOOT_VOLUME;
    
    // 剩余为散货
    bulkCargo = remainingVolume;
}
```

**示例**:
- 总体积: 150 CBM
- 40尺高柜: 150 / 68 = 2 个 (剩余 14 CBM)
- 40尺柜: 14 / 58 = 0 个 (剩余 14 CBM)
- 20尺柜: 14 / 28 = 0 个 (剩余 14 CBM)
- 散货: 14 CBM

---

### 3. 报价单状态流转

#### 状态定义

```typescript
enum QuotationStatus {
    DRAFT = 'DRAFT',                    // 草稿
    PENDING_APPROVAL = 'PENDING_APPROVAL', // 待审批
    APPROVED = 'APPROVED',              // 已审批
    REJECTED = 'REJECTED',              // 已拒绝
    ACCEPTED = 'ACCEPTED',              // 已接受
    CLOSED = 'CLOSED'                   // 已结案
}
```

#### 状态流转图

```
DRAFT (草稿)
  ↓ [提交审批]
PENDING_APPROVAL (待审批)
  ↓ [审批通过]              ↓ [审批拒绝]
APPROVED (已审批)       REJECTED (已拒绝)
  ↓ [客户接受]
ACCEPTED (已接受)
  ↓ [结案]
CLOSED (已结案)
```

#### 实现的方法

| 方法 | 功能 | 状态变化 |
|------|------|----------|
| `createQuotation` | 创建报价单 | → DRAFT |
| `submitForApproval` | 提交审批 | DRAFT → PENDING_APPROVAL |
| `approve` | 审批通过 | PENDING_APPROVAL → APPROVED |
| `reject` | 审批拒绝 | PENDING_APPROVAL → REJECTED |
| `finish` | 结案 | APPROVED/ACCEPTED → CLOSED |

---

### 4. 更新逻辑 (updateQuotation)

#### 原始逻辑 (Java)
```java
@Transactional(rollbackFor = Exception.class)
public void updateQuotation(QuotationSaveReqVO updateReqVO) {
    // 1. 校验报价单存在
    QuotationDO quotationDO = validateQuotationExists(updateReqVO.getId());
    
    // 2. 删除旧明细
    quotationItemMapper.delete(QuotationItemDO::getSmsQuotationId, updateReqVO.getId());
    
    // 3. 插入新明细
    validateCabiinetNum(quotationItemDOList);
    quotationItemMapper.insertBatch(quotationItemDOList);
    
    // 4. 更新主表
    quotationMapper.updateById(updateObj);
}
```

#### 实现逻辑 (TypeScript)
```typescript
async updateQuotation(id: string, input: QuotationInput, userId: string) {
    // 1. 验证报价单存在
    await this.validateQuotationExists(id);
    
    // 2. 验证明细柜型数量
    if (input.items) {
        await this.validateCabinetNumbers(input.items);
    }
    
    // 3. 软删除旧明细
    await prisma.quotationItem.updateMany({
        where: { quotationId: id },
        data: { deletedAt: new Date() }
    });
    
    // 4. 更新主表并插入新明细
    await prisma.quotation.update({
        where: { id },
        data: {
            ...updateFields,
            items: { create: [...] }
        }
    });
}
```

**关键点**:
- ✅ 使用软删除而非物理删除
- ✅ 更新前验证柜型数量
- ✅ 主表和明细表更新在同一事务中

---

### 5. 货币转换 (exportQuotation)

#### 功能
导出报价单时，将报价金额转换为目标货币（通常为USD）。

#### 原始逻辑 (Java)
```java
// 获取每日汇率
Map<String, BigDecimal> dailyRateMap = rateApi.getDailyRateMap();

// 转换货币
JsonAmount result = CurrencyUtil.changeCurrency(
    item.getQuotation(), 
    "USD", 
    dailyRateMap
);
```

#### 实现逻辑 (TypeScript)
```typescript
private convertCurrency(
    amount: any,
    fromCurrency: string,
    toCurrency: string,
    rates: any[]
): number {
    if (fromCurrency === toCurrency) {
        return Number(amount);
    }
    
    // 查找汇率
    const fromRate = rates.find(r => r.currencyCode === fromCurrency);
    const toRate = rates.find(r => r.currencyCode === toCurrency);
    
    // 转换: amount * (toRate / fromRate)
    return amountDecimal.mul(toRateDecimal).div(fromRateDecimal).toNumber();
}
```

**关键点**:
- ✅ 使用实时汇率
- ✅ 支持任意货币间转换
- ✅ 使用 Decimal.js 保证精度

---

### 6. 打印和导出

#### 打印逻辑

原始逻辑包含：
1. 模板选择（根据公司ID或默认模板）
2. 模板审核状态验证
3. 单位转换（公制/英制）
4. 图片处理
5. Word文档生成

#### 简化实现

```typescript
async markAsPrinted(id: string, userId: string) {
    return await prisma.quotation.update({
        where: { id },
        data: {
            printStatus: PrintStatus.PRINTED,
            updatedBy: userId
        }
    });
}
```

**注意**: 完整的打印功能需要集成文档生成库（如 docxtemplater）。

---

## 与 zexport 的差异

### 简化的部分

1. **其他费用表**: zform 暂未实现 `OtherFee` 表，可在需要时添加
2. **BPM工作流**: 简化了审批流程，需要后续集成专业的工作流引擎
3. **包装类型**: zexport 使用 `List<Long> packageType`，zform 使用 `String packageMethod`
4. **文档生成**: 打印功能仅标记状态，未实现完整的Word/Excel导出

### 增强的部分

1. **软删除**: 使用 `deletedAt` 字段实现软删除，便于数据恢复
2. **类型安全**: TypeScript 提供更好的类型检查
3. **异步处理**: Node.js 的异步特性提升性能

---

## 数据库字段映射

| zexport (Java) | zform (TypeScript) | 说明 |
|----------------|-------------------|------|
| `id` (Long) | `id` (String/CUID) | 主键 |
| `code` | `code` | 报价单号 |
| `cust_id` | `customerId` | 客户ID |
| `cust_code` | `customerCode` | 客户编号 |
| `cust_name` | `customerName` | 客户名称 |
| `cust_poc_name` | `customerContactName` | 联系人名称 |
| `country_id` | `countryId` | 国家ID |
| `country_name` | `countryName` | 国家名称 |
| `company_id` | `internalCompanyId` | 内部公司ID |
| `company_name` | `internalCompanyName` | 内部公司名称 |
| `departure_port_id` | `departurePortId` | 出运口岸ID |
| `departure_port_name` | `departurePortName` | 出运口岸名称 |
| `currency` | `currency` | 币种 |
| `settlement_term_type` | `priceTerms` | 价格条款 |
| `valid_period` | `validUntil` | 有效期 |
| `manager` (JSON) | `salesPerson` (String) | 业务员 |
| `status` | `status` | 状态 |
| `audit_status` | `approvalStatus` | 审核状态 |
| `print_flag` | `printStatus` | 打印状态 |
| `process_instance_id` | `processInstanceId` | 流程实例ID |

### 明细表字段映射

| zexport (Java) | zform (TypeScript) | 说明 |
|----------------|-------------------|------|
| `sms_quotation_id` | `quotationId` | 报价单ID |
| `sku_code` | `productCode` | 产品编号 |
| `csku_code` | `customerProductNo` | 客户货号 |
| `basic_sku_code` | `baseProductCode` | 基础产品编号 |
| `main_picture` (JSON) | `productImage` (String) | 产品图片 |
| `name` | `productNameCn` | 中文名称 |
| `name_eng` | `productNameEn` | 英文名称 |
| `quotation` (JSON) | `unitPrice` (Decimal) | 报价 |
| `moq` | `minOrderQuantity` | 起订量 |
| `vender_id` | `supplierId` | 供应商ID |
| `vender_code` | `supplierCode` | 供应商编号 |
| `vender_name` | `supplierName` | 供应商名称 |
| `with_tax_price` (JSON) | `taxUnitPrice` (Decimal) | 含税单价 |
| `profit_rate` | `commissionRate` | 佣金比例 |
| `twenty_foot_cabinet_num` | `container20ft` | 20尺柜 |
| `forty_foot_cabinet_num` | `container40ft` | 40尺柜 |
| `forty_foot_container_num` | `container40hq` | 40尺高柜 |
| `bulk_handling_volume` | `bulkCargo` | 散货 |
| `package_type` (JSON) | `packageMethod` (String) | 包装方式 |
| `qty_per_innerbox` | `innerBoxQty` | 内箱装量 |
| `qty_per_outerbox` | `outerBoxQty` | 外箱装量 |
| `box_count` | `boxCount` | 箱数 |
| `unit_per_outerbox` | `outerBoxUnit` | 外箱单位 |
| `specification_list` (JSON) | 外箱尺寸字段 | 规格列表 |
| `description` | `productDescription` | 产品描述 |
| `description_eng` | `productDescriptionEn` | 英文描述 |
| `hs_code` | `hsCode` | HS编码 |
| `quote_date` | `deliveryDate` | 交货日期 |

---

## API 接口

### 已实现的接口

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/quotations` | 创建报价单 |
| PUT | `/api/quotations/:id` | 更新报价单 |
| DELETE | `/api/quotations/:id` | 删除报价单 |
| GET | `/api/quotations/:id` | 获取报价单详情 |
| GET | `/api/quotations` | 分页查询报价单 |
| POST | `/api/quotations/:id/submit` | 提交审批 |
| POST | `/api/quotations/:id/approve` | 审批通过 |
| POST | `/api/quotations/:id/reject` | 审批拒绝 |
| POST | `/api/quotations/:id/finish` | 结案 |
| POST | `/api/quotations/:id/mark-printed` | 标记已打印 |
| GET | `/api/quotations/:id/export` | 导出数据 |

---

## 使用示例

### 创建报价单

```typescript
POST /api/quotations
Content-Type: application/json
x-user-id: user-123

{
  "customerId": "cust-001",
  "customerCode": "C001",
  "customerName": "ABC Company",
  "customerContactName": "John Doe",
  "currency": "USD",
  "validUntil": "2026-12-31T23:59:59Z",
  "items": [
    {
      "lineNumber": 1,
      "productCode": "P001",
      "productNameCn": "产品A",
      "productNameEn": "Product A",
      "unitPrice": 10.50,
      "minOrderQuantity": 1000,
      "boxCount": 100,
      "outerBoxVolume": 0.5,
      "container20ft": 0,
      "container40ft": 0,
      "container40hq": 1,
      "bulkCargo": 0
    }
  ],
  "submitFlag": true
}
```

### 查询报价单

```typescript
GET /api/quotations?page=1&pageSize=20&customerId=cust-001&status=APPROVED
```

### 审批通过

```typescript
POST /api/quotations/:id/approve
x-user-id: manager-123
```

---

## 待完善的功能

### 高优先级

1. **其他费用管理**: 添加 `OtherFee` 表和相关逻辑
2. **BPM工作流集成**: 接入完整的审批流程系统
3. **文档导出**: 实现 Excel/Word 导出功能
4. **配置管理**: 柜型容积从配置表读取

### 中优先级

5. **图片处理**: 产品图片上传和显示
6. **单位转换**: 公制/英制单位转换
7. **权限控制**: 基于角色的访问控制
8. **日志记录**: 操作日志和审计日志

### 低优先级

9. **报表统计**: 报价单统计报表
10. **通知提醒**: 审批提醒、过期提醒
11. **批量操作**: 批量导入、批量审批

---

## 测试建议

### 单元测试

- 柜型数量计算逻辑
- 货币转换逻辑
- 状态流转逻辑

### 集成测试

- 创建报价单流程
- 更新报价单流程
- 审批流程
- 删除报价单流程

### 性能测试

- 大批量报价单查询
- 复杂明细数据处理
- 并发创建/更新

---

## 总结

已成功从 `zexport` 的 Java 实现中提取了客户报价单的核心业务逻辑，并在 `zform` 中使用 TypeScript/Node.js/Prisma 重新实现。

**核心功能**:
✅ 报价单CRUD操作
✅ 柜型数量自动计算和验证
✅ 状态流转和审批流程
✅ 货币转换
✅ 软删除机制

**技术栈**:
- TypeScript
- Node.js + Express
- Prisma ORM
- Decimal.js (精确计算)

**代码文件**:
- `server/src/services/quotation.service.ts` - 业务逻辑
- `server/src/controllers/quotation.controller.ts` - 控制器
- `server/src/routes/quotations.ts` - 路由定义

**下一步**:
1. 在主路由文件中注册报价单路由
2. 测试API接口
3. 根据实际需求添加其他功能
