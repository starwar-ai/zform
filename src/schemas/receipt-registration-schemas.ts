/**
 * Receipt Registration Schemas
 *
 * 收款登记单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 收款登记 (Receipt Registration)
// ============================================================

export const receiptRegistrationSchema: DocumentSchema = {
  typeId: "receipt_registration",
  typeName: "收款登记",
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
      id: "registerDate",
      label: "登记日期",
      type: "date",
      group: "基本信息",
    },
    {
      id: "registerBy",
      label: "登记人",
      type: "text",
      group: "基本信息",
    },

    // === 入账单位信息 ===
    {
      id: "accountId",
      label: "入账单位ID",
      type: "text",
      group: "入账单位",
    },
    {
      id: "accountName",
      label: "入账单位名称",
      type: "text",
      group: "入账单位",
    },
    {
      id: "companyTitle",
      label: "公司抬头",
      type: "text",
      group: "入账单位",
    },

    // === 银行信息 ===
    {
      id: "bankEntryDate",
      label: "银行入账日期",
      type: "date",
      group: "银行信息",
    },
    {
      id: "bankName",
      label: "银行",
      type: "text",
      group: "银行信息",
    },
    {
      id: "bankAccount",
      label: "银行账号",
      type: "text",
      group: "银行信息",
    },
    {
      id: "bankAddress",
      label: "开户行地址",
      type: "text",
      group: "银行信息",
    },
    {
      id: "bankContact",
      label: "开户行联系人",
      type: "text",
      group: "银行信息",
    },
    {
      id: "bankCode",
      label: "银行行号",
      type: "text",
      group: "银行信息",
    },

    // === 入账金额信息 ===
    {
      id: "currency",
      label: "入账币别",
      type: "select",
      options: [
        { label: "CNY", value: "CNY" },
        { label: "USD", value: "USD" },
        { label: "EUR", value: "EUR" },
      ],
      defaultValue: "CNY",
      group: "金额信息",
    },
    {
      id: "entryAmount",
      label: "入账金额",
      type: "number",
      required: true,
      group: "金额信息",
    },
    {
      id: "claimedAmount",
      label: "已认领金额",
      type: "number",
      readOnly: true,
      group: "金额信息",
    },

    // === 客户信息 ===
    {
      id: "customerId",
      label: "客户ID",
      type: "text",
      group: "客户信息",
    },
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

    // === 业务员信息 ===
    {
      id: "salesPerson",
      label: "业务员",
      type: "text",
      group: "业务员信息",
    },
    {
      id: "claimSalesPerson",
      label: "认领业务员",
      type: "text",
      group: "业务员信息",
    },

    // === 认领信息 ===
    {
      id: "claimStatus",
      label: "认领状态",
      type: "select",
      options: [
        { label: "未认领", value: "UNCLAIMED" },
        { label: "部分认领", value: "PARTIAL" },
        { label: "已认领", value: "CLAIMED" },
      ],
      defaultValue: "UNCLAIMED",
      group: "认领信息",
    },
    {
      id: "claimDate",
      label: "认领日期",
      type: "date",
      group: "认领信息",
    },

    // === 关联信息 ===
    {
      id: "salesContractCode",
      label: "关联外销合同号",
      type: "text",
      group: "关联信息",
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
      label: "客户认领明细",
      editable: true,
      fields: [
        {
          id: "customerCode",
          label: "客户编号",
          type: "text",
        },
        {
          id: "customerName",
          label: "客户名称",
          type: "text",
        },
        {
          id: "claimAmount",
          label: "认领金额",
          type: "number",
          required: true,
        },
        {
          id: "claimSalesPerson",
          label: "认领业务员",
          type: "text",
        },
        {
          id: "claimDate",
          label: "认领日期",
          type: "date",
        },
        {
          id: "salesContractCode",
          label: "关联合同号",
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

/** 收款登记变更规则 */
export const receiptRegistrationChangeRule: ChangeRule = {
  typeId: "receipt_registration",
  watchFields: [
    "master.status",
    "master.claimStatus",
    "master.claimedAmount",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 认领状态变更
    if (
      oldDoc.masterData.claimStatus !==
      newDoc.masterData.claimStatus
    ) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "claimStatus",
          description: `收款登记认领状态变更 (${oldDoc.masterData.claimStatus} → ${newDoc.masterData.claimStatus})。`,
        })
      }
    }

    // 收款登记取消
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
          description: `收款登记已取消, 下游单据 ${downstream.docNumber} 建议同步处理。`,
        })
      }
    }

    // 已认领金额变更
    if (oldDoc.masterData.claimedAmount !== newDoc.masterData.claimedAmount) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "claimedAmount",
          description: `收款登记已认领金额变更 (${oldDoc.masterData.claimedAmount} → ${newDoc.masterData.claimedAmount})。`,
        })
      }
    }

    return impacts
  },
}
