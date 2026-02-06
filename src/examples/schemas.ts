/**
 * Example Business Schemas
 *
 * 示例业务单据定义: 销售合同 → 采购计划 → 采购合同
 */

import type { DocumentSchema, PushDownRule, ChangeRule } from "@/core/types"

// ============================================================
// 销售合同 (Sales Contract)
// ============================================================

export const salesContractSchema: DocumentSchema = {
  typeId: "sales_contract",
  typeName: "销售合同",
  masterFields: [
    {
      id: "contractNo",
      label: "合同编号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "customerName",
      label: "客户名称",
      type: "text",
      required: true,
      group: "基本信息",
    },
    {
      id: "signDate",
      label: "签约日期",
      type: "date",
      required: true,
      group: "基本信息",
    },
    {
      id: "deliveryDate",
      label: "交货日期",
      type: "date",
      required: true,
      group: "基本信息",
    },
    {
      id: "salesPerson",
      label: "销售负责人",
      type: "text",
      group: "基本信息",
    },
    {
      id: "paymentTerms",
      label: "付款方式",
      type: "select",
      options: [
        { label: "预付全款", value: "prepaid" },
        { label: "货到付款", value: "cod" },
        { label: "月结30天", value: "net30" },
        { label: "月结60天", value: "net60" },
      ],
      group: "基本信息",
    },
    {
      id: "totalAmount",
      label: "合同总额",
      type: "computed",
      compute: (data) => {
        // 注意: 计算字段在主表中，但实际总额来自明细汇总
        // 这里只是展示计算能力
        return data.totalAmount ?? 0
      },
      group: "金额信息",
    },
    {
      id: "remarks",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "其他",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "产品明细",
      editable: true,
      fields: [
        {
          id: "productName",
          label: "产品名称",
          type: "text",
          required: true,
        },
        {
          id: "specification",
          label: "规格型号",
          type: "text",
        },
        {
          id: "unit",
          label: "单位",
          type: "select",
          options: [
            { label: "件", value: "piece" },
            { label: "台", value: "unit" },
            { label: "套", value: "set" },
            { label: "吨", value: "ton" },
            { label: "米", value: "meter" },
          ],
        },
        {
          id: "quantity",
          label: "数量",
          type: "number",
          required: true,
        },
        {
          id: "unitPrice",
          label: "单价",
          type: "number",
          required: true,
        },
        {
          id: "amount",
          label: "金额",
          type: "computed",
          compute: (row) => {
            const qty = (row.quantity as number) ?? 0
            const price = (row.unitPrice as number) ?? 0
            return qty * price
          },
        },
        {
          id: "deliveryDate",
          label: "要求交期",
          type: "date",
        },
      ],
    },
  ],
}

// ============================================================
// 采购计划 (Purchase Plan)
// ============================================================

export const purchasePlanSchema: DocumentSchema = {
  typeId: "purchase_plan",
  typeName: "采购计划",
  masterFields: [
    {
      id: "planNo",
      label: "计划编号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "customerName",
      label: "客户名称",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "requiredDate",
      label: "需求日期",
      type: "date",
      required: true,
      group: "基本信息",
    },
    {
      id: "buyer",
      label: "采购员",
      type: "text",
      group: "基本信息",
    },
    {
      id: "priority",
      label: "优先级",
      type: "select",
      options: [
        { label: "普通", value: "normal" },
        { label: "紧急", value: "urgent" },
        { label: "特急", value: "critical" },
      ],
      defaultValue: "normal",
      group: "基本信息",
    },
    {
      id: "remarks",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "其他",
    },
  ],
  detailTables: [
    {
      id: "materials",
      label: "采购物料明细",
      editable: true,
      fields: [
        {
          id: "productName",
          label: "物料名称",
          type: "text",
          required: true,
        },
        {
          id: "specification",
          label: "规格型号",
          type: "text",
        },
        {
          id: "unit",
          label: "单位",
          type: "select",
          options: [
            { label: "件", value: "piece" },
            { label: "台", value: "unit" },
            { label: "套", value: "set" },
            { label: "吨", value: "ton" },
            { label: "米", value: "meter" },
          ],
        },
        {
          id: "requiredQty",
          label: "需求数量",
          type: "number",
          required: true,
        },
        {
          id: "estimatedPrice",
          label: "预估单价",
          type: "number",
        },
        {
          id: "estimatedAmount",
          label: "预估金额",
          type: "computed",
          compute: (row) => {
            const qty = (row.requiredQty as number) ?? 0
            const price = (row.estimatedPrice as number) ?? 0
            return qty * price
          },
        },
        {
          id: "requiredDate",
          label: "需求日期",
          type: "date",
        },
        {
          id: "suggestedSupplier",
          label: "建议供应商",
          type: "text",
        },
      ],
    },
  ],
}

// ============================================================
// 采购合同 (Purchase Contract)
// ============================================================

