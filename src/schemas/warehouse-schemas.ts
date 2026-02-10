/**
 * Warehouse Management Schemas
 *
 * 仓库管理单据定义
 */

import type { DocumentSchema } from "@/core/types"

// ============================================================
// 入库单 (Warehouse Inbound)
// ============================================================

export const warehouseInboundSchema: DocumentSchema = {
  typeId: "warehouse_inbound",
  typeName: "入库单",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "单号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "internalCode",
      label: "内部编号",
      type: "text",
      group: "基本信息",
    },
    {
      id: "orderStatus",
      label: "单据状态",
      type: "select",
      options: [
        { label: "草稿", value: "DRAFT" },
        { label: "待处理", value: "PENDING" },
        { label: "处理中", value: "IN_PROGRESS" },
        { label: "已完成", value: "COMPLETED" },
        { label: "已取消", value: "CANCELLED" },
      ],
      defaultValue: "DRAFT",
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

    // === 来源信息 ===
    {
      id: "sourceCode",
      label: "来源编号",
      type: "text",
      group: "来源信息",
    },
    {
      id: "sourceType",
      label: "来源类型",
      type: "text",
      group: "来源信息",
    },
    {
      id: "noticeCode",
      label: "入库通知单号",
      type: "text",
      group: "来源信息",
    },
    {
      id: "shippingInvoiceNo",
      label: "出运发票号",
      type: "text",
      group: "来源信息",
    },

    // === 仓库信息 ===
    {
      id: "warehouseCode",
      label: "仓库编码",
      type: "text",
      group: "仓库信息",
    },
    {
      id: "warehouseName",
      label: "仓库名称",
      type: "text",
      group: "仓库信息",
    },
    {
      id: "orderTime",
      label: "入库时间",
      type: "date",
      group: "仓库信息",
    },

    // === 关联信息 ===
    {
      id: "salesContractCode",
      label: "销售合同号",
      type: "text",
      group: "关联信息",
    },
    {
      id: "companyName",
      label: "归属公司",
      type: "text",
      group: "关联信息",
    },

    // === 其他信息 ===
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
      group: "其他信息",
    },
    {
      id: "printCount",
      label: "打印次数",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "其他信息",
    },
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 2,
      group: "其他信息",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "入库明细",
      editable: true,
      fields: [
        { id: "lineNumber", label: "行号", type: "number", required: true },
        { id: "skuCode", label: "SKU编码", type: "text" },
        { id: "skuName", label: "SKU名称", type: "text" },
        { id: "selfOwnedProductNo", label: "自营货号", type: "text" },
        { id: "specification", label: "规格", type: "text" },
        { id: "batchNumber", label: "批次号", type: "text" },
        { id: "supplierName", label: "供应商", type: "text" },
        { id: "customerName", label: "客户", type: "text" },
        { id: "expectedQuantity", label: "应收数量", type: "number" },
        { id: "actualQuantity", label: "实收数量", type: "number" },
        { id: "expectedBoxes", label: "应收箱数", type: "number" },
        { id: "actualBoxes", label: "实收箱数", type: "number" },
        { id: "price", label: "价格", type: "number" },
        { id: "remark", label: "备注", type: "text" },
      ],
    },
  ],
}

// ============================================================
// 出库单 (Warehouse Outbound)
// ============================================================

