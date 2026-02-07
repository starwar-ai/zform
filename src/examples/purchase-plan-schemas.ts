/**
 * Purchase Plan Schemas
 *
 * 采购计划单据定义（基于 scm.txt 需求）
 * 采购流程: 销售合同 → 采购计划 → 采购合同
 */

import type { DocumentSchema, PushDownRule, ChangeRule } from "@/core/types"

// ============================================================
// 采购计划 (Purchase Plan)
// ============================================================

export const purchasePlanSchema: DocumentSchema = {
  typeId: "purchase_plan",
  typeName: "采购计划",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "计划编号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "planDate",
      label: "计划日期",
      type: "date",
      required: true,
      defaultValue: new Date().toISOString().split("T")[0],
      group: "基本信息",
    },
    {
      id: "expectedDeliveryDate",
      label: "预计交期",
      type: "date",
      required: true,
      group: "基本信息",
    },
    {
      id: "planStatus",
      label: "计划状态",
      type: "select",
      options: [
        { label: "草稿", value: "DRAFT" },
        { label: "待审核", value: "PENDING" },
        { label: "已审核", value: "APPROVED" },
        { label: "执行中", value: "IN_PROGRESS" },
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

    // === 来源信息 ===
    {
      id: "sourceType",
      label: "来源单类型",
      type: "select",
      options: [
        { label: "销售合同", value: "SALES_CONTRACT" },
        { label: "采购计划", value: "PURCHASE_PLAN" },
        { label: "其他", value: "OTHER" },
      ],
      readOnly: true,
      group: "来源信息",
    },
    {
      id: "salesContractId",
      label: "销售合同主键",
      type: "text",
      readOnly: true,
      group: "来源信息",
    },
    {
      id: "salesContractCode",
      label: "销售合同编号",
      type: "text",
      readOnly: true,
      group: "来源信息",
    },
    {
      id: "sourcePlanCode",
      label: "来源计划编号",
      type: "text",
      readOnly: true,
      group: "来源信息",
    },
    {
      id: "orderLinkCode",
      label: "订单链路编号",
      type: "text",
      readOnly: true,
      group: "来源信息",
    },
    {
      id: "orderPath",
      label: "订单路径",
      type: "text",
      readOnly: true,
      group: "来源信息",
    },

    // === 客户信息 ===
    {
      id: "customerId",
      label: "客户ID",
      type: "text",
      readOnly: true,
      group: "客户信息",
    },
    {
      id: "customerCode",
      label: "客户编号",
      type: "text",
      readOnly: true,
      group: "客户信息",
    },

    // === 采购主体与人员 ===
    {
      id: "purchasingEntity",
      label: "采购主体",
      type: "text",
      placeholder: "选择采购主体",
      group: "采购信息",
    },
    {
      id: "buyer",
      label: "采购员",
      type: "text",
      placeholder: "选择采购员",
      group: "采购信息",
    },
    {
      id: "salesPerson",
      label: "业务员",
      type: "text",
      readOnly: true,
      group: "采购信息",
    },
    {
      id: "salesRep",
      label: "销售人员",
      type: "text",
      readOnly: true,
      group: "采购信息",
    },
    {
      id: "merchandiser",
      label: "跟单员",
      type: "text",
      placeholder: "选择跟单员",
      group: "采购信息",
    },

    // === 辅料采购相关 ===
    {
      id: "isAccessoryPurchase",
      label: "是否辅料采购",
      type: "checkbox",
      defaultValue: false,
      group: "辅料信息",
    },
    {
      id: "accessoryBuyer",
      label: "辅料采购员",
      type: "text",
      placeholder: "辅料属于的采购员",
      group: "辅料信息",
    },
    {
      id: "accessorySalesPerson",
      label: "辅料销售员",
      type: "text",
      placeholder: "辅料属于的销售员",
      group: "辅料信息",
    },
    {
      id: "accessoryMerchandiser",
      label: "辅料跟单员",
      type: "text",
      placeholder: "辅料属于的跟单员",
      group: "辅料信息",
    },

    // === 其他信息 ===
    {
      id: "salesType",
      label: "销售类型",
      type: "select",
      options: [
        { label: "内销", value: "DOMESTIC" },
        { label: "外销", value: "EXPORT" },
        { label: "其他", value: "OTHER" },
      ],
      group: "其他信息",
    },
    {
      id: "splitFlag",
      label: "拆分标识",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
    },
    {
      id: "creatorDepartment",
      label: "创建人部门",
      type: "text",
      readOnly: true,
      group: "其他信息",
    },

    // === 时间信息 ===
    {
      id: "closedTime",
      label: "结案时间",
      type: "date",
      readOnly: true,
      group: "时间信息",
    },
    {
      id: "completedTime",
      label: "完成时间",
      type: "date",
      readOnly: true,
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
      label: "采购明细",
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
          required: true,
        },
        {
          id: "productCode",
          label: "SKU编号",
          type: "text",
          required: true,
        },
        {
          id: "productName",
          label: "产品名称",
          type: "text",
          required: true,
        },
        {
          id: "barcode",
          label: "条形码",
          type: "text",
        },
        {
          id: "customerProductNo",
          label: "客户货号",
          type: "text",
        },
        {
          id: "selfOwnedProductNo",
          label: "自营货号",
          type: "text",
        },
        {
          id: "factoryProductNo",
          label: "工厂货号",
          type: "text",
        },
        {
          id: "specification",
          label: "规格",
          type: "text",
        },
        {
          id: "specificationDesc",
          label: "规格描述",
          type: "text",
        },
        {
          id: "salesQuantity",
          label: "销售数量",
          type: "number",
          readOnly: true,
        },
        {
          id: "contractQuantity",
          label: "合同数量",
          type: "number",
          readOnly: true,
        },
        {
          id: "purchaseQuantity",
          label: "采购数量",
          type: "number",
          required: true,
        },
        {
          id: "pendingQuantity",
          label: "待采购数量",
          type: "number",
          readOnly: true,
        },
        {
          id: "convertedQuantity",
          label: "已转合同数量",
          type: "number",
          readOnly: true,
          defaultValue: 0,
        },
        {
          id: "lockedInventory",
          label: "锁定库存",
          type: "number",
          defaultValue: 0,
        },
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
        {
          id: "unitPrice",
          label: "采购单价",
          type: "number",
          required: true,
        },
        {
          id: "totalAmount",
          label: "总价",
          type: "computed",
          compute: (row) => {
            const qty = (row.purchaseQuantity as number) ?? 0
            const price = (row.unitPrice as number) ?? 0
            return qty * price
          },
        },
        {
          id: "taxRate",
          label: "税率(%)",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "includeTax",
          label: "是否含税",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "totalAmountWithTax",
          label: "含税总价",
          type: "computed",
          compute: (row) => {
            const total = (row.totalAmount as number) ?? 0
            const taxRate = (row.taxRate as number) ?? 0
            const includeTax = row.includeTax ?? false
            return includeTax ? total : total * (1 + taxRate / 100)
          },
        },
        {
          id: "currency",
          label: "币种",
          type: "select",
          options: [
            { label: "CNY", value: "CNY" },
            { label: "USD", value: "USD" },
            { label: "EUR", value: "EUR" },
          ],
          defaultValue: "CNY",
        },
        {
          id: "deliveryDate",
          label: "交货日期",
          type: "date",
        },
        {
          id: "purchaseType",
          label: "采购类型",
          type: "select",
          options: [
            { label: "正常采购", value: "NORMAL" },
            { label: "紧急采购", value: "URGENT" },
            { label: "补单", value: "REPLENISHMENT" },
          ],
        },
        {
          id: "packageMethod",
          label: "包装方式",
          type: "text",
        },
        {
          id: "packagePrice",
          label: "包装价",
          type: "number",
        },
        {
          id: "includeShipping",
          label: "是否含运费",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "includePackage",
          label: "是否含包装",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "moq",
          label: "最小起购量",
          type: "number",
        },
        {
          id: "boxQuantity",
          label: "箱数",
          type: "number",
        },
        {
          id: "isCommonAccessory",
          label: "是否通用辅料",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "isSelfBrand",
          label: "是否自主品牌",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "isGift",
          label: "是否赠品",
          type: "checkbox",
          defaultValue: false,
        },
        {
          id: "purchaseMode",
          label: "采购模式",
          type: "select",
          options: [
            { label: "订单采购", value: "ORDER" },
            { label: "库存采购", value: "INVENTORY" },
            { label: "寄售", value: "CONSIGNMENT" },
          ],
        },
        {
          id: "purchaseLink",
          label: "采购链接",
          type: "text",
        },
        {
          id: "thumbnail",
          label: "缩略图",
          type: "text",
        },
        {
          id: "images",
          label: "图片",
          type: "text",
        },
        {
          id: "remark",
          label: "备注",
          type: "text",
        },
        {
          id: "attachments",
          label: "附件",
          type: "text",
        },
      ],
    },
  ],
}

