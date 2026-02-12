/**
 * Quotation Schemas
 *
 * 报价单单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 报价单 (Quotation)
// ============================================================

export const quotationSchema: DocumentSchema = {
  typeId: "quotation",
  typeName: "报价单",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "报价单号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
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
        { label: "已拒绝", value: "REJECTED" },
        { label: "已过期", value: "EXPIRED" },
        { label: "已接受", value: "ACCEPTED" },
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

    // === 客户信息 ===
    {
      id: "customerId",
      label: "客户主键",
      type: "text",
      required: true,
      group: "客户信息",
    },
    {
      id: "customerCode",
      label: "客户编号",
      type: "text",
      required: true,
      group: "客户信息",
    },
    {
      id: "customerName",
      label: "客户名称",
      type: "text",
      group: "客户信息",
    },
    {
      id: "isNewCustomer",
      label: "是否新客户",
      type: "checkbox",
      defaultValue: false,
      group: "客户信息",
    },
    {
      id: "customerContactId",
      label: "客户联系人主键",
      type: "text",
      group: "客户信息",
    },
    {
      id: "customerContactName",
      label: "客户联系人名称",
      type: "text",
      group: "客户信息",
    },

    // === 国家信息 ===
    {
      id: "countryId",
      label: "国家ID",
      type: "text",
      group: "国家信息",
    },
    {
      id: "countryName",
      label: "国家名称",
      type: "text",
      group: "国家信息",
    },

    // === 内部法人单位 ===
    {
      id: "internalCompanyId",
      label: "内部法人单位主键",
      type: "text",
      group: "内部法人",
    },
    {
      id: "internalCompanyName",
      label: "内部法人单位名称",
      type: "text",
      group: "内部法人",
    },

    // === 出运口岸 ===
    {
      id: "departurePortId",
      label: "出运口岸主键",
      type: "text",
      group: "物流信息",
    },
    {
      id: "departurePortName",
      label: "出运口岸名称",
      type: "text",
      group: "物流信息",
    },

    // === 交易信息 ===
    {
      id: "currency",
      label: "币种",
      type: "select",
      options: [
        { label: "USD", value: "USD" },
        { label: "CNY", value: "CNY" },
        { label: "EUR", value: "EUR" },
        { label: "GBP", value: "GBP" },
        { label: "JPY", value: "JPY" },
      ],
      defaultValue: "USD",
      required: true,
      group: "交易信息",
    },
    {
      id: "priceTerms",
      label: "价格条款",
      type: "select",
      options: [
        { label: "FOB", value: "FOB" },
        { label: "CIF", value: "CIF" },
        { label: "CNF", value: "CNF" },
        { label: "EXW", value: "EXW" },
        { label: "DDU", value: "DDU" },
        { label: "DDP", value: "DDP" },
      ],
      group: "交易信息",
    },
    {
      id: "validUntil",
      label: "有效期止",
      type: "date",
      group: "交易信息",
    },

    // === 人员信息 ===
    {
      id: "salesPerson",
      label: "业务员",
      type: "text",
      required: true,
      group: "人员信息",
    },

    // === 流程信息 ===
    {
      id: "processInstanceId",
      label: "流程实例编号",
      type: "text",
      readOnly: true,
      group: "流程信息",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "报价明细",
      editable: true,
      fields: [
        {
          id: "lineNumber",
          label: "行号",
          type: "number",
          readOnly: true,
        },
        {
          id: "productCode",
          label: "产品编号",
          type: "text",
        },
        {
          id: "productNameCn",
          label: "中文名称",
          type: "text",
          required: true,
        },
        {
          id: "productNameEn",
          label: "英文名称",
          type: "text",
        },
        {
          id: "spec",
          label: "规格",
          type: "text",
        },
        {
          id: "productSpec",
          label: "产品规格",
          type: "text",
        },
        {
          id: "productImage",
          label: "图片",
          type: "text",
          placeholder: "图片URL",
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
          id: "isSelfOwnedProduct",
          label: "自营产品标记",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "isCustomerProduct",
          label: "客户产品标记",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "isSeparateContainer",
          label: "是否分箱",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "unitPrice",
          label: "报价",
          type: "number",
          required: true,
        },
        {
          id: "taxUnitPrice",
          label: "产品含税单价",
          type: "number",
        },
        {
          id: "minOrderQuantity",
          label: "起订量",
          type: "number",
        },
        {
          id: "commissionRate",
          label: "佣金比例(%)",
          type: "number",
        },
        // === 供应商信息 ===
        {
          id: "supplierId",
          label: "供应商ID",
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
        // === 柜型信息 ===
        {
          id: "bulkCargo",
          label: "散货",
          type: "number",
        },
        {
          id: "container20ft",
          label: "20尺柜",
          type: "number",
        },
        {
          id: "container40ft",
          label: "40尺柜",
          type: "number",
        },
        {
          id: "container40hq",
          label: "40尺高柜",
          type: "number",
        },
        // === 包装信息 ===
        {
          id: "packageMethod",
          label: "包装方式",
          type: "text",
        },
        {
          id: "innerBoxQty",
          label: "内箱装量",
          type: "number",
        },
        {
          id: "outerBoxQty",
          label: "外箱装量",
          type: "number",
        },
        {
          id: "boxCount",
          label: "箱数",
          type: "number",
        },
        {
          id: "outerBoxUnit",
          label: "外箱单位",
          type: "text",
        },
        {
          id: "outerBoxLength",
          label: "外箱长度",
          type: "number",
        },
        {
          id: "outerBoxWidth",
          label: "外箱宽度",
          type: "number",
        },
        {
          id: "outerBoxHeight",
          label: "外箱高度",
          type: "number",
        },
        {
          id: "outerBoxVolume",
          label: "外箱体积",
          type: "number",
        },
        {
          id: "outerBoxNetWeight",
          label: "外箱净重",
          type: "number",
        },
        {
          id: "outerBoxGrossWeight",
          label: "外箱毛重",
          type: "number",
        },
        // === 产品描述 ===
        {
          id: "productDescription",
          label: "产品描述",
          type: "text",
        },
        {
          id: "productDescriptionEn",
          label: "产品英文描述",
          type: "text",
        },
        {
          id: "hsCode",
          label: "HS编码",
          type: "text",
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
// 变更规则
// ============================================================

/** 报价单变更规则 */
export const quotationChangeRule: ChangeRule = {
  typeId: "quotation",
  watchFields: [
    "master.validUntil",
    "master.status",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 有效期变更
    if (
      oldDoc.masterData.validUntil !==
      newDoc.masterData.validUntil
    ) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "validUntil",
          description: `报价单有效期变更 (${oldDoc.masterData.validUntil} → ${newDoc.masterData.validUntil})。`,
        })
      }
    }

    // 报价单取消
    if (
      oldDoc.masterData.status !== "CANCELLED" &&
      newDoc.masterData.status === "CANCELLED"
    ) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "warning" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "status",
          description: `报价单已取消, 下游单据 ${downstream.docNumber} 可能需要同步处理。`,
        })
      }
    }

    return impacts
  },
}
