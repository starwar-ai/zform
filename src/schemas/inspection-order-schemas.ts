/**
 * Inspection Order Schemas
 *
 * 验货单单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 验货单 (Inspection Order)
// ============================================================

export const inspectionOrderSchema: DocumentSchema = {
  typeId: "inspection_order",
  typeName: "验货单",
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
      id: "orderLinkCode",
      label: "订单链路编号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "status",
      label: "验货单状态",
      type: "select",
      options: [
        { label: "草稿", value: "DRAFT" },
        { label: "待验货", value: "PENDING_INSPECTION" },
        { label: "验货中", value: "INSPECTING" },
        { label: "验货通过", value: "PASSED" },
        { label: "验货不通过", value: "FAILED" },
        { label: "待定", value: "PENDING_RESULT" },
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
      id: "sourceType",
      label: "单据来源",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },

    // === 人员信息 ===
    {
      id: "buyer",
      label: "采购员",
      type: "text",
      group: "人员信息",
    },
    {
      id: "salesPerson",
      label: "业务员",
      type: "text",
      group: "人员信息",
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

    // === 采购合同关联 ===
    {
      id: "purchaseContractId",
      label: "采购合同主键",
      type: "text",
      readOnly: true,
      group: "采购合同关联",
    },
    {
      id: "purchaseContractCode",
      label: "采购合同编号",
      type: "text",
      readOnly: true,
      group: "采购合同关联",
    },

    // === 仓库信息 ===
    {
      id: "warehouseId",
      label: "仓库主键",
      type: "text",
      group: "仓库信息",
    },
    {
      id: "warehouseName",
      label: "仓库名称",
      type: "text",
      group: "仓库信息",
    },

    // === 验货方式 ===
    {
      id: "inspectionMethod",
      label: "验货方式",
      type: "select",
      options: [
        { label: "送货验收", value: "DELIVERY_INSPECTION" },
        { label: "全检", value: "FULL_INSPECTION" },
        { label: "抽检", value: "SAMPLING_INSPECTION" },
        { label: "免检", value: "EXEMPT" },
      ],
      group: "验货信息",
    },
    {
      id: "inspectionNode",
      label: "验货节点",
      type: "text",
      group: "验货信息",
    },

    // === 申请验货信息 ===
    {
      id: "expectedInspectionTime",
      label: "期望验货时间",
      type: "date",
      group: "申请验货信息",
    },
    {
      id: "applicant",
      label: "申请验货人",
      type: "text",
      group: "申请验货信息",
    },
    {
      id: "applicantName",
      label: "申请验货人姓名",
      type: "text",
      group: "申请验货信息",
    },
    {
      id: "applicantDepartmentId",
      label: "申请验货人部门主键",
      type: "text",
      group: "申请验货信息",
    },
    {
      id: "applicantDepartmentName",
      label: "申请验货人部门名称",
      type: "text",
      group: "申请验货信息",
    },

    // === 计划验货信息 ===
    {
      id: "plannedInspectionTime",
      label: "计划验货时间",
      type: "date",
      group: "计划验货信息",
    },
    {
      id: "factoryContact",
      label: "工厂联系人",
      type: "text",
      group: "计划验货信息",
    },
    {
      id: "contactPhone",
      label: "联系电话",
      type: "text",
      group: "计划验货信息",
    },
    {
      id: "inspectionAddress",
      label: "验货地址",
      type: "textarea",
      span: 4,
      group: "计划验货信息",
    },

    // === 验货人信息 ===
    {
      id: "inspector",
      label: "验货人",
      type: "text",
      group: "验货人信息",
    },
    {
      id: "inspectorName",
      label: "验货人姓名",
      type: "text",
      group: "验货人信息",
    },
    {
      id: "inspectorDepartmentId",
      label: "验货人部门主键",
      type: "text",
      group: "验货人信息",
    },
    {
      id: "inspectorDepartmentName",
      label: "验货人部门名称",
      type: "text",
      group: "验货人信息",
    },

    // === 实际验货 ===
    {
      id: "actualInspectionTime",
      label: "实际验货时间",
      type: "date",
      group: "实际验货",
    },

    // === 金额与分摊 ===
    {
      id: "inspectionAmount",
      label: "验货金额",
      type: "number",
      group: "金额与分摊",
    },
    {
      id: "allocationMethod",
      label: "分摊方式",
      type: "select",
      options: [
        { label: "按数量分摊", value: "BY_QUANTITY" },
        { label: "按金额分摊", value: "BY_AMOUNT" },
        { label: "按重量分摊", value: "BY_WEIGHT" },
        { label: "手动分摊", value: "MANUAL" },
      ],
      group: "金额与分摊",
    },

    // === 重验单关联 ===
    {
      id: "isReinspection",
      label: "是否重验单",
      type: "checkbox",
      defaultValue: false,
      group: "重验单关联",
    },
    {
      id: "relatedInspectionOrderId",
      label: "关联验货单ID",
      type: "text",
      readOnly: true,
      group: "重验单关联",
    },
    {
      id: "relatedInspectionOrderCode",
      label: "关联验货单单号",
      type: "text",
      readOnly: true,
      group: "重验单关联",
    },

    // === 归属公司 ===
    {
      id: "companyId",
      label: "归属公司主键",
      type: "text",
      group: "归属公司",
    },
    {
      id: "companyName",
      label: "归属公司名称",
      type: "text",
      group: "归属公司",
    },

    // === 其他信息 ===
    {
      id: "specialNotes",
      label: "特别注意事项",
      type: "textarea",
      span: 4,
      group: "其他信息",
    },
    {
      id: "factoryGuarantee",
      label: "工厂保函",
      type: "text",
      group: "其他信息",
    },
    {
      id: "acceptanceNote",
      label: "接受说明",
      type: "textarea",
      span: 4,
      group: "其他信息",
    },
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "其他信息",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "验货明细",
      editable: true,
      fields: [
        {
          id: "lineNumber",
          label: "行号",
          type: "number",
          readOnly: true,
        },
        {
          id: "baseProductCode",
          label: "基础产品编号",
          type: "text",
        },
        {
          id: "thumbnail",
          label: "主图",
          type: "text",
          placeholder: "图片URL",
        },
        {
          id: "skuId",
          label: "SKU ID",
          type: "text",
        },
        {
          id: "skuCode",
          label: "SKU编码",
          type: "text",
        },
        {
          id: "skuName",
          label: "SKU名称",
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
          id: "packageMethod",
          label: "包装方式",
          type: "text",
        },
        {
          id: "isSplit",
          label: "是否分箱",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "purchaseQuantity",
          label: "采购数量",
          type: "number",
        },
        {
          id: "quantity",
          label: "数量",
          type: "number",
        },
        {
          id: "inspectionStatus",
          label: "验货状态",
          type: "select",
          options: [
            { label: "未验货", value: "NOT_INSPECTED" },
            { label: "验货中", value: "INSPECTING" },
            { label: "已验货", value: "INSPECTED" },
            { label: "验货通过", value: "PASSED" },
            { label: "验货不通过", value: "FAILED" },
          ],
          defaultValue: "NOT_INSPECTED",
        },
        {
          id: "inspectionAmount",
          label: "验货金额",
          type: "number",
        },
        {
          id: "productTotalPrice",
          label: "产品总价",
          type: "number",
        },
        {
          id: "purchaseContractCode",
          label: "采购合同编号",
          type: "text",
          readOnly: true,
        },
        {
          id: "purchaseContractItemId",
          label: "采购合同明细主键",
          type: "text",
          readOnly: true,
        },
        {
          id: "buyerInfo",
          label: "采购员",
          type: "text",
        },
        {
          id: "salesPersonInfo",
          label: "销售员",
          type: "text",
        },
        {
          id: "merchandiserInfo",
          label: "跟单员",
          type: "text",
        },
        {
          id: "customerInfo",
          label: "客户信息",
          type: "text",
        },
        {
          id: "outerBoxQuantity",
          label: "外箱装量",
          type: "number",
        },
        {
          id: "innerBoxQuantity",
          label: "内盒装量",
          type: "number",
        },
        {
          id: "boxCount",
          label: "箱数",
          type: "number",
        },
        {
          id: "failureDescription",
          label: "失败描述",
          type: "text",
        },
        {
          id: "lastFailureDescription",
          label: "上次失败描述",
          type: "text",
          readOnly: true,
        },
        {
          id: "pendingDescription",
          label: "待定描述",
          type: "text",
        },
        {
          id: "reworkNote",
          label: "返工说明",
          type: "text",
        },
        {
          id: "processFlag",
          label: "处理标识",
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
// 验货单变更规则
// ============================================================

export const inspectionOrderChangeRule: ChangeRule = {
  typeId: "inspection_order",
  watchFields: [
    "master.status",
    "master.inspectionMethod",
    "master.plannedInspectionTime",
    "detail.items.quantity",
    "detail.items.inspectionStatus",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    // 验货单暂无下推下游单据，变更影响评估为空
    return []
  },
}