export const warehouseOutboundSchema: DocumentSchema = {
  typeId: "warehouse_outbound",
  typeName: "出库单",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "单号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "internalCode",
      label: "内部编号",
      type: "text",
      group: "基本信息",
    },
    {
      id: "orderStatus",
      label: "单据状态",
      type: "select",
      options: [
        { label: "草稿", value: "DRAFT" },
        { label: "待处理", value: "PENDING" },
        { label: "处理中", value: "IN_PROGRESS" },
        { label: "已完成", value: "COMPLETED" },
        { label: "已取消", value: "CANCELLED" },
      ],
      defaultValue: "DRAFT",
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

    // === 来源信息 ===
    {
      id: "sourceCode",
      label: "来源编号",
      type: "text",
      group: "来源信息",
    },
    {
      id: "sourceType",
      label: "来源类型",
      type: "text",
      group: "来源信息",
    },
    {
      id: "noticeCode",
      label: "出库通知单号",
      type: "text",
      group: "来源信息",
    },
    {
      id: "shippingInvoiceNo",
      label: "出运发票号",
      type: "text",
      group: "来源信息",
    },

    // === 仓库信息 ===
    {
      id: "warehouseCode",
      label: "仓库编码",
      type: "text",
      group: "仓库信息",
    },
    {
      id: "warehouseName",
      label: "仓库名称",
      type: "text",
      group: "仓库信息",
    },
    {
      id: "orderTime",
      label: "出库时间",
      type: "date",
      group: "仓库信息",
    },

    // === 关联信息 ===
    {
      id: "salesContractCode",
      label: "销售合同号",
      type: "text",
      group: "关联信息",
    },
    {
      id: "companyName",
      label: "归属公司",
      type: "text",
      group: "关联信息",
    },

    // === 其他信息 ===
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
      group: "其他信息",
    },
    {
      id: "printCount",
      label: "打印次数",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "其他信息",
    },
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 2,
      group: "其他信息",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "出库明细",
      editable: true,
      fields: [
        { id: "lineNumber", label: "行号", type: "number", required: true },
        { id: "skuCode", label: "SKU编码", type: "text" },
        { id: "skuName", label: "SKU名称", type: "text" },
        { id: "selfOwnedProductNo", label: "自营货号", type: "text" },
        { id: "specification", label: "规格", type: "text" },
        { id: "batchNumber", label: "批次号", type: "text" },
        { id: "supplierName", label: "供应商", type: "text" },
        { id: "customerName", label: "客户", type: "text" },
        { id: "expectedQuantity", label: "应出数量", type: "number" },
        { id: "actualQuantity", label: "实出数量", type: "number" },
        { id: "expectedBoxes", label: "应出箱数", type: "number" },
        { id: "actualBoxes", label: "实出箱数", type: "number" },
        { id: "price", label: "价格", type: "number" },
        { id: "remark", label: "备注", type: "text" },
      ],
    },
  ],
}

// ============================================================
// 入库通知单 (Warehouse Inbound Notice)
// ============================================================

export const warehouseInboundNoticeSchema: DocumentSchema = {
  typeId: "warehouse_inbound_notice",
  typeName: "入库通知单",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "单号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "noticeStatus",
      label: "通知单状态",
      type: "select",
      options: [
        { label: "草稿", value: "DRAFT" },
        { label: "待处理", value: "PENDING" },
        { label: "处理中", value: "IN_PROGRESS" },
        { label: "已完成", value: "COMPLETED" },
        { label: "已取消", value: "CANCELLED" },
      ],
      defaultValue: "DRAFT",
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
    {
      id: "manualFlag",
      label: "手动标识",
      type: "checkbox",
      defaultValue: false,
      group: "基本信息",
    },

    // === 出运信息 ===
    {
      id: "shippingMethod",
      label: "出运方式",
      type: "text",
      group: "出运信息",
    },
    {
      id: "shippingInvoiceNo",
      label: "出运发票号",
      type: "text",
      group: "出运信息",
    },
    {
      id: "orderLinkCode",
      label: "订单链路编号",
      type: "text",
      group: "出运信息",
    },
    {
      id: "shippingDetailCode",
      label: "出运明细单号",
      type: "text",
      group: "出运信息",
    },
    {
      id: "billOfLadingNo",
      label: "提单号",
      type: "text",
      group: "出运信息",
    },

    // === 时间信息 ===
    {
      id: "noticeTime",
      label: "通知时间",
      type: "date",
      group: "时间信息",
    },
    {
      id: "expectedDate",
      label: "预计到货日期",
      type: "date",
      group: "时间信息",
    },
    {
      id: "warehouseEntryDate",
      label: "进仓日期",
      type: "date",
      group: "时间信息",
    },

    // === 关联信息 ===
    {
      id: "contractCodes",
      label: "合同编号列表",
      type: "text",
      group: "关联信息",
    },
    {
      id: "applicant",
      label: "申请人",
      type: "text",
      group: "关联信息",
    },
    {
      id: "companyName",
      label: "归属公司",
      type: "text",
      group: "关联信息",
    },

    // === 统计信息 ===
    {
      id: "totalVolume",
      label: "总体积",
      type: "number",
      readOnly: true,
      group: "统计信息",
    },
    {
      id: "totalGrossWeight",
      label: "总毛重",
      type: "number",
      readOnly: true,
      group: "统计信息",
    },

    // === 其他信息 ===
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
      group: "其他信息",
    },
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 2,
      group: "其他信息",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "入库通知明细",
      editable: true,
      fields: [
        { id: "lineNumber", label: "行号", type: "number", required: true },
        { id: "skuCode", label: "SKU编码", type: "text" },
        { id: "skuName", label: "SKU名称", type: "text" },
        { id: "warehouseCode", label: "仓库编码", type: "text" },
        { id: "warehouseName", label: "仓库名称", type: "text" },
        { id: "specification", label: "规格", type: "text" },
        { id: "supplierName", label: "供应商", type: "text" },
        { id: "customerName", label: "客户", type: "text" },
        { id: "pendingInboundQuantity", label: "待入库数量", type: "number" },
        { id: "inboundingQuantity", label: "入库中数量", type: "number" },
        { id: "actualInboundQuantity", label: "实际入库数量", type: "number" },
        { id: "expectedQuantity", label: "应收数量", type: "number" },
        { id: "expectedBoxes", label: "应收箱数", type: "number" },
        { id: "remark", label: "备注", type: "text" },
      ],
    },
  ],
}

