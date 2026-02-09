/**
 * Supplier Management Schemas
 *
 * 供应商管理单据定义（基于后端 Prisma Schema）
 * 三种供应商类型各自独立 Schema：生产商、服务商、物流商
 */

import type { DocumentSchema, ChangeRule, FieldDef, DetailTableDef } from "@/core/types"

// ============================================================
// 共享字段定义
// ============================================================

/** 供应商基本信息字段 (所有类型共用) */
const baseFields: FieldDef[] = [
  // === 基本信息 ===
  {
    id: "code",
    label: "供应商编码",
    type: "text",
    readOnly: true,
    required: true,
    group: "基本信息",
  },
  {
    id: "name",
    label: "供应商名称",
    type: "text",
    required: true,
    group: "基本信息",
  },
  {
    id: "nameEn",
    label: "英文名称",
    type: "text",
    group: "基本信息",
  },
  {
    id: "shortName",
    label: "简称",
    type: "text",
    group: "基本信息",
  },
  {
    id: "registeredCapital",
    label: "注册资本",
    type: "number",
    placeholder: "0.00",
    group: "基本信息",
  },
  {
    id: "legalRepresentative",
    label: "法定代表人",
    type: "text",
    group: "基本信息",
  },
  {
    id: "mainBusiness",
    label: "主营业务",
    type: "textarea",
    span: 2,
    placeholder: "描述供应商主要经营范围",
    group: "基本信息",
  },
  {
    id: "payableSupplierCode",
    label: "应付供应商编号",
    type: "text",
    placeholder: "财务系统中的供应商编号",
    group: "基本信息",
  },

  // === 供应商分类与等级 ===
  {
    id: "stage",
    label: "供应商阶段",
    type: "select",
    options: [
      { label: "潜在供应商", value: "POTENTIAL" },
      { label: "正式供应商", value: "FORMAL" },
      { label: "退休供应商", value: "RETIRED" },
    ],
    defaultValue: "POTENTIAL",
    required: true,
    group: "分类信息",
  },
  {
    id: "supplierLevel",
    label: "供应商等级",
    type: "select",
    options: [
      { label: "A级", value: "A" },
      { label: "B级", value: "B" },
      { label: "C级", value: "C" },
      { label: "D级", value: "D" },
    ],
    group: "分类信息",
  },
  {
    id: "isOverseas",
    label: "境外供应商",
    type: "checkbox",
    defaultValue: false,
    group: "分类信息",
  },
  {
    id: "isInternalEnterprise",
    label: "内部企业",
    type: "checkbox",
    defaultValue: false,
    group: "分类信息",
  },
  {
    id: "isExpressCompany",
    label: "快递公司",
    type: "checkbox",
    defaultValue: false,
    group: "分类信息",
  },

  // === 地址信息 ===
  {
    id: "companyCity",
    label: "公司所在城市",
    type: "text",
    placeholder: "如：北京市",
    group: "地址信息",
  },
  {
    id: "companyAddress",
    label: "公司地址",
    type: "textarea",
    span: 2,
    placeholder: "详细公司地址",
    group: "地址信息",
  },
  {
    id: "factoryCity",
    label: "工厂所在城市",
    type: "text",
    placeholder: "如：深圳市",
    group: "地址信息",
  },
  {
    id: "factoryAddress",
    label: "工厂地址",
    type: "textarea",
    span: 2,
    placeholder: "详细工厂地址",
    group: "地址信息",
  },
  {
    id: "expressCity",
    label: "快递所在城市",
    type: "text",
    placeholder: "快递发货城市",
    group: "地址信息",
  },
  {
    id: "expressAddress",
    label: "快递地址",
    type: "textarea",
    span: 2,
    placeholder: "快递收发地址",
    group: "地址信息",
  },

  // === 证照信息 ===
  {
    id: "businessLicenseNo",
    label: "营业执照号",
    type: "text",
    placeholder: "统一社会信用代码",
    group: "证照信息",
  },
  {
    id: "companyPhone",
    label: "企业电话",
    type: "text",
    placeholder: "010-12345678",
    group: "证照信息",
  },
  {
    id: "fax",
    label: "传真",
    type: "text",
    placeholder: "传真号码",
    group: "证照信息",
  },

  // === 财务信息 ===
  {
    id: "countryCode",
    label: "国家编号",
    type: "text",
    placeholder: "如：CN, US",
    group: "财务信息",
  },
  {
    id: "currency",
    label: "币种",
    type: "select",
    options: [
      { label: "人民币", value: "CNY" },
      { label: "美元", value: "USD" },
      { label: "欧元", value: "EUR" },
      { label: "日元", value: "JPY" },
    ],
    defaultValue: "CNY",
    group: "财务信息",
  },
  {
    id: "taxRate",
    label: "税率 (%)",
    type: "number",
    placeholder: "13.00",
    group: "财务信息",
  },
  {
    id: "invoiceType",
    label: "发票类型",
    type: "select",
    options: [
      { label: "增值税专用发票", value: "VAT_GENERAL" },
      { label: "增值税普通发票", value: "VAT_SPECIAL" },
      { label: "普通发票", value: "ORDINARY" },
      { label: "收据", value: "RECEIPT" },
    ],
    group: "财务信息",
  },

  // === 业务信息 ===
  {
    id: "buyer",
    label: "主采购员",
    type: "text",
    placeholder: "选择采购员",
    group: "业务信息",
  },
  {
    id: "adminSupplierType",
    label: "行政供应商类型",
    type: "text",
    placeholder: "行政分类",
    group: "业务信息",
  },

  // === 启用状态 ===
  {
    id: "isEnabled",
    label: "是否启用",
    type: "checkbox",
    defaultValue: true,
    group: "其他信息",
  },

  // === 备注 ===
  {
    id: "remark",
    label: "备注",
    type: "textarea",
    span: 4,
    placeholder: "其他备注信息...",
    group: "备注信息",
  },
]