// ============================================================
// 下推规则
// ============================================================

/** 销售合同 → 采购计划 */
export const salesContractToPurchasePlanRule: PushDownRule = {
  sourceTypeId: "sales_contract",
  targetTypeId: "purchase_plan",
  name: "生成采购计划",
  masterFieldMappings: [
    { sourceField: "master.code", targetField: "salesContractCode" },
    { sourceField: "master.id", targetField: "salesContractId" },
    { sourceField: "master.customerId", targetField: "customerId" },
    { sourceField: "master.customerCode", targetField: "customerCode" },
    { sourceField: "master.salesPerson", targetField: "salesPerson" },
    { sourceField: "master.merchandiser", targetField: "merchandiser" },
    { sourceField: "master.buyer", targetField: "buyer" },
    { sourceField: "master.orderLinkCode", targetField: "orderLinkCode" },
    { sourceField: "master.orderPath", targetField: "orderPath" },
    {
      sourceField: "master.customerDeliveryDate",
      targetField: "expectedDeliveryDate",
    },
  ],
  detailMappings: [
    {
      sourceTableId: "items",
      targetTableId: "items",
      fieldMappings: [
        { sourceField: "productId", targetField: "productId" },
        { sourceField: "productCode", targetField: "productCode" },
        { sourceField: "productName", targetField: "productName" },
        { sourceField: "customerProductNo", targetField: "customerProductNo" },
        { sourceField: "productSpec", targetField: "specification" },
        { sourceField: "quantity", targetField: "salesQuantity" },
        { sourceField: "quantity", targetField: "contractQuantity" },
        { sourceField: "quantity", targetField: "purchaseQuantity" },
        { sourceField: "quantity", targetField: "pendingQuantity" },
        { sourceField: "unitPrice", targetField: "unitPrice" },
        { sourceField: "currency", targetField: "currency" },
        { sourceField: "deliveryDate", targetField: "deliveryDate" },
        { sourceField: "packageMethod", targetField: "packageMethod" },
      ],
    },
  ],
}

