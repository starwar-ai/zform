/**
 * Payment Schemas
 *
 * 付款单单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 付款单 (Payment)
// ============================================================

export const paymentSchema: DocumentSchema = {
  typeId: "payment",
  typeName: "付款单",
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
        { label: "已付款", value: "PAID" },
        { label: "已取消", value: "CANCELLED" },
      ],
      defaultValue: "DRAFT",
      required: true,
      group: "基本信息",
    },
    {
      id: "businessType",
      label: "业务类型",
      type: "select",
      options: [
        { label: "采购付款", value: "PURCHASE" },
        { label: "费用付款", value: "EXPENSE" },
        { label: "其他", value: "OTHER" },
      ],
      group: "基本信息",
    },
    {
      id: "businessCode",
      label: "业务编号",
      type: "text",
      group: "基本信息",
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
      id: "applyCode",
      label: "申请单编号",
      type: "text",
      readOnly: true,
      group: "关联信息",
    },
    {
      id: "paymentCode",
      label: "支付编码",
      type: "text",
      group: "关联信息",
    },

    // === 内部法人单位 ===
    {
      id: "internalLegalEntity",
      label: "内部法人单位",
      type: "text",
      group: "法人单位",
    },

    // === 付款银行信息 ===
    {
      id: "paymentBankAccount",
      label: "付款银行账户",
      type: "text",
      group: "付款银行",
    },
    {
      id: "paymentBank",
      label: "付款银行",
      type: "text",
      group: "付款银行",
    },
    {
      id: "bankName",
      label: "开户行",
      type: "text",
      group: "付款银行",
    },
    {
      id: "bankAccount",
      label: "银行账号",
      type: "text",
      group: "付款银行",
    },
    {
      id: "bankAddress",
      label: "开户行地址",
      type: "text",
      group: "付款银行",
    },
    {
      id: "bankContact",
      label: "开户行联系人",
      type: "text",
      group: "付款银行",
    },
    {
      id: "bankCode",
      label: "银行行号",
      type: "text",
      group: "付款银行",
    },

    // === 对方账户信息 ===
    {
      id: "counterpartyAccount",
      label: "对方账号",
      type: "text",
      group: "对方账户",
    },
    {
      id: "counterpartyBank",
      label: "对方银行",
      type: "text",
      group: "对方账户",
    },
    {
      id: "counterpartyAccountName",
      label: "对方账户",
      type: "text",
      group: "对方账户",
    },

    // === 支付对象信息 ===
    {
      id: "payeeType",
      label: "支付对象类型",
      type: "select",
      options: [
        { label: "供应商", value: "SUPPLIER" },
        { label: "客户", value: "CUSTOMER" },
        { label: "其他", value: "OTHER" },
      ],
      group: "支付对象",
    },
    {
      id: "payeeCode",
      label: "支付对象编号",
      type: "text",
      group: "支付对象",
    },

    // === 付款信息 ===
    {
      id: "paymentMethod",
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
      id: "applyPaymentAmount",
      label: "申请支付金额",
      type: "number",
      required: true,
      group: "付款信息",
    },

    // === 支付金额信息 ===
    {
      id: "paymentAmount",
      label: "支付金额",
      type: "number",
      group: "支付金额",
    },
    {
      id: "paidAmount",
      label: "已付金额",
      type: "number",
      readOnly: true,
      group: "支付金额",
    },
    {
      id: "paymentStatus",
      label: "支付状态",
      type: "select",
      options: [
        { label: "未支付", value: "NOT_PAID" },
        { label: "部分支付", value: "PARTIAL" },
        { label: "已支付", value: "PAID" },
      ],
      defaultValue: "NOT_PAID",
      group: "支付金额",
    },
    {
      id: "paymentDate",
      label: "支付日期",
      type: "date",
      group: "支付金额",
    },
    {
      id: "cashier",
      label: "出纳员",
      type: "text",
      group: "支付金额",
    },

    // === 审核信息 ===
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
      group: "审核信息",
    },
    {
      id: "finalApprover",
      label: "最终审批人",
      type: "text",
      readOnly: true,
      group: "审核信息",
    },
    {
      id: "approvalTime",
      label: "审批时间",
      type: "date",
      readOnly: true,
      group: "审核信息",
    },

    // === 打印信息 ===
    {
      id: "printStatus",
      label: "打印状态",
      type: "select",
      options: [
        { label: "未打印", value: "NOT_PRINTED" },
        { label: "已打印", value: "PRINTED" },
      ],
      defaultValue: "NOT_PRINTED",
      group: "打印信息",
    },
    {
      id: "printCount",
      label: "打印次数",
      type: "number",
      readOnly: true,
      group: "打印信息",
    },

    // === 申请信息 ===
    {
      id: "applicantName",
      label: "申请人",
      type: "text",
      group: "申请信息",
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
      label: "备注",
      type: "textarea",
      span: 4,
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
      label: "付款明细",
      editable: true,
      fields: [
        {
          id: "paymentApplyCode",
          label: "付款申请编号",
          type: "text",
        },
        {
          id: "applyAmount",
          label: "申请金额",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "paidAmount",
          label: "已付金额",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "thisAmount",
          label: "本次付款金额",
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

/** 付款单变更规则 */
export const paymentChangeRule: ChangeRule = {
  typeId: "payment",
  watchFields: [
    "master.status",
    "master.paymentStatus",
    "master.paymentAmount",
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
          description: `付款单支付状态变更 (${oldDoc.masterData.paymentStatus} → ${newDoc.masterData.paymentStatus})。`,
        })
      }
    }

    // 付款单取消
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
          description: `付款单已取消, 下游单据 ${downstream.docNumber} 建议同步处理。`,
        })
      }
    }

    // 支付金额变更
    if (oldDoc.masterData.paymentAmount !== newDoc.masterData.paymentAmount) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "paymentAmount",
          description: `付款单支付金额变更 (${oldDoc.masterData.paymentAmount} → ${newDoc.masterData.paymentAmount})。`,
        })
      }
    }

    return impacts
  },
}
