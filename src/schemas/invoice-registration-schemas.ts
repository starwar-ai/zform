/**
 * Invoice Registration Schemas
 *
 * 发票登记单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 发票登记 (Invoice Registration)
// ============================================================

export const invoiceRegistrationSchema: DocumentSchema = {
  typeId: "invoice_registration",
  typeName: "发票登记",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "编号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "status",
      label: "状态",
      type: "select",
      options: [
        { label: "草稿", value: "DRAFT" },
        { label: "待审核", value: "SUBMITTED" },
        { label: "已审核", value: "APPROVED" },
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
      group: "基本信息",
    },

    // === 付款主体信息 ===
    {
      id: "paymentEntityId",
      label: "付款主体ID",
      type: "text",
      group: "付款主体",
    },
    {
      id: "paymentEntityName",
      label: "付款主体名称",
      type: "text",
      group: "付款主体",
    },

    // === 供应商信息 ===
    {
      id: "supplierId",
      label: "供应商ID",
      type: "text",
      group: "供应商信息",
    },
    {
      id: "supplierCode",
      label: "供应商编号",
      type: "text",
      group: "供应商信息",
    },
    {
      id: "supplierName",
      label: "供应商名称",
      type: "text",
      group: "供应商信息",
    },

    // === 发票信息 ===
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
      defaultValue: "VAT_SPECIAL",
      group: "发票信息",
    },
    {
      id: "taxInvoiceNo",
      label: "税票编号",
      type: "text",
      group: "发票信息",
    },
    {
      id: "receivedDate",
      label: "收票日期",
      type: "date",
      group: "发票信息",
    },
    {
      id: "invoiceAmount",
      label: "发票总金额",
      type: "number",
      group: "发票信息",
    },
    {
      id: "currency",
      label: "币别",
      type: "select",
      options: [
        { label: "CNY", value: "CNY" },
        { label: "USD", value: "USD" },
        { label: "EUR", value: "EUR" },
        { label: "HKD", value: "HKD" },
      ],
      defaultValue: "CNY",
      group: "发票信息",
    },
    {
      id: "taxRate",
      label: "税率",
      type: "number",
      group: "发票信息",
    },

    // === 复核信息 ===
    {
      id: "reviewer",
      label: "复核人",
      type: "text",
      readOnly: true,
      group: "复核信息",
    },
    {
      id: "reviewDate",
      label: "复核日期",
      type: "date",
      readOnly: true,
      group: "复核信息",
    },

    // === 录入信息 ===
    {
      id: "enteredBy",
      label: "录入人",
      type: "text",
      group: "录入信息",
    },
    {
      id: "enteredDate",
      label: "录入日期",
      type: "date",
      group: "录入信息",
    },

    // === 附件 ===
    {
      id: "attachments",
      label: "附件",
      type: "text",
      group: "附件",
    },

    // === 备注 ===
    {
      id: "remark",
      label: "业务简要",
      type: "textarea",
      span: 4,
      group: "备注",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "发票登记明细",
      editable: true,
      fields: [
        {
          id: "productCode",
          label: "产品编号",
          type: "text",
        },
        {
          id: "productName",
          label: "产品名称",
          type: "text",
        },
        {
          id: "chineseName",
          label: "中文品名",
          type: "text",
        },
        {
          id: "baseProductCode",
          label: "基础产品编号",
          type: "text",
        },
        {
          id: "customerProductNo",
          label: "客户货号",
          type: "text",
        },
        {
          id: "hsCode",
          label: "海关编码",
          type: "text",
        },
        {
          id: "invoiceItemName",
          label: "开票品名",
          type: "text",
        },
        {
          id: "invoiceNo",
          label: "发票号",
          type: "text",
        },
        {
          id: "taxInvoiceNo",
          label: "税票编号",
          type: "text",
        },
        {
          id: "invoiceQuantity",
          label: "发票登记数量",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "invoiceUnitPrice",
          label: "开票单价",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "taxRate",
          label: "税率",
          type: "number",
        },
        {
          id: "noticeInvoiceQty",
          label: "通知开票数量",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "shippingQuantity",
          label: "出运数量",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "shippingInvoiceNo",
          label: "出运发票号",
          type: "text",
        },
        {
          id: "customsUnit",
          label: "海关计量单位",
          type: "text",
        },
        {
          id: "customsQuantity",
          label: "报关数量",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "customsName",
          label: "报关品名",
          type: "text",
        },
        {
          id: "totalPurchaseQty",
          label: "总采购数量",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "purchaseTaxPrice",
          label: "采购含税单价",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "purchaseCurrency",
          label: "采购币种",
          type: "text",
        },
        {
          id: "purchaseTaxRate",
          label: "采购税率",
          type: "number",
        },
        {
          id: "purchaseContractCode",
          label: "采购合同编号",
          type: "text",
        },
        {
          id: "purchaseContractItemId",
          label: "采购合同明细主键",
          type: "text",
        },
        {
          id: "salesContractCode",
          label: "销售合同号",
          type: "text",
        },
        {
          id: "merchandiser",
          label: "跟单员",
          type: "text",
        },
        {
          id: "supplierCode",
          label: "供应商编号",
          type: "text",
        },
        {
          id: "supplierName",
          label: "供应商名称",
          type: "text",
        },
        {
          id: "invoicingNoticeId",
          label: "开票通知主键",
          type: "text",
        },
        {
          id: "invoicingNoticeCode",
          label: "开票通知编号",
          type: "text",
        },
        {
          id: "documentaryRegistrationId",
          label: "跟单登记主键",
          type: "text",
        },
        {
          id: "salesDetailId",
          label: "销售明细主键",
          type: "text",
        },
      ],
    },
  ],
}

// ============================================================
// 变更规则
// ============================================================

/** 发票登记变更规则 */
export const invoiceRegistrationChangeRule: ChangeRule = {
  typeId: "invoice_registration",
  watchFields: [
    "master.status",
    "master.invoiceAmount",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 发票登记取消
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
          description: `发票登记已取消, 下游单据 ${downstream.docNumber} 建议同步处理。`,
        })
      }
    }

    // 发票金额变更
    if (oldDoc.masterData.invoiceAmount !== newDoc.masterData.invoiceAmount) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "invoiceAmount",
          description: `发票登记发票金额变更 (${oldDoc.masterData.invoiceAmount} → ${newDoc.masterData.invoiceAmount})。`,
        })
      }
    }

    return impacts
  },
}