export const purchaseContractSchema: DocumentSchema = {
  typeId: "purchase_contract",
  typeName: "采购合同",
  masterFields: [
    {
      id: "contractNo",
      label: "合同编号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "supplierName",
      label: "供应商名称",
      type: "text",
      required: true,
      group: "基本信息",
    },
    {
      id: "signDate",
      label: "签约日期",
      type: "date",
      required: true,
      group: "基本信息",
    },
    {
      id: "deliveryDate",
      label: "交货日期",
      type: "date",
      required: true,
      group: "基本信息",
    },
    {
      id: "buyer",
      label: "采购员",
      type: "text",
      group: "基本信息",
    },
    {
      id: "paymentTerms",
      label: "付款方式",
      type: "select",
      options: [
        { label: "预付全款", value: "prepaid" },
        { label: "货到付款", value: "cod" },
        { label: "月结30天", value: "net30" },
        { label: "月结60天", value: "net60" },
      ],
      group: "基本信息",
    },
    {
      id: "totalAmount",
      label: "合同总额",
      type: "computed",
      compute: (data) => data.totalAmount ?? 0,
      group: "金额信息",
    },
    {
      id: "remarks",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "其他",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "采购明细",
      editable: true,
      fields: [
        {
          id: "productName",
          label: "物料名称",
          type: "text",
          required: true,
        },
        {
          id: "specification",
          label: "规格型号",
          type: "text",
        },
        {
          id: "unit",
          label: "单位",
          type: "select",
          options: [
            { label: "件", value: "piece" },
            { label: "台", value: "unit" },
            { label: "套", value: "set" },
            { label: "吨", value: "ton" },
            { label: "米", value: "meter" },
          ],
        },
        {
          id: "quantity",
          label: "数量",
          type: "number",
          required: true,
        },
        {
          id: "unitPrice",
          label: "单价",
          type: "number",
          required: true,
        },
        {
          id: "amount",
          label: "金额",
          type: "computed",
          compute: (row) => {
            const qty = (row.quantity as number) ?? 0
            const price = (row.unitPrice as number) ?? 0
            return qty * price
          },
        },
        {
          id: "deliveryDate",
          label: "交货日期",
          type: "date",
        },
      ],
    },
  ],
}

// ============================================================
// 下推规则
// ============================================================

/** 销售合同 → 采购计划 */
export const salesToPurchasePlanRule: PushDownRule = {
  sourceTypeId: "sales_contract",
  targetTypeId: "purchase_plan",
  name: "生成采购计划",
  masterFieldMappings: [
    { sourceField: "master.customerName", targetField: "customerName" },
    { sourceField: "master.deliveryDate", targetField: "requiredDate" },
  ],
  detailMappings: [
    {
      sourceTableId: "items",
      targetTableId: "materials",
      fieldMappings: [
        { sourceField: "productName", targetField: "productName" },
        { sourceField: "specification", targetField: "specification" },
        { sourceField: "unit", targetField: "unit" },
        { sourceField: "quantity", targetField: "requiredQty" },
        { sourceField: "unitPrice", targetField: "estimatedPrice" },
        { sourceField: "deliveryDate", targetField: "requiredDate" },
      ],
    },
  ],
}

/** 采购计划 → 采购合同 */
export const purchasePlanToContractRule: PushDownRule = {
  sourceTypeId: "purchase_plan",
  targetTypeId: "purchase_contract",
  name: "生成采购合同",
  masterFieldMappings: [
    { sourceField: "master.buyer", targetField: "buyer" },
    { sourceField: "master.requiredDate", targetField: "deliveryDate" },
  ],
  detailMappings: [
    {
      sourceTableId: "materials",
      targetTableId: "items",
      fieldMappings: [
        { sourceField: "productName", targetField: "productName" },
        { sourceField: "specification", targetField: "specification" },
        { sourceField: "unit", targetField: "unit" },
        { sourceField: "requiredQty", targetField: "quantity" },
        { sourceField: "estimatedPrice", targetField: "unitPrice" },
        { sourceField: "requiredDate", targetField: "deliveryDate" },
      ],
    },
  ],
}

// ============================================================
// 变更规则
// ============================================================

/** 销售合同变更规则: 数量变更影响下游 */
export const salesContractChangeRule: ChangeRule = {
  typeId: "sales_contract",
  watchFields: ["master.deliveryDate", "master.customerName"],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 交期变更
    if (oldDoc.masterData.deliveryDate !== newDoc.masterData.deliveryDate) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "warning" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "deliveryDate",
          description: `销售合同交货日期变更 (${oldDoc.masterData.deliveryDate} → ${newDoc.masterData.deliveryDate}), 可能需要同步更新下游单据的需求日期。`,
        })
      }
    }

    return impacts
  },
}

/** 采购计划变更规则 */
export const purchasePlanChangeRule: ChangeRule = {
  typeId: "purchase_plan",
  watchFields: ["master.requiredDate"],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    if (oldDoc.masterData.requiredDate !== newDoc.masterData.requiredDate) {
      for (const downstream of downstreamDocs) {
        if (downstream.status !== "draft") {
          impacts.push({
            level: "critical" as const,
            affectedDocId: downstream.id,
            affectedTypeId: downstream.typeId,
            affectedDocNumber: downstream.docNumber,
            affectedField: "deliveryDate",
            description: `采购计划需求日期变更, 但下游采购合同 ${downstream.docNumber} 已非草稿状态, 不允许自动变更。`,
          })
        } else {
          impacts.push({
            level: "warning" as const,
            affectedDocId: downstream.id,
            affectedTypeId: downstream.typeId,
            affectedDocNumber: downstream.docNumber,
            affectedField: "deliveryDate",
            description: `采购计划需求日期变更, 下游采购合同 ${downstream.docNumber} 的交货日期需要同步更新。`,
          })
        }
      }
    }

    return impacts
  },
}