// ============================================================
// 出库通知单 (Warehouse Outbound Notice)
// ============================================================

export const warehouseOutboundNoticeSchema: DocumentSchema = {
  typeId: "warehouse_outbound_notice",
  typeName: "出库通知单",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "单号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "noticeStatus",
      label: "通知单状态",
      type: "select",
      options: [
        { label: "草稿", value: "DRAFT" },
        { label: "待处理", value: "PENDING" },
        { label: "处理中", value: "IN_PROGRESS" },
        { label: "已完成", value: "COMPLETED" },
        { label: "已取消", value: "CANCELLED" },
      ],
      defaultValue: "DRAFT",
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
    {
      id: "manualFlag",
      label: "手动标识",
      type: "checkbox",
      defaultValue: false,
      group: "基本信息",
    },

    // === 出运信息 ===
    {
      id: "shippingMethod",
      label: "出运方式",
      type: "text",
      group: "出运信息",
    },
    {
      id: "shippingInvoiceNo",
      label: "出运发票号",
      type: "text",
      group: "出运信息",
    },
    {
      id: "orderLinkCode",
      label: "订单链路编号",
      type: "text",
      group: "出运信息",
    },
    {
      id: "shippingDetailCode",
      label: "出运明细单号",
      type: "text",
      group: "出运信息",
    },
    {
      id: "billOfLadingNo",
      label: "提单号",
      type: "text",
      group: "出运信息",
    },

    // === 时间信息 ===
    {
      id: "noticeTime",
      label: "通知时间",
      type: "date",
      group: "时间信息",
    },
    {
      id: "expectedDate",
      label: "预计出货日期",
      type: "date",
      group: "时间信息",
    },
    {
      id: "warehouseEntryDate",
      label: "进仓日期",
      type: "date",
      group: "时间信息",
    },

    // === 关联信息 ===
    {
      id: "contractCodes",
      label: "合同编号列表",
      type: "text",
      group: "关联信息",
    },
    {
      id: "applicant",
      label: "申请人",
      type: "text",
      group: "关联信息",
    },
    {
      id: "companyName",
      label: "归属公司",
      type: "text",
      group: "关联信息",
    },

    // === 统计信息 ===
    {
      id: "totalVolume",
      label: "总体积",
      type: "number",
      readOnly: true,
      group: "统计信息",
    },
    {
      id: "totalGrossWeight",
      label: "总毛重",
      type: "number",
      readOnly: true,
      group: "统计信息",
    },

    // === 其他信息 ===
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
      group: "其他信息",
    },
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 2,
      group: "其他信息",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "出库通知明细",
      editable: true,
      fields: [
        { id: "lineNumber", label: "行号", type: "number", required: true },
        { id: "skuCode", label: "SKU编码", type: "text" },
        { id: "skuName", label: "SKU名称", type: "text" },
        { id: "warehouseCode", label: "仓库编码", type: "text" },
        { id: "warehouseName", label: "仓库名称", type: "text" },
        { id: "specification", label: "规格", type: "text" },
        { id: "supplierName", label: "供应商", type: "text" },
        { id: "customerName", label: "客户", type: "text" },
        { id: "pendingInboundQuantity", label: "待出库数量", type: "number" },
        { id: "inboundingQuantity", label: "出库中数量", type: "number" },
        { id: "actualInboundQuantity", label: "实际出库数量", type: "number" },
        { id: "expectedQuantity", label: "应出数量", type: "number" },
        { id: "expectedBoxes", label: "应出箱数", type: "number" },
        { id: "remark", label: "备注", type: "text" },
      ],
    },
  ],
}
