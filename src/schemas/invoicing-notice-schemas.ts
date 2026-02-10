/**
 * Invoicing Notice Schemas
 *
 * 开票通知单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 开票通知 (Invoicing Notice)
// ============================================================

export const invoicingNoticeSchema: DocumentSchema = {
  typeId: "invoicing_notice",
  typeName: "开票通知",
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
      id: "entryDate",
      label: "登票日期",
      type: "date",
      required: true,
      group: "基本信息",
    },
    {
      id: "status",
      label: "状态",
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
      id: "sourceType",
      label: "来源类型",
      type: "select",
      options: [
        { label: "自动", value: "AUTO" },
        { label: "手工", value: "MANUAL" },
      ],
      defaultValue: "AUTO",
      group: "基本信息",
    },
    {
      id: "isManual",
      label: "手工开票通知",
      type: "checkbox",
      defaultValue: false,
      group: "基本信息",
    },

    // === 流程信息 ===
    {
      id: "processInstanceId",
      label: "流程实例主键",
      type: "text",
      readOnly: true,
      group: "流程信息",
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
      group: "流程信息",
    },

    // === 关联信息 ===
    {
      id: "orderLinkCode",
      label: "订单链路编号",
      type: "text",
      readOnly: true,
      group: "关联信息",
    },
    {
      id: "shippingInvoiceNo",
      label: "出运发票号",
      type: "text",
      group: "关联信息",
    },
    {
      id: "shippingOrderNo",
      label: "出运单号",
      type: "text",
      group: "关联信息",
    },
    {
      id: "purchaseOrderNo",
      label: "采购单号",
      type: "text",
      group: "关联信息",
    },

    // === 公司信息 ===
    {
      id: "companyId",
      label: "归属公司主键",
      type: "text",
      group: "公司信息",
    },
    {
      id: "companyName",
      label: "归属公司名称",
      type: "text",
      group: "公司信息",
    },

    // === 供应商信息 ===
    {
      id: "supplierId",
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

    // === 人员信息 ===
    {
      id: "entryPerson",
      label: "录入人",
      type: "text",
      group: "人员信息",
    },
    {
      id: "entryPersonId",
      label: "录入人ID",
      type: "text",
      group: "人员信息",
    },
    {
      id: "merchandiser",
      label: "跟单员",
      type: "text",
      group: "人员信息",
    },
    {
      id: "merchandiserId",
      label: "跟单员ID",
      type: "text",
      group: "人员信息",
    },

    // === 发票信息 ===
    {
      id: "invoiceNo",
      label: "发票编号",
      type: "text",
      group: "发票信息",
    },
    {
      id: "invoiceDate",
      label: "出运日期",
      type: "date",
      group: "发票信息",
    },
    {
      id: "invoiceStatus",
      label: "开票状态",
      type: "select",
      options: [
        { label: "未开票", value: "NOT_INVOICED" },
        { label: "部分开票", value: "PARTIAL" },
        { label: "已开票", value: "INVOICED" },
      ],
      group: "发票信息",
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
      group: "发票信息",
    },
    {
      id: "printDate",
      label: "打印日期",
      type: "date",
      group: "发票信息",
    },

    // === 备注 ===
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "备注",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "开票通知明细",
      editable: true,
      fields: [
        {
          id: "productId",
          label: "产品主键",
          type: "text",
        },
        {
          id: "skuCode",
          label: "SKU编号",
          type: "text",
        },
        {
          id: "productName",
          label: "产品名称",
          type: "text",
          required: true,
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
          id: "specification",
          label: "规格",
          type: "text",
        },
        {
          id: "outerBoxQuantity",
          label: "外箱装量",
          type: "number",
        },
        {
          id: "isSeparateBox",
          label: "是否分箱",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "quantityBefore",
          label: "转换前数量",
          type: "number",
        },
        {
          id: "noticeQuantity",
          label: "通知开票数量",
          type: "number",
          required: true,
        },
        {
          id: "customsQuantity",
          label: "报关数量",
          type: "number",
        },
        {
          id: "totalPurchaseQty",
          label: "总采购数量",
          type: "number",
        },
        {
          id: "purchaseTaxPrice",
          label: "采购含税单价",
          type: "number",
        },
        {
          id: "invoiceUnitPrice",
          label: "开票单价",
          type: "number",
        },
        {
          id: "taxRate",
          label: "税率(%)",
          type: "number",
        },
        {
          id: "hsCode",
          label: "海关编码",
          type: "text",
        },
        {
          id: "customsUnit",
          label: "海关计量单位",
          type: "text",
        },
        {
          id: "invoiceProductName",
          label: "开票品名",
          type: "text",
        },
        {
          id: "purchaseContractId",
          label: "采购合同编号",
          type: "text",
        },
        {
          id: "purchaseSeq",
          label: "采购序号",
          type: "number",
        },
        {
          id: "salesContractCode",
          label: "销售合同编号",
          type: "text",
        },
        {
          id: "customerId",
          label: "客户编号",
          type: "text",
        },
        {
          id: "customerName",
          label: "客户名称",
          type: "text",
        },
        {
          id: "purchaseCurrency",
          label: "采购币种",
          type: "select",
          options: [
            { label: "CNY", value: "CNY" },
            { label: "USD", value: "USD" },
          ],
          defaultValue: "CNY",
        },
        {
          id: "invoicingStatus",
          label: "开票状态",
          type: "select",
          options: [
            { label: "未开票", value: "NOT_INVOICED" },
            { label: "已开票", value: "INVOICED" },
          ],
        },
        {
          id: "invoiceRegStatus",
          label: "发票登记状态",
          type: "select",
          options: [
            { label: "未登记", value: "NOT_REGISTERED" },
            { label: "已登记", value: "REGISTERED" },
          ],
        },
        {
          id: "invoiceRegQty",
          label: "发票登记数量",
          type: "number",
        },
        {
          id: "isManual",
          label: "手工开票通知",
          type: "checkbox",
          defaultValue: false,
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
// 变更规则
// ============================================================

/** 开票通知变更规则 */
export const invoicingNoticeChangeRule: ChangeRule = {
  typeId: "invoicing_notice",
  watchFields: [
    "master.status",
    "master.invoiceStatus",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 开票状态变更
    if (
      oldDoc.masterData.invoiceStatus !==
      newDoc.masterData.invoiceStatus
    ) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "invoiceStatus",
          description: `开票通知状态变更 (${oldDoc.masterData.invoiceStatus} → ${newDoc.masterData.invoiceStatus}), 请核对下游单据。`,
        })
      }
    }

    // 开票通知取消
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
          description: `开票通知已取消, 下游单据 ${downstream.docNumber} 建议同步处理。`,
        })
      }
    }

    return impacts
  },
}
