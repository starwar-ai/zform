/**
 * Supplier Management Schemas
 *
 * 供应商管理单据定义（基于后端 Prisma Schema）
 * 三种供应商类型各自独立 Schema：生产商、服务商、物流商
 */

import type { DocumentSchema, ChangeRule, FieldDef, DetailTableDef, ComboboxOption } from "@/core/types"

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

const fetchPaymentTermOptions = async (): Promise<ComboboxOption[]> => {
  const { fetchParameterListApi } = await import("@/apis/business-entity-api")
  const list = await fetchParameterListApi<{ id: string; name: string }>("payment-terms")
  return list.map((t) => ({ value: t.id, label: t.name }))
}

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
    addRowSelector: {
      type: "product",
      multiple: false,
      buttonLabel: "选择产品",
      mapToRowData: (item: Record<string, unknown>) => ({
        // 产品信息
        productId: item._id,
        productCode: item._docNumber ?? item.code,
        productName: item.name,
        productSpec: item.spec ?? null,
        skuCode: item.code,
        // 报价信息
        quotationDate: new Date().toISOString().slice(0, 10),
        currency: "CNY",
        purchaseUnitPrice: null,
        includeTax: false,
        taxRate: null,
        taxIncludedUnitPrice: null,
        includePackaging: false,
        packagingPrice: null,
        includeFreight: false,
        freight: null,
        fullUnitPrice: null,
        moq: null,
        leadTime: null,
        // 工厂与采购信息
        factoryProductNo: null,
        purchaseLink: null,
        // 包装信息
        packageMethod: null,
        innerBoxQty: null,
        outerBoxQty: null,
        packageLength: null,
        packageWidth: null,
        packageHeight: null,
        outerBoxLength: null,
        outerBoxWidth: null,
        outerBoxHeight: null,
        outerBoxVolume: null,
        outerBoxNetWeight: null,
        itemGrossWeight: null,
        outerBoxGrossWeight: null,
        // 柜量信息
        bulkCargo: false,
        container20ftQty: null,
        container40ftQty: null,
        container40hqQty: null,
        // 开票信息
        invoiceProductName: null,
        // 状态
        isDefault: false,
        isActive: true,
        // 备注与附件
        remark: null,
        attachments: null,
        images: null,
      }),
    },
    fields: [
      // === 产品信息 ===
      {
        id: "productCode",
        label: "产品编码",
        type: "text",
        readOnly: true,
        width: "120px",
      },
      {
        id: "productName",
        label: "产品名称",
        type: "text",
        readOnly: true,
        required: true,
        width: "150px",
      },
      {
        id: "productSpec",
        label: "产品规格",
        type: "text",
        readOnly: true,
        width: "120px",
      },
      {
        id: "factoryProductNo",
        label: "工厂货号",
        type: "text",
        width: "120px",
      },
      // === 报价日期 ===
      {
        id: "quotationDate",
        label: "报价日期",
        type: "date",
        required: true,
        width: "120px",
      },
      // === 价格信息 ===
      {
        id: "currency",
        label: "币种",
        type: "select",
        options: [
          { label: "CNY", value: "CNY" },
          { label: "USD", value: "USD" },
          { label: "EUR", value: "EUR" },
          { label: "GBP", value: "GBP" },
          { label: "JPY", value: "JPY" },
        ],
        defaultValue: "CNY",
        width: "80px",
      },
      {
        id: "purchaseUnitPrice",
        label: "采购单价",
        type: "number",
        required: true,
        placeholder: "0.0000",
        width: "100px",
      },
      {
        id: "includeTax",
        label: "含税",
        type: "checkbox",
        defaultValue: false,
        width: "60px",
      },
      {
        id: "taxRate",
        label: "税率(%)",
        type: "number",
        placeholder: "0.00",
        width: "80px",
      },
      {
        id: "taxIncludedUnitPrice",
        label: "含税单价",
        type: "number",
        placeholder: "0.0000",
        width: "100px",
      },
      {
        id: "includePackaging",
        label: "含包装",
        type: "checkbox",
        defaultValue: false,
        width: "70px",
      },
      {
        id: "packagingPrice",
        label: "包装价",
        type: "number",
        placeholder: "0.0000",
        width: "90px",
      },
      {
        id: "includeFreight",
        label: "含运费",
        type: "checkbox",
        defaultValue: false,
        width: "70px",
      },
      {
        id: "freight",
        label: "运费",
        type: "number",
        placeholder: "0.0000",
        width: "90px",
      },
      {
        id: "fullUnitPrice",
        label: "含税含包装含运费单价",
        type: "number",
        placeholder: "0.0000",
        width: "160px",
      },
      // === 采购条件 ===
      {
        id: "moq",
        label: "最小起购量",
        type: "number",
        placeholder: "0",
        width: "100px",
      },
      {
        id: "leadTime",
        label: "交期(天)",
        type: "number",
        placeholder: "0",
        width: "90px",
      },
      {
        id: "purchaseLink",
        label: "采购链接",
        type: "text",
        width: "150px",
      },
      // === 包装方式 ===
      {
        id: "packageMethod",
        label: "包装方式",
        type: "text",
        width: "100px",
      },
      {
        id: "innerBoxQty",
        label: "内箱装量",
        type: "number",
        placeholder: "0",
        width: "90px",
      },
      {
        id: "outerBoxQty",
        label: "外箱装量",
        type: "number",
        placeholder: "0",
        width: "90px",
      },
      // === 包装规格 ===
      {
        id: "packageLength",
        label: "包装长(cm)",
        type: "number",
        placeholder: "0.00",
        width: "100px",
      },
      {
        id: "packageWidth",
        label: "包装宽(cm)",
        type: "number",
        placeholder: "0.00",
        width: "100px",
      },
      {
        id: "packageHeight",
        label: "包装高(cm)",
        type: "number",
        placeholder: "0.00",
        width: "100px",
      },
      // === 外箱规格 ===
      {
        id: "outerBoxLength",
        label: "外箱长(cm)",
        type: "number",
        placeholder: "0.00",
        width: "100px",
      },
      {
        id: "outerBoxWidth",
        label: "外箱宽(cm)",
        type: "number",
        placeholder: "0.00",
        width: "100px",
      },
      {
        id: "outerBoxHeight",
        label: "外箱高(cm)",
        type: "number",
        placeholder: "0.00",
        width: "100px",
      },
      {
        id: "outerBoxVolume",
        label: "外箱体积(m³)",
        type: "number",
        placeholder: "0.000000",
        width: "110px",
      },
      // === 重量信息 ===
      {
        id: "outerBoxNetWeight",
        label: "外箱净重(kg)",
        type: "number",
        placeholder: "0.00",
        width: "110px",
      },
      {
        id: "itemGrossWeight",
        label: "单品毛重(kg)",
        type: "number",
        placeholder: "0.00",
        width: "110px",
      },
      {
        id: "outerBoxGrossWeight",
        label: "外箱毛重(kg)",
        type: "number",
        placeholder: "0.00",
        width: "110px",
      },
      // === 柜量信息 ===
      {
        id: "bulkCargo",
        label: "是否分箱",
        type: "checkbox",
        defaultValue: false,
        width: "80px",
      },
      {
        id: "container20ftQty",
        label: "20尺柜装数量",
        type: "number",
        placeholder: "0",
        width: "110px",
      },
      {
        id: "container40ftQty",
        label: "40尺柜装数量",
        type: "number",
        placeholder: "0",
        width: "110px",
      },
      {
        id: "container40hqQty",
        label: "40高柜装数量",
        type: "number",
        placeholder: "0",
        width: "110px",
      },
      // === 开票信息 ===
      {
        id: "invoiceProductName",
        label: "开票品名",
        type: "text",
        width: "150px",
      },
      // === 状态 ===
      {
        id: "isDefault",
        label: "是否默认",
        type: "checkbox",
        defaultValue: false,
        width: "80px",
      },
      {
        id: "isActive",
        label: "是否有效",
        type: "checkbox",
        defaultValue: true,
        width: "80px",
      },
      // === 备注与附件 ===
      {
        id: "remark",
        label: "备注",
        type: "text",
        width: "200px",
      },
      {
        id: "attachments",
        label: "附件",
        type: "text",
        width: "100px",
      },
      {
        id: "images",
        label: "图片",
        type: "text",
        width: "100px",
      },
    ],
  },
  {
    id: "payment_terms",
    label: "付款方式",
    editable: true,
    fields: [
      {
        id: "periodIndex",
        label: "期序号",
        type: "number",
        required: true,
        defaultValue: 1,
      },
      {
        id: "paymentTermId",
        label: "付款方式",
        type: "combobox",
        required: true,
        comboboxConfig: {
          fetchOptions: fetchPaymentTermOptions,
          isTree: false,
        },
      },
      {
        id: "paymentRatio",
        label: "比例(%)",
        type: "number",
        placeholder: "如: 30",
      },
      {
        id: "paymentDescription",
        label: "说明",
        type: "text",
        placeholder: "如: T/T 30%预付",
      },
      {
        id: "paymentDateBase",
        label: "起始日类型",
        type: "select",
        options: [
          { label: "合同签订日", value: "1" },
          { label: "发货日", value: "2" },
          { label: "验收日", value: "3" },
          { label: "开票日", value: "4" },
        ],
      },
      {
        id: "daysOffset",
        label: "延后天数",
        type: "number",
        defaultValue: 0,
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
