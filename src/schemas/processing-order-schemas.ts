/**
 * Processing Order Schemas
 *
 * 加工单单据定义
 * 用于描述"原材料/半成品 → 加工 → 成品/子成品"的生产加工流程
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 加工单 (Processing Order)
// ============================================================

export const processingOrderSchema: DocumentSchema = {
  typeId: "processing_order",
  typeName: "加工单",
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
      id: "salesContractCode",
      label: "销售合同号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "status",
      label: "加工单状态",
      type: "select",
      options: [
        { label: "草稿", value: "DRAFT" },
        { label: "待审核", value: "PENDING" },
        { label: "已审核", value: "APPROVED" },
        { label: "加工中", value: "IN_PROGRESS" },
        { label: "已完成", value: "COMPLETED" },
        { label: "已结案", value: "CLOSED" },
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
      id: "autoCreated",
      label: "是否自动生成",
      type: "checkbox",
      defaultValue: false,
      group: "基本信息",
    },

    // === 录入信息 ===
    {
      id: "entryUserId",
      label: "录入人ID",
      type: "text",
      readOnly: true,
      group: "录入信息",
    },
    {
      id: "entryUserName",
      label: "录入人姓名",
      type: "text",
      readOnly: true,
      group: "录入信息",
    },
    {
      id: "entryDate",
      label: "录入时间",
      type: "date",
      group: "录入信息",
    },

    // === 仓库信息 ===
    {
      id: "warehouseId",
      label: "仓库ID",
      type: "text",
      group: "仓库信息",
    },
    {
      id: "warehouseName",
      label: "仓库名称",
      type: "text",
      required: true,
      group: "仓库信息",
    },

    // === 主体信息 ===
    {
      id: "entityId",
      label: "主体ID",
      type: "text",
      group: "主体信息",
    },
    {
      id: "entityName",
      label: "主体名称",
      type: "text",
      group: "主体信息",
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

    // === 时间信息 ===
    {
      id: "completedTime",
      label: "完成加工时间",
      type: "date",
      readOnly: true,
      group: "时间信息",
    },
    {
      id: "closedTime",
      label: "结案时间",
      type: "date",
      readOnly: true,
      group: "时间信息",
    },
    {
      id: "closedReason",
      label: "结案原因",
      type: "textarea",
      span: 4,
      group: "时间信息",
    },

    // === 备注与附件 ===
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "备注信息",
    },
    {
      id: "attachments",
      label: "附件",
      type: "text",
      placeholder: "附件URL（JSON数组）",
      span: 4,
      group: "备注信息",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "加工成品",
      editable: true,
      fields: [
        {
          id: "lineNumber",
          label: "序号",
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
          label: "产品编号",
          type: "text",
          required: true,
        },
        {
          id: "customerProductNo",
          label: "客户产品编号",
          type: "text",
        },
        {
          id: "productName",
          label: "产品名称",
          type: "text",
          required: true,
        },
        {
          id: "quantity",
          label: "产品数量",
          type: "number",
          required: true,
          defaultValue: 0,
        },
        {
          id: "productImage",
          label: "产品图片",
          type: "text",
        },
        {
          id: "salesContractId",
          label: "销售合同ID",
          type: "text",
        },
        {
          id: "salesContractCode",
          label: "销售合同编号",
          type: "text",
        },
      ],
    },
    {
      id: "subItems",
      label: "加工原料",
      editable: true,
      fields: [
        {
          id: "lineNumber",
          label: "序号",
          type: "number",
          readOnly: true,
        },
        {
          id: "inventoryInfo",
          label: "库存信息",
          type: "text",
        },
        {
          id: "processingOrderItemId",
          label: "关联成品ID",
          type: "text",
        },
        {
          id: "productId",
          label: "产品ID",
          type: "text",
        },
        {
          id: "productCode",
          label: "产品编号",
          type: "text",
          required: true,
        },
        {
          id: "customerProductNo",
          label: "客户产品编号",
          type: "text",
        },
        {
          id: "productName",
          label: "产品名称",
          type: "text",
          required: true,
        },
        {
          id: "quantity",
          label: "产品数量",
          type: "number",
          required: true,
          defaultValue: 0,
        },
        {
          id: "ratio",
          label: "配比",
          type: "number",
          defaultValue: 1,
        },
        {
          id: "productImage",
          label: "产品图片",
          type: "text",
        },
      ],
    },
  ],
}

// ============================================================
// 变更规则
// ============================================================

export const processingOrderChangeRule: ChangeRule = {
  typeId: "processing_order",
  watchFields: ["master.customerName", "master.warehouseName"],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 客户变更影响
    if (
      oldDoc.masterData.customerName !== newDoc.masterData.customerName &&
      oldDoc.masterData.customerName
    ) {
      for (const downstream of downstreamDocs) {
        if (downstream.typeId === "sales_contract") {
          impacts.push({
            level: "warning" as const,
            affectedDocId: downstream.id,
            affectedTypeId: downstream.typeId,
            affectedDocNumber: downstream.docNumber,
            affectedField: "customerName",
            description: `加工单客户从 "${oldDoc.masterData.customerName}" 变更为 "${newDoc.masterData.customerName}"，可能影响销售合同`,
          })
        }
      }
    }

    // 仓库变更影响
    if (
      oldDoc.masterData.warehouseName !== newDoc.masterData.warehouseName &&
      oldDoc.masterData.warehouseName
    ) {
      impacts.push({
        level: "info" as const,
        affectedDocId: newDoc.id,
        affectedTypeId: newDoc.typeId,
        affectedDocNumber: newDoc.docNumber,
        affectedField: "warehouseName",
        description: `仓库从 "${oldDoc.masterData.warehouseName}" 变更为 "${newDoc.masterData.warehouseName}"`,
      })
    }

    return impacts
  },
}