/** 采购计划 → 采购合同 */
export const purchasePlanToPurchaseContractRule: PushDownRule = {
  sourceTypeId: "purchase_plan",
  targetTypeId: "purchase_contract",
  name: "生成采购合同",
  masterFieldMappings: [
    { sourceField: "master.code", targetField: "purchasePlanCode" },
    { sourceField: "master.buyer", targetField: "buyer" },
    { sourceField: "master.expectedDeliveryDate", targetField: "deliveryDate" },
    { sourceField: "master.purchasingEntity", targetField: "purchasingEntity" },
  ],
  detailMappings: [
    {
      sourceTableId: "items",
      targetTableId: "items",
      fieldMappings: [
        { sourceField: "productId", targetField: "productId" },
        { sourceField: "productCode", targetField: "productCode" },
        { sourceField: "productName", targetField: "productName" },
        { sourceField: "specification", targetField: "specification" },
        { sourceField: "supplierId", targetField: "supplierId" },
        { sourceField: "supplierCode", targetField: "supplierCode" },
        { sourceField: "supplierName", targetField: "supplierName" },
        { sourceField: "purchaseQuantity", targetField: "quantity" },
        { sourceField: "unitPrice", targetField: "unitPrice" },
        { sourceField: "currency", targetField: "currency" },
        { sourceField: "taxRate", targetField: "taxRate" },
        { sourceField: "deliveryDate", targetField: "deliveryDate" },
        { sourceField: "packageMethod", targetField: "packageMethod" },
        { sourceField: "remark", targetField: "remark" },
      ],
      rowFilter: (row) => {
        // 只下推待采购数量 > 0 的行
        const pendingQty = (row.data.pendingQuantity as number) ?? 0
        return pendingQty > 0
      },
    },
  ],
}

