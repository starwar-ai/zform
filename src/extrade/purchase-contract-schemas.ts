/**
 * Purchase Contract Schemas
 *
 * 采购合同单据定义
 */

import type { DocumentSchema, PushDownRule, ChangeRule } from "@/core/types"

// ============================================================
// 采购合同 (Purchase Contract)
// ============================================================

export const purchaseContractSchema: DocumentSchema = {
  typeId: "purchase_contract",
  typeName: "采购合同",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "合同编号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "internalCode",
      label: "内部编号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "purchasePlanCode",
      label: "采购计划编号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "contractType",
      label: "合同类型",
      type: "select",
      options: [
        { label: "标准合同", value: "STANDARD" },
        { label: "框架合同", value: "FRAMEWORK" },
        { label: "补充合同", value: "SUPPLEMENTARY" },
        { label: "紧急采购", value: "URGENT" },
      ],
      defaultValue: "STANDARD",
      required: true,
      group: "基本信息",
    },
    {
      id: "status",
      label: "合同状态",
      type: "select",
      options: [
        { label: "草稿", value: "DRAFT" },
        { label: "待审核", value: "PENDING" },
        { label: "已审核", value: "APPROVED" },
        { label: "执行中", value: "IN_PROGRESS" },
        { label: "已完成", value: "COMPLETED" },
        { label: "已取消", value: "CANCELLED" },
      ],
      defaultValue: "DRAFT",
      required: true,
      group: "基本信息",
    },
    {
      id: "approvalStatus",
      label: "审核状态",
      type: "select",
      options: [
        { label: "待审核", value: "PENDING" },
        { label: "已审核", value: "APPROVED" },
        { label: "已拒绝", value: "REJECTED" },
      ],
      defaultValue: "PENDING",
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

    // === 供应商信息 ===
    {
      id: "supplierId",
      label: "供应商ID",
      type: "text",
      required: true,
      group: "供应商信息",
    },
    {
      id: "supplierCode",
      label: "供应商编号",
      type: "text",
      required: true,
      group: "供应商信息",
    },
    {
      id: "supplierName",
      label: "供应商名称",
      type: "text",
      required: true,
      group: "供应商信息",
    },
    {
      id: "supplierContact",
      label: "供应商联系人",
      type: "text",
      group: "供应商信息",
    },
    {
      id: "supplierPhone",
      label: "供应商电话",
      type: "text",
      group: "供应商信息",
    },
    {
      id: "supplierAddress",
      label: "供应商地址",
      type: "textarea",
      span: 4,
      group: "供应商信息",
    },

    // === 采购主体与人员 ===
    {
      id: "purchasingEntity",
      label: "采购主体",
      type: "text",
      group: "采购信息",
    },
    {
      id: "buyer",
      label: "采购员",
      type: "text",
      required: true,
      group: "采购信息",
    },
    {
      id: "buyerDepartment",
      label: "采购部门",
      type: "text",
      group: "采购信息",
    },
    {
      id: "merchandiser",
      label: "跟单员",
      type: "text",
      group: "采购信息",
    },

    // === 金额与汇率 ===
    {
      id: "currency",
      label: "交易币别",
      type: "select",
      options: [
        { label: "CNY", value: "CNY" },
        { label: "USD", value: "USD" },
        { label: "EUR", value: "EUR" },
        { label: "GBP", value: "GBP" },
        { label: "JPY", value: "JPY" },
      ],
      defaultValue: "CNY",
      required: true,
      group: "金额信息",
    },
    {
      id: "exchangeRate",
      label: "汇率",
      type: "number",
      placeholder: "0.000000",
      group: "金额信息",
    },
    {
      id: "totalAmount",
      label: "合同总额",
      type: "computed",
      compute: (data) => {
        return data.totalAmount ?? 0
      },
      group: "金额信息",
    },
    {
      id: "totalAmountCny",
      label: "合同总额(CNY)",
      type: "computed",
      compute: (data) => {
        return data.totalAmountCny ?? 0
      },
      group: "金额信息",
    },
    {
      id: "paidAmount",
      label: "已付款金额",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "金额信息",
    },
    {
      id: "unpaidAmount",
      label: "未付款金额",
      type: "computed",
      compute: (data) => {
        const total = (data.totalAmount as number) ?? 0
        const paid = (data.paidAmount as number) ?? 0
        return total - paid
      },
      group: "金额信息",
    },

    // === 付款信息 ===
    {
      id: "paymentTerms",
      label: "付款条款",
      type: "select",
      options: [
        { label: "预付全款", value: "PREPAID" },
        { label: "货到付款", value: "COD" },
        { label: "月结30天", value: "NET30" },
        { label: "月结60天", value: "NET60" },
        { label: "月结90天", value: "NET90" },
        { label: "分期付款", value: "INSTALLMENT" },
      ],
      group: "付款信息",
    },
    {
      id: "paymentMethod",
      label: "付款方式",
      type: "select",
      options: [
        { label: "电汇", value: "TT" },
        { label: "信用证", value: "LC" },
        { label: "承兑汇票", value: "ACCEPTANCE" },
        { label: "现金", value: "CASH" },
        { label: "支票", value: "CHECK" },
      ],
      group: "付款信息",
    },
    {
      id: "paymentAccountId",
      label: "付款账号ID",
      type: "text",
      group: "付款信息",
    },
    {
      id: "paymentAccountCode",
      label: "付款账号",
      type: "text",
      group: "付款信息",
    },

    // === 交货信息 ===
    {
      id: "deliveryDate",
      label: "交货日期",
      type: "date",
      required: true,
      group: "交货信息",
    },
    {
      id: "deliveryAddress",
      label: "交货地址",
      type: "textarea",
      span: 4,
      group: "交货信息",
    },
    {
      id: "deliveryMethod",
      label: "交货方式",
      type: "select",
      options: [
        { label: "供应商送货", value: "SUPPLIER_DELIVERY" },
        { label: "自提", value: "SELF_PICKUP" },
        { label: "物流配送", value: "LOGISTICS" },
        { label: "快递", value: "EXPRESS" },
      ],
      group: "交货信息",
    },
    {
      id: "deliveryContact",
      label: "收货联系人",
      type: "text",
      group: "交货信息",
    },
    {
      id: "deliveryPhone",
      label: "收货电话",
      type: "text",
      group: "交货信息",
    },

    // === 质量与验收 ===
    {
      id: "qualityStandard",
      label: "质量标准",
      type: "text",
      group: "质量验收",
    },
    {
      id: "inspectionMethod",
      label: "验收方式",
      type: "select",
      options: [
        { label: "送货验收", value: "DELIVERY_INSPECTION" },
        { label: "抽样验收", value: "SAMPLING" },
        { label: "全检", value: "FULL_INSPECTION" },
        { label: "免检", value: "NO_INSPECTION" },
      ],
      group: "质量验收",
    },
    {
      id: "warrantyPeriod",
      label: "质保期限",
      type: "text",
      placeholder: "如: 1年、6个月等",
      group: "质量验收",
    },

    // === 税务信息 ===
    {
      id: "taxRate",
      label: "税率(%)",
      type: "number",
      defaultValue: 13,
      group: "税务信息",
    },
    {
      id: "includeTax",
      label: "是否含税",
      type: "checkbox",
      defaultValue: true,
      group: "税务信息",
    },
    {
      id: "invoiceType",
      label: "发票类型",
      type: "select",
      options: [
        { label: "增值税专用发票", value: "VAT_SPECIAL" },
        { label: "增值税普通发票", value: "VAT_GENERAL" },
        { label: "普通发票", value: "ORDINARY" },
        { label: "收据", value: "RECEIPT" },
      ],
      group: "税务信息",
    },

    // === 统计信息 ===
    {
      id: "totalQuantity",
      label: "数量合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "统计信息",
    },
    {
      id: "totalBoxes",
      label: "箱数合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "统计信息",
    },
    {
      id: "totalWeight",
      label: "重量合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "统计信息",
    },

    // === 来源追溯 ===
    {
      id: "salesContractId",
      label: "销售合同ID",
      type: "text",
      readOnly: true,
      group: "来源追溯",
    },
    {
      id: "salesContractCode",
      label: "销售合同编号",
      type: "text",
      readOnly: true,
      group: "来源追溯",
    },
    {
      id: "purchasePlanId",
      label: "采购计划ID",
      type: "text",
      readOnly: true,
      group: "来源追溯",
    },
    {
      id: "orderLinkCode",
      label: "订单链路编号",
      type: "text",
      readOnly: true,
      group: "来源追溯",
    },

    // === 确认与打印 ===
    {
      id: "confirmStatus",
      label: "确认状态",
      type: "select",
      options: [
        { label: "未确认", value: "NOT_CONFIRMED" },
        { label: "已确认", value: "CONFIRMED" },
        { label: "已拒绝", value: "REJECTED" },
      ],
      defaultValue: "NOT_CONFIRMED",
      group: "确认打印",
    },
    {
      id: "printStatus",
      label: "打印状态",
      type: "select",
      options: [
        { label: "未打印", value: "NOT_PRINTED" },
        { label: "已打印", value: "PRINTED" },
      ],
      defaultValue: "NOT_PRINTED",
      readOnly: true,
      group: "确认打印",
    },
    {
      id: "printCount",
      label: "打印次数",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "确认打印",
    },

    // === 标识字段 ===
    {
      id: "isUrgent",
      label: "紧急采购",
      type: "checkbox",
      defaultValue: false,
      group: "标识字段",
    },
    {
      id: "isFramework",
      label: "框架合同",
      type: "checkbox",
      defaultValue: false,
      group: "标识字段",
    },
    {
      id: "autoCreated",
      label: "自动生成",
      type: "checkbox",
      defaultValue: false,
      readOnly: true,
      group: "标识字段",
    },

    // === 备注与附件 ===
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "备注附件",
    },
    {
      id: "contractFile",
      label: "合同文件",
      type: "text",
      placeholder: "合同文件URL",
      group: "备注附件",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "采购明细",
      editable: true,
      fields: [
        {
          id: "lineNumber",
          label: "行号",
          type: "number",
          readOnly: true,
        },
        {
          id: "productId",
          label: "产品ID",
          type: "text",
        },
        {
          id: "productCode",
          label: "产品编码",
          type: "text",
          required: true,
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
          id: "supplierProductNo",
          label: "供应商料号",
          type: "text",
        },
        {
          id: "quantity",
          label: "数量",
          type: "number",
          required: true,
        },
        {
          id: "unit",
          label: "单位",
          type: "select",
          options: [
            { label: "PCS", value: "PCS" },
            { label: "SET", value: "SET" },
            { label: "UNIT", value: "UNIT" },
            { label: "TON", value: "TON" },
            { label: "KG", value: "KG" },
          ],
          defaultValue: "PCS",
        },
        {
          id: "unitPrice",
          label: "单价",
          type: "number",
          required: true,
        },
        {
          id: "currency",
          label: "币种",
          type: "select",
          options: [
            { label: "CNY", value: "CNY" },
            { label: "USD", value: "USD" },
            { label: "EUR", value: "EUR" },
          ],
          defaultValue: "CNY",
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
          id: "taxRate",
          label: "税率(%)",
          type: "number",
          defaultValue: 13,
        },
        {
          id: "taxAmount",
          label: "税额",
          type: "computed",
          compute: (row) => {
            const amount = (row.amount as number) ?? 0
            const taxRate = (row.taxRate as number) ?? 0
            return amount * (taxRate / 100)
          },
        },
        {
          id: "totalAmount",
          label: "含税金额",
          type: "computed",
          compute: (row) => {
            const amount = (row.amount as number) ?? 0
            const taxAmount = (row.taxAmount as number) ?? 0
            return amount + taxAmount
          },
        },
        {
          id: "deliveryDate",
          label: "交货日期",
          type: "date",
        },
        {
          id: "receivedQuantity",
          label: "已收货数量",
          type: "number",
          defaultValue: 0,
          readOnly: true,
        },
        {
          id: "pendingQuantity",
          label: "待收货数量",
          type: "computed",
          compute: (row) => {
            const qty = (row.quantity as number) ?? 0
            const received = (row.receivedQuantity as number) ?? 0
            return qty - received
          },
        },
        {
          id: "qualityStatus",
          label: "质检状态",
          type: "select",
          options: [
            { label: "未检", value: "NOT_INSPECTED" },
            { label: "合格", value: "QUALIFIED" },
            { label: "不合格", value: "UNQUALIFIED" },
          ],
        },
        {
          id: "remark",
          label: "备注",
          type: "text",
        },
      ],
    },
  ],
}

