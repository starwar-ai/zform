/**
 * Payment Apply Schemas
 *
 * 付款申请单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 付款申请 (Payment Apply)
// ============================================================

export const paymentApplySchema: DocumentSchema = {
  typeId: "payment_apply",
  typeName: "付款申请",
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
      id: "applyDate",
      label: "申请日期",
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
      id: "applyType",
      label: "申请类型",
      type: "select",
      options: [
        { label: "采购付款", value: "PURCHASE" },
        { label: "费用付款", value: "EXPENSE" },
        { label: "其他", value: "OTHER" },
      ],
      defaultValue: "PURCHASE",
      group: "基本信息",
    },

    // === 流程信息 ===
    {
      id: "processInstanceId",
      label: "流程实例编号",
      type: "text",
      readOnly: true,
      group: "流程信息",
    },
    {
      id: "processInstanceStatus",
      label: "流程实例状态",
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
      id: "paymentPlanId",
      label: "付款计划ID",
      type: "text",
      group: "关联信息",
    },

    // === 申请方信息 ===
    {
      id: "applicantId",
      label: "申请人ID",
      type: "text",
      group: "申请方信息",
    },
    {
      id: "applicantName",
      label: "申请人",
      type: "text",
      group: "申请方信息",
    },
    {
      id: "buyerId",
      label: "采购员ID",
      type: "text",
      group: "申请方信息",
    },
    {
      id: "buyerName",
      label: "采购员",
      type: "text",
      group: "申请方信息",
    },

    // === 下单主体信息 ===
    {
      id: "orderSubjectId",
      label: "下单主体主键",
      type: "text",
      group: "下单主体",
    },
    {
      id: "orderSubjectName",
      label: "下单主体",
      type: "text",
      group: "下单主体",
    },

    // === 供应商信息 ===
    {
      id: "supplierId",
      label: "应付供应商主键",
      type: "text",
      group: "供应商信息",
    },
    {
      id: "supplierCode",
      label: "应付供应商编码",
      type: "text",
      group: "供应商信息",
    },
    {
      id: "supplierName",
      label: "应付供应商名称",
      type: "text",
      group: "供应商信息",
    },

    // === 付款信息 ===
    {
      id: "paymentMethodId",
      label: "付款方式ID",
      type: "text",
      group: "付款信息",
    },
    {
      id: "paymentMethodName",
      label: "付款方式名称",
      type: "text",
      group: "付款信息",
    },
    {
      id: "paymentType",
      label: "支付方式",
      type: "select",
      options: [
        { label: "银行转账", value: "BANK_TRANSFER" },
        { label: "现金", value: "CASH" },
        { label: "支票", value: "CHECK" },
        { label: "承兑汇票", value: "ACCEPTANCE" },
      ],
      group: "付款信息",
    },
    {
      id: "acceptanceDays",
      label: "承兑天数",
      type: "number",
      group: "付款信息",
    },
    {
      id: "applyPaymentDate",
      label: "申请付款日",
      type: "date",
      group: "付款信息",
    },
    {
      id: "actualPaymentDate",
      label: "付款日期",
      type: "date",
      group: "付款信息",
    },
    {
      id: "payerId",
      label: "付款人ID",
      type: "text",
      group: "付款信息",
    },
    {
      id: "payerName",
      label: "付款人",
      type: "text",
      group: "付款信息",
    },

    // === 金额信息 ===
    {
      id: "applyTotalAmount",
      label: "申请总金额",
      type: "number",
      required: true,
      group: "金额信息",
    },
    {
      id: "goodsTotalAmount",
      label: "货款总金额",
      type: "number",
      group: "金额信息",
    },
    {
      id: "adjustmentAmount",
      label: "加减项总金额",
      type: "number",
      defaultValue: 0,
      group: "金额信息",
    },
    {
      id: "actualPaymentAmount",
      label: "实际支付金额",
      type: "number",
      readOnly: true,
      group: "金额信息",
    },

    // === 币种与账户 ===
    {
      id: "currency",
      label: "应付币种",
      type: "select",
      options: [
        { label: "CNY", value: "CNY" },
        { label: "USD", value: "USD" },
        { label: "EUR", value: "EUR" },
      ],
      defaultValue: "CNY",
      group: "币种账户",
    },
    {
      id: "taxRate",
      label: "税率(%)",
      type: "number",
      group: "币种账户",
    },
    {
      id: "bankAccount",
      label: "银行账号",
      type: "text",
      group: "币种账户",
    },
    {
      id: "bankName",
      label: "开户行",
      type: "text",
      group: "币种账户",
    },

    // === 供应商银行信息 ===
    {
      id: "supplierBankName",
      label: "供应商银行",
      type: "text",
      group: "供应商银行",
    },
    {
      id: "supplierBankAccount",
      label: "供应商银行账号",
      type: "text",
      group: "供应商银行",
    },
    {
      id: "supplierBankContact",
      label: "供应商开户行联系人",
      type: "text",
      group: "供应商银行",
    },

    // === 状态信息 ===
    {
      id: "paymentStatus",
      label: "支付状态",
      type: "select",
      options: [
        { label: "未支付", value: "UNPAID" },
        { label: "部分支付", value: "PARTIAL" },
        { label: "已支付", value: "PAID" },
      ],
      defaultValue: "UNPAID",
      group: "状态信息",
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
      group: "状态信息",
    },

    // === 作废信息 ===
    {
      id: "voidReason",
      label: "作废原因",
      type: "textarea",
      span: 4,
      group: "作废信息",
    },
    {
      id: "voidTime",
      label: "作废时间",
      type: "date",
      readOnly: true,
      group: "作废信息",
    },
    {
      id: "voidBy",
      label: "作废人",
      type: "text",
      readOnly: true,
      group: "作废信息",
    },

    // === 备注与附件 ===
    {
      id: "remark",
      label: "申请备注",
      type: "textarea",
      span: 4,
      group: "备注附件",
    },
    {
      id: "remarkType",
      label: "付款备注类型",
      type: "text",
      group: "备注附件",
    },
    {
      id: "attachments",
      label: "附件",
      type: "text",
      group: "备注附件",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "付款申请明细",
      editable: true,
      fields: [
        {
          id: "purchaseContractId",
          label: "采购合同编号",
          type: "text",
          required: true,
        },
        {
          id: "purchaseContractItemId",
          label: "采购合同明细ID",
          type: "text",
        },
        {
          id: "paidAmount",
          label: "已付金额",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "appliedAmount",
          label: "已申请金额",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "currentApplyAmount",
          label: "本次请款金额",
          type: "number",
          required: true,
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
        },
        {
          id: "paymentStep",
          label: "付款步骤",
          type: "text",
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

/** 付款申请变更规则 */
export const paymentApplyChangeRule: ChangeRule = {
  typeId: "payment_apply",
  watchFields: [
    "master.status",
    "master.paymentStatus",
    "master.actualPaymentAmount",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 支付状态变更
    if (
      oldDoc.masterData.paymentStatus !==
      newDoc.masterData.paymentStatus
    ) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "paymentStatus",
          description: `付款申请支付状态变更 (${oldDoc.masterData.paymentStatus} → ${newDoc.masterData.paymentStatus})。`,
        })
      }
    }

    // 付款申请取消
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
          description: `付款申请已取消, 下游单据 ${downstream.docNumber} 建议同步处理。`,
        })
      }
    }

    // 实际支付金额变更
    if (oldDoc.masterData.actualPaymentAmount !== newDoc.masterData.actualPaymentAmount) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "actualPaymentAmount",
          description: `付款申请实际支付金额变更 (${oldDoc.masterData.actualPaymentAmount} → ${newDoc.masterData.actualPaymentAmount})。`,
        })
      }
    }

    return impacts
  },
}