// ============================================================
// 变更规则
// ============================================================

/** 销售合同变更规则 - 影响采购计划 */
export const salesContractChangeToPurchasePlanRule: ChangeRule = {
  typeId: "sales_contract",
  watchFields: [
    "master.customerDeliveryDate",
    "master.status",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 客户交期变更
    if (
      oldDoc.masterData.customerDeliveryDate !==
      newDoc.masterData.customerDeliveryDate
    ) {
      for (const downstream of downstreamDocs) {
        if (downstream.typeId === "purchase_plan") {
          impacts.push({
            level: "warning" as const,
            affectedDocId: downstream.id,
            affectedTypeId: downstream.typeId,
            affectedDocNumber: downstream.docNumber,
            affectedField: "expectedDeliveryDate",
            description: `销售合同客户交期变更 (${oldDoc.masterData.customerDeliveryDate} → ${newDoc.masterData.customerDeliveryDate}), 需要同步更新采购计划的预计交期。`,
          })
        }
      }
    }

    // 销售合同取消
    if (
      oldDoc.masterData.status !== "CANCELLED" &&
      newDoc.masterData.status === "CANCELLED"
    ) {
      for (const downstream of downstreamDocs) {
        if (downstream.typeId === "purchase_plan") {
          const planStatus = downstream.masterData.planStatus
          if (planStatus === "DRAFT" || planStatus === "PENDING") {
            impacts.push({
              level: "critical" as const,
              affectedDocId: downstream.id,
              affectedTypeId: downstream.typeId,
              affectedDocNumber: downstream.docNumber,
              affectedField: "planStatus",
              description: `销售合同已取消, 采购计划 ${downstream.docNumber} 建议同步取消。`,
            })
          } else {
            impacts.push({
              level: "warning" as const,
              affectedDocId: downstream.id,
              affectedTypeId: downstream.typeId,
              affectedDocNumber: downstream.docNumber,
              affectedField: "planStatus",
              description: `销售合同已取消, 但采购计划 ${downstream.docNumber} 已进入 ${planStatus} 状态, 请人工处理。`,
            })
          }
        }
      }
    }

    return impacts
  },
}

/** 采购计划变更规则 - 影响采购合同 */
export const purchasePlanChangeRule: ChangeRule = {
  typeId: "purchase_plan",
  watchFields: [
    "master.expectedDeliveryDate",
    "master.planStatus",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 预计交期变更
    if (
      oldDoc.masterData.expectedDeliveryDate !==
      newDoc.masterData.expectedDeliveryDate
    ) {
      for (const downstream of downstreamDocs) {
        if (downstream.typeId === "purchase_contract") {
          impacts.push({
            level: "warning" as const,
            affectedDocId: downstream.id,
            affectedTypeId: downstream.typeId,
            affectedDocNumber: downstream.docNumber,
            affectedField: "deliveryDate",
            description: `采购计划预计交期变更 (${oldDoc.masterData.expectedDeliveryDate} → ${newDoc.masterData.expectedDeliveryDate}), 需要同步更新采购合同交货日期。`,
          })
        }
      }
    }

    // 采购计划取消
    if (
      oldDoc.masterData.planStatus !== "CANCELLED" &&
      newDoc.masterData.planStatus === "CANCELLED"
    ) {
      for (const downstream of downstreamDocs) {
        if (downstream.typeId === "purchase_contract") {
          const contractStatus = downstream.masterData.status
          if (contractStatus === "DRAFT" || contractStatus === "PENDING") {
            impacts.push({
              level: "critical" as const,
              affectedDocId: downstream.id,
              affectedTypeId: downstream.typeId,
              affectedDocNumber: downstream.docNumber,
              affectedField: "status",
              description: `采购计划已取消, 采购合同 ${downstream.docNumber} 建议同步取消。`,
            })
          } else {
            impacts.push({
              level: "warning" as const,
              affectedDocId: downstream.id,
              affectedTypeId: downstream.typeId,
              affectedDocNumber: downstream.docNumber,
              affectedField: "status",
              description: `采购计划已取消, 但采购合同 ${downstream.docNumber} 已进入 ${contractStatus} 状态, 请人工处理。`,
            })
          }
        }
      }
    }

    return impacts
  },
}
