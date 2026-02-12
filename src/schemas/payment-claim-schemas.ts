/**
 * Payment Claim Schemas
 *
 * 回款认领单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 回款认领 (Payment Claim)
// ============================================================

export const paymentClaimSchema: DocumentSchema = {
  typeId: "payment_claim",
  typeName: "回款认领",
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
      id: "claimType",
      label: "认领类型",
      type: "select",
      options: [
        { label: "回款认领", value: "PAYMENT_CLAIM" },
        { label: "其他收费", value: "OTHER_FEE" },
      ],
      defaultValue: "PAYMENT_CLAIM",
      group: "基本信息",
    },
    {
      id: "otherFeeType",
      label: "其他收费类型",
      type: "select",
      options: [
        { label: "证书费", value: "CERTIFICATE_FEE" },
        { label: "模具费", value: "MOLD_FEE" },
        { label: "样品费", value: "SAMPLE_FEE" },
        { label: "快递费", value: "EXPRESS_FEE" },
        { label: "验货费", value: "INSPECTION_FEE" },
      ],
      group: "基本信息",
    },
    {
      id: "source",
      label: "来源",
      type: "text",
      group: "基本信息",
    },

    // === 合同信息 ===
    {
      id: "purchaseContractCode",
      label: "库存采购合同号",
      type: "text",
      group: "合同信息",
    },
    {
      id: "salesContractCode",
      label: "订单合同号",
      type: "text",
      group: "合同信息",
    },
    {
      id: "salesType",
      label: "销售类型",
      type: "select",
      options: [
        { label: "内销", value: "DOMESTIC" },
        { label: "外销", value: "EXPORT" },
      ],
      group: "合同信息",
    },

    // === 发票信息 ===
    {
      id: "shippingInvoiceNo",
      label: "出运发票号",
      type: "text",
      group: "发票信息",
    },
    {
      id: "invoiceNo",
      label: "发票号",
      type: "text",
      group: "发票信息",
    },

    // === 收款信息 ===
    {
      id: "receiptRegistrationCode",
      label: "收款单编号",
      type: "text",
      group: "收款信息",
    },
    {
      id: "financialFee",
      label: "财务费用",
      type: "number",
      group: "收款信息",
    },

    // === 客户信息 ===
    {
      id: "customerCode",
      label: "客户编号",
      type: "text",
      group: "客户信息",
    },
    {
      id: "customerName",
      label: "客户名称",
      type: "text",
      group: "客户信息",
    },

    // === 币种与收款方式 ===
    {
      id: "orderCurrency",
      label: "订单币别",
      type: "select",
      options: [
        { label: "CNY", value: "CNY" },
        { label: "USD", value: "USD" },
        { label: "EUR", value: "EUR" },
      ],
      group: "币种收款",
    },
    {
      id: "paymentMethodId",
      label: "收款方式ID",
      type: "text",
      group: "币种收款",
    },
    {
      id: "paymentMethodName",
      label: "收款方式名称",
      type: "text",
      group: "币种收款",
    },

    // === 金额信息 ===
    {
      id: "receivableAmount",
      label: "应收金额",
      type: "number",
      group: "金额信息",
    },
    {
      id: "receivedAmount",
      label: "已收金额",
      type: "number",
      group: "金额信息",
    },
    {
      id: "currentClaimAmountEntry",
      label: "本次入账币种认领金额",
      type: "number",
      required: true,
      group: "金额信息",
    },
    {
      id: "currentClaimAmountOrder",
      label: "订单币种认领金额",
      type: "number",
      group: "金额信息",
    },
    {
      id: "differenceAmount",
      label: "差异总金额",
      type: "number",
      group: "金额信息",
    },
    {
      id: "claimDifference",
      label: "认领差异",
      type: "number",
      group: "金额信息",
    },

    // === 完成标识 ===
    {
      id: "paymentCompleteFlag",
      label: "收款完成标识",
      type: "checkbox",
      defaultValue: false,
      group: "完成状态",
    },

    // === 认领信息 ===
    {
      id: "claimEmployee",
      label: "认领员工",
      type: "text",
      group: "认领信息",
    },
    {
      id: "claimDate",
      label: "认领日期",
      type: "date",
      group: "认领信息",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "认领明细",
      editable: true,
      fields: [
        {
          id: "receiptRegistrationId",
          label: "收款登记ID",
          type: "text",
        },
        {
          id: "claimAmount",
          label: "认领金额",
          type: "number",
          required: true,
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

/** 回款认领变更规则 */
export const paymentClaimChangeRule: ChangeRule = {
  typeId: "payment_claim",
  watchFields: [
    "master.status",
    "master.paymentCompleteFlag",
    "master.currentClaimAmountEntry",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 收款完成标识变更
    if (
      oldDoc.masterData.paymentCompleteFlag !==
      newDoc.masterData.paymentCompleteFlag
    ) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "paymentCompleteFlag",
          description: `回款认领收款完成标识变更。`,
        })
      }
    }

    // 回款认领取消
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
          description: `回款认领已取消, 下游单据 ${downstream.docNumber} 建议同步处理。`,
        })
      }
    }

    // 认领金额变更
    if (oldDoc.masterData.currentClaimAmountEntry !== newDoc.masterData.currentClaimAmountEntry) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "currentClaimAmountEntry",
          description: `回款认领认领金额变更 (${oldDoc.masterData.currentClaimAmountEntry} → ${newDoc.masterData.currentClaimAmountEntry})。`,
        })
      }
    }

    return impacts
  },
}