/** 供应商明细表定义 (所有类型共用) */
const supplierDetailTables: DetailTableDef[] = [
  {
    id: "bank_accounts",
    label: "银行账户",
    editable: true,
    fields: [
      {
        id: "bankName",
        label: "银行名称",
        type: "text",
        required: true,
      },
      {
        id: "accountNumber",
        label: "银行账号",
        type: "text",
        required: true,
      },
      {
        id: "branchAddress",
        label: "开户行地址",
        type: "text",
      },
      {
        id: "branchContact",
        label: "开户行联系人",
        type: "text",
      },
      {
        id: "bankCode",
        label: "银行行号",
        type: "text",
      },
      {
        id: "isDefault",
        label: "默认账户",
        type: "checkbox",
      },
    ],
  },
  {
    id: "quotations",
    label: "供应商报价",
    editable: true,
    fields: [
      {
        id: "quotationNo",
        label: "报价单号",
        type: "text",
        required: true,
      },
      {
        id: "productCode",
        label: "产品编码",
        type: "text",
      },
      {
        id: "productName",
        label: "产品名称",
        type: "text",
        required: true,
      },
      {
        id: "productSpec",
        label: "产品规格",
        type: "text",
      },
      {
        id: "quotationDate",
        label: "报价日期",
        type: "date",
        required: true,
      },
      {
        id: "validFrom",
        label: "有效期开始",
        type: "date",
        required: true,
      },
      {
        id: "validTo",
        label: "有效期结束",
        type: "date",
        required: true,
      },
      {
        id: "unitPrice",
        label: "单价",
        type: "number",
        required: true,
      },
      {
        id: "unit",
        label: "单位",
        type: "text",
      },
      {
        id: "moq",
        label: "最小起订量",
        type: "number",
      },
      {
        id: "leadTime",
        label: "交货周期(天)",
        type: "number",
      },
      {
        id: "paymentTerms",
        label: "付款条款",
        type: "text",
      },
      {
        id: "isActive",
        label: "是否有效",
        type: "checkbox",
      },
    ],
  },
]

// ============================================================
// 三种供应商 Schema
// ============================================================

/** 生产商 */
export const manufacturerSchema: DocumentSchema = {
  typeId: "manufacturer",
  typeName: "生产商",
  masterFields: [...baseFields],
  detailTables: supplierDetailTables,
}

/** 服务商 */
export const serviceProviderSchema: DocumentSchema = {
  typeId: "service_provider",
  typeName: "服务商",
  masterFields: [...baseFields],
  detailTables: supplierDetailTables,
}

/** 物流商 */
export const logisticsSchema: DocumentSchema = {
  typeId: "logistics",
  typeName: "物流商",
  masterFields: [...baseFields],
  detailTables: supplierDetailTables,
}