// ============================================================
// 下推规则
// ============================================================

/** 采购计划 → 采购合同 */
export const purchasePlanToPurchaseContractRule: PushDownRule = {
  sourceTypeId: "purchase_plan",
  targetTypeId: "purchase_contract",
  name: "生成采购合同",
  masterFieldMappings: [
    { sourceField: "master.code", targetField: "purchasePlanCode" },
    { sourceField: "master.buyer", targetField: "buyer" },
    { sourceField: "master.expectedDeliveryDate", targetField: "deliveryDate" },
    { sourceField: "master.purchasingEntity", targetField: "purchasingEntity" },
    { sourceField: "master.merchandiser", targetField: "merchandiser" },
    { sourceField: "master.orderLinkCode", targetField: "orderLinkCode" },
    { sourceField: "master.salesContractId", targetField: "salesContractId" },
    { sourceField: "master.salesContractCode", targetField: "salesContractCode" },
  ],
  detailMappings: [
    {
      sourceTableId: "items",
      targetTableId: "items",
      fieldMappings: [
        { sourceField: "productId", targetField: "productId" },
        { sourceField: "productCode", targetField: "productCode" },
        { sourceField: "productName", targetField: "productName" },
        { sourceField: "specification", targetField: "productSpec" },
        { sourceField: "purchaseQuantity", targetField: "quantity" },
        { sourceField: "unitPrice", targetField: "unitPrice" },
        { sourceField: "currency", targetField: "currency" },
        { sourceField: "deliveryDate", targetField: "deliveryDate" },
        { sourceField: "taxRate", targetField: "taxRate" },
        { sourceField: "remark", targetField: "remark" },
      ],
      rowFilter: (row) => {
        // 只下推待采购数量 > 0 的行
        const pendingQty = (row.data.pendingQuantity as number) ?? 0
        return pendingQty > 0
      },
    },
  ],
}

// ============================================================
// 变更规则
// ============================================================

/** 采购合同变更规则 */
export const purchaseContractChangeRule: ChangeRule = {
  typeId: "purchase_contract",
  watchFields: [
    "master.deliveryDate",
    "master.status",
    "master.totalAmount",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 交货日期变更
    if (oldDoc.masterData.deliveryDate !== newDoc.masterData.deliveryDate) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "warning" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "deliveryDate",
          description: `采购合同交货日期变更 (${oldDoc.masterData.deliveryDate} → ${newDoc.masterData.deliveryDate}), 可能影响下游单据。`,
        })
      }
    }

    // 采购合同取消
    if (
      oldDoc.masterData.status !== "CANCELLED" &&
      newDoc.masterData.status === "CANCELLED"
    ) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "critical" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "status",
          description: `采购合同已取消, 下游单据 ${downstream.docNumber} 需要处理。`,
        })
      }
    }

    return impacts
  },
}