// ============================================================
// 变更规则 (共用逻辑，三种类型各注册一份)
// ============================================================

/** 供应商变更评估逻辑 (共用) */
function evaluateSupplierChange(
  oldDoc: Parameters<ChangeRule["evaluate"]>[0],
  newDoc: Parameters<ChangeRule["evaluate"]>[1],
  downstreamDocs: Parameters<ChangeRule["evaluate"]>[2],
) {
  const impacts: ReturnType<ChangeRule["evaluate"]> = []

  // 供应商名称变更
  if (oldDoc.masterData.name !== newDoc.masterData.name) {
    for (const downstream of downstreamDocs) {
      impacts.push({
        level: "warning" as const,
        affectedDocId: downstream.id,
        affectedTypeId: downstream.typeId,
        affectedDocNumber: downstream.docNumber,
        affectedField: "name",
        description: `供应商名称已变更 (${oldDoc.masterData.name} → ${newDoc.masterData.name}), 下游单据需要同步更新。`,
      })
    }
  }

  // 供应商阶段变更
  if (oldDoc.masterData.stage !== newDoc.masterData.stage) {
    const oldStage = oldDoc.masterData.stage as string
    const newStage = newDoc.masterData.stage as string
    const stageMap: Record<string, string> = {
      POTENTIAL: "潜在供应商",
      FORMAL: "正式供应商",
      RETIRED: "退休供应商",
    }

    for (const downstream of downstreamDocs) {
      impacts.push({
        level: "warning" as const,
        affectedDocId: downstream.id,
        affectedTypeId: downstream.typeId,
        affectedDocNumber: downstream.docNumber,
        affectedField: "stage",
        description: `供应商阶段已变更 (${stageMap[oldStage]} → ${stageMap[newStage]}), 可能影响下游采购业务。`,
      })
    }
  }

  // 供应商等级变更
  if (oldDoc.masterData.supplierLevel !== newDoc.masterData.supplierLevel) {
    for (const downstream of downstreamDocs) {
      impacts.push({
        level: "info" as const,
        affectedDocId: downstream.id,
        affectedTypeId: downstream.typeId,
        affectedDocNumber: downstream.docNumber,
        affectedField: "supplierLevel",
        description: `供应商等级已变更 (${oldDoc.masterData.supplierLevel} → ${newDoc.masterData.supplierLevel}), 建议重新评估供应商资质。`,
      })
    }
  }

  // 供应商停用
  if (
    oldDoc.masterData.isEnabled === true &&
    newDoc.masterData.isEnabled === false
  ) {
    for (const downstream of downstreamDocs) {
      impacts.push({
        level: "critical" as const,
        affectedDocId: downstream.id,
        affectedTypeId: downstream.typeId,
        affectedDocNumber: downstream.docNumber,
        affectedField: "isEnabled",
        description: `供应商已停用, 下游采购单据 ${downstream.docNumber} 可能无法继续执行, 请及时处理。`,
      })
    }
  }

  // 税率变更
  if (oldDoc.masterData.taxRate !== newDoc.masterData.taxRate) {
    for (const downstream of downstreamDocs) {
      impacts.push({
        level: "warning" as const,
        affectedDocId: downstream.id,
        affectedTypeId: downstream.typeId,
        affectedDocNumber: downstream.docNumber,
        affectedField: "taxRate",
        description: `供应商税率已变更 (${oldDoc.masterData.taxRate}% → ${newDoc.masterData.taxRate}%), 可能影响下游采购单据的成本计算。`,
      })
    }
  }

  return impacts
}

const supplierWatchFields = [
  "master.name",
  "master.shortName",
  "master.stage",
  "master.supplierLevel",
  "master.isEnabled",
  "master.taxRate",
]

/** 生产商变更规则 */
export const manufacturerChangeRule: ChangeRule = {
  typeId: "manufacturer",
  watchFields: supplierWatchFields,
  evaluate: evaluateSupplierChange,
}

/** 服务商变更规则 */
export const serviceProviderChangeRule: ChangeRule = {
  typeId: "service_provider",
  watchFields: supplierWatchFields,
  evaluate: evaluateSupplierChange,
}

/** 物流商变更规则 */
export const logisticsChangeRule: ChangeRule = {
  typeId: "logistics",
  watchFields: supplierWatchFields,
  evaluate: evaluateSupplierChange,
}
