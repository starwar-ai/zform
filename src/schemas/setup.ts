/**
 * Example Setup
 *
 * 注册示例业务单据到 Registry，初始化默认用户和角色。
 * 在应用启动时调用。
 */

import { registry } from "@/core/registry"
import type { DocumentListActionConfig, DocumentFormActionConfig } from "@/core/types"
import {
  salesContractSchema,
  exportSalesContractSchema,
  domesticSalesContractSchema,
  jointVentureSalesContractSchema,
  salesContractChangeRule,
} from "./sales-contract-schemas"
import {
  purchaseContractSchema,
  productPurchaseContractSchema,
  packagingPurchaseContractSchema,
  purchasePlanToPurchaseContractRule,
  purchaseContractChangeRule,
} from "./purchase-contract-schemas"
import {
  standardProductSchema,
  customerProductSchema,
  selfOwnedProductSchema,
  standardToCustomerProductRule,
  standardToSelfOwnedProductRule,
  standardProductChangeRule,
} from "./product-schemas"
import {
  purchasePlanSchema,
  productPurchasePlanSchema,
  packagingPurchasePlanSchema,
  salesContractToPurchasePlanRule,
  salesContractChangeToPurchasePlanRule,
  purchasePlanChangeRule,
} from "./purchase-plan-schemas"
import {
  customerSchema,
  domesticCustomerSchema,
  internationalCustomerSchema,
  customerChangeRule,
} from "./customer-schemas"
import {
  manufacturerSchema,
  serviceProviderSchema,
  logisticsSchema,
  manufacturerChangeRule,
  serviceProviderChangeRule,
  logisticsChangeRule,
} from "./supplier-schemas"
import {
  warehouseInboundSchema,
  warehouseOutboundSchema,
  warehouseInboundNoticeSchema,
  warehouseOutboundNoticeSchema,
} from "./warehouse-schemas"
import {
  inspectionOrderSchema,
  inspectionOrderChangeRule,
} from "./inspection-order-schemas"
import {
  concessionAcceptanceSchema,
  concessionAcceptanceChangeRule,
} from "./concession-acceptance-schemas"
import {
  shippingPlanSchema,
  shippingPlanToShippingOrderRule,
  shippingPlanChangeRule,
} from "./shipping-plan-schemas"
import {
  shippingOrderSchema,
  shippingOrderChangeRule,
} from "./shipping-order-schemas"
import {
  inspectionDeclarationSchema,
  inspectionDeclarationChangeRule,
} from "./inspection-declaration-schemas"
import {
  customsDeclarationSchema,
  customsDeclarationChangeRule,
} from "./customs-declaration-schemas"
import {
  exchangeSettlementSchema,
  exchangeSettlementChangeRule,
} from "./exchange-settlement-schemas"
import {
  invoicingNoticeSchema,
  invoicingNoticeChangeRule,
} from "./invoicing-notice-schemas"
import {
  paymentApplySchema,
  paymentApplyChangeRule,
} from "./payment-apply-schemas"
import {
  paymentSchema,
  paymentChangeRule,
} from "./payment-schemas"
import {
  receiptRegistrationSchema,
  receiptRegistrationChangeRule,
} from "./receipt-registration-schemas"
import {
  paymentClaimSchema,
  paymentClaimChangeRule,
} from "./payment-claim-schemas"
import {
  invoiceRegistrationSchema,
  invoiceRegistrationChangeRule,
} from "./invoice-registration-schemas"
import {
  processingOrderSchema,
  processingOrderChangeRule,
} from "./processing-order-schemas"
import {
  quotationSchema,
  quotationChangeRule,
} from "./quotation-schemas"

// ============================================================
// 单据列表操作配置
// ============================================================

/** 销售合同 - 列表操作 */
const salesContractActionConfig: DocumentListActionConfig = {
  typeId: "sales_contract",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "sales_contract:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "sales_contract:create" },
  ],
}

/** 外销合同 - 列表操作 */
const exportSalesContractActionConfig: DocumentListActionConfig = {
  typeId: "export_sales_contract",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "sales_contract:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "sales_contract:create" },
  ],
}

/** 内销合同 - 列表操作 */
const domesticSalesContractActionConfig: DocumentListActionConfig = {
  typeId: "domestic_sales_contract",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "sales_contract:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "sales_contract:create" },
  ],
}

/** 联营合同 - 列表操作 */
const jointVentureSalesContractActionConfig: DocumentListActionConfig = {
  typeId: "joint_venture_sales_contract",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "sales_contract:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "sales_contract:create" },
  ],
}

/** 采购计划 - 列表操作 */
const purchasePlanActionConfig: DocumentListActionConfig = {
  typeId: "purchase_plan",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "purchase_plan:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "purchase_plan:create" },
  ],
}

/** 商品采购计划 - 列表操作 */
const productPurchasePlanActionConfig: DocumentListActionConfig = {
  typeId: "product_purchase_plan",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "purchase_plan:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "purchase_plan:create" },
  ],
}

/** 包材采购计划 - 列表操作 */
const packagingPurchasePlanActionConfig: DocumentListActionConfig = {
  typeId: "packaging_purchase_plan",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "purchase_plan:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "purchase_plan:create" },
  ],
}

/** 采购合同 - 列表操作 */
const purchaseContractActionConfig: DocumentListActionConfig = {
  typeId: "purchase_contract",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "purchase_contract:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "purchase_contract:create" },
  ],
}

/** 商品采购合同 - 列表操作 */
const productPurchaseContractActionConfig: DocumentListActionConfig = {
  typeId: "product_purchase_contract",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "purchase_contract:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "purchase_contract:create" },
  ],
}

/** 包材采购合同 - 列表操作 */
const packagingPurchaseContractActionConfig: DocumentListActionConfig = {
  typeId: "packaging_purchase_contract",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "purchase_contract:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "purchase_contract:create" },
  ],
}

/** 标准产品 - 列表操作 */
const standardProductActionConfig: DocumentListActionConfig = {
  typeId: "standard_product",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      permission: "standard_product:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "standard_product:create" },
  ],
}

/** 客户产品 - 列表操作 */
const customerProductActionConfig: DocumentListActionConfig = {
  typeId: "customer_product",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      permission: "customer_product:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "customer_product:create" },
  ],
}

/** 自营产品 - 列表操作 */
const selfOwnedProductActionConfig: DocumentListActionConfig = {
  typeId: "self_owned_product",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      permission: "self_owned_product:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "self_owned_product:create" },
  ],
}

/** 国内客户 - 列表操作 */
const domesticCustomerActionConfig: DocumentListActionConfig = {
  typeId: "domestic_customer",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "customer:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "customer:create" },
  ],
}

/** 国外客户 - 列表操作 */
const internationalCustomerActionConfig: DocumentListActionConfig = {
  typeId: "international_customer",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "customer:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "customer:create" },
  ],
}

/** 客户 - 列表操作 */
const customerActionConfig: DocumentListActionConfig = {
  typeId: "customer",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "customer:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "customer:create" },
  ],
}

/** 供应商通用行操作 */
const supplierRowActions = (typeId: string) => [
  { id: "open", label: "打开" },
  { id: "copy-id", label: "复制ID" },
  {
    id: "delete",
    label: "删除",
    danger: true,
    modes: ["document"] as const,
    visible: (row: any) => row._status === "draft",
    permission: `${typeId}:delete`,
  },
]

/** 生产商 - 列表操作 */
const manufacturerActionConfig: DocumentListActionConfig = {
  typeId: "manufacturer",
  rowActions: supplierRowActions("manufacturer"),
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "manufacturer:create" },
  ],
}

/** 服务商 - 列表操作 */
const serviceProviderActionConfig: DocumentListActionConfig = {
  typeId: "service_provider",
  rowActions: supplierRowActions("service_provider"),
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "service_provider:create" },
  ],
}

/** 物流商 - 列表操作 */
const logisticsActionConfig: DocumentListActionConfig = {
  typeId: "logistics",
  rowActions: supplierRowActions("logistics"),
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "logistics:create" },
  ],
}

/** 验货单 - 列表操作 */
const inspectionOrderActionConfig: DocumentListActionConfig = {
  typeId: "inspection_order",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "inspection_order:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "inspection_order:create" },
  ],
}

/** 让步接收单 - 列表操作 */
const concessionAcceptanceActionConfig: DocumentListActionConfig = {
  typeId: "concession_acceptance",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "concession_acceptance:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "concession_acceptance:create" },
  ],
}

/** 出运计划单 - 列表操作 */
const shippingPlanActionConfig: DocumentListActionConfig = {
  typeId: "shipping_plan",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "shipping_plan:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "shipping_plan:create" },
  ],
}

/** 出运单 - 列表操作 */
const shippingOrderActionConfig: DocumentListActionConfig = {
  typeId: "shipping_order",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "shipping_order:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "shipping_order:create" },
  ],
}

/** 商检单 - 列表操作 */
const inspectionDeclarationActionConfig: DocumentListActionConfig = {
  typeId: "inspection_declaration",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "inspection_declaration:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "inspection_declaration:create" },
  ],
}

/** 报关单 - 列表操作 */
const customsDeclarationActionConfig: DocumentListActionConfig = {
  typeId: "customs_declaration",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "customs_declaration:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "customs_declaration:create" },
  ],
}

/** 结汇单 - 列表操作 */
const exchangeSettlementActionConfig: DocumentListActionConfig = {
  typeId: "exchange_settlement",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "exchange_settlement:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "exchange_settlement:create" },
  ],
}

/** 开票通知 - 列表操作 */
const invoicingNoticeActionConfig: DocumentListActionConfig = {
  typeId: "invoicing_notice",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "invoicing_notice:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "invoicing_notice:create" },
  ],
}

/** 付款申请 - 列表操作 */
const paymentApplyActionConfig: DocumentListActionConfig = {
  typeId: "payment_apply",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "payment_apply:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "payment_apply:create" },
  ],
}

/** 仓库单据通用行操作 */
const warehouseRowActions = (typeId: string) => [
  { id: "open", label: "打开" },
  { id: "copy-id", label: "复制ID" },
  {
    id: "delete",
    label: "删除",
    danger: true,
    modes: ["document"] as const,
    visible: (row: any) => row._status === "DRAFT",
    permission: `${typeId}:delete`,
  },
]

/** 入库单 - 列表操作 */
const warehouseInboundActionConfig: DocumentListActionConfig = {
  typeId: "warehouse_inbound",
  rowActions: warehouseRowActions("warehouse_inbound"),
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "warehouse_inbound:create" },
  ],
}

/** 出库单 - 列表操作 */
const warehouseOutboundActionConfig: DocumentListActionConfig = {
  typeId: "warehouse_outbound",
  rowActions: warehouseRowActions("warehouse_outbound"),
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "warehouse_outbound:create" },
  ],
}

/** 入库通知单 - 列表操作 */
const warehouseInboundNoticeActionConfig: DocumentListActionConfig = {
  typeId: "warehouse_inbound_notice",
  rowActions: warehouseRowActions("warehouse_inbound_notice"),
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "warehouse_inbound_notice:create" },
  ],
}

/** 出库通知单 - 列表操作 */
const warehouseOutboundNoticeActionConfig: DocumentListActionConfig = {
  typeId: "warehouse_outbound_notice",
  rowActions: warehouseRowActions("warehouse_outbound_notice"),
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "warehouse_outbound_notice:create" },
  ],
}

/** 加工单 - 列表操作 */
const processingOrderActionConfig: DocumentListActionConfig = {
  typeId: "processing_order",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "processing_order:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "processing_order:create" },
  ],
}

// ============================================================
// 单据表单操作配置 (状态 + 权限驱动)
// ============================================================

/** 销售合同 - 表单操作 */
const salesContractFormActions: DocumentFormActionConfig = {
  typeId: "sales_contract",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "sales_contract:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "sales_contract:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "sales_contract:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "sales_contract:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "sales_contract:void", order: 8 },
    {
      id: "push-down:0", label: "生成采购计划", icon: "ArrowDownToLine", variant: "outline",
      allowedStatuses: ["approved"], permission: "sales_contract:push_down", order: 10,
    },
  ],
}

/** 采购计划 - 表单操作 */
const purchasePlanFormActions: DocumentFormActionConfig = {
  typeId: "purchase_plan",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "purchase_plan:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "purchase_plan:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "purchase_plan:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "purchase_plan:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "purchase_plan:void", order: 8 },
    {
      id: "push-down:0", label: "生成采购合同", icon: "ArrowDownToLine", variant: "outline",
      allowedStatuses: ["approved"], permission: "purchase_plan:push_down", order: 10,
    },
  ],
}

/** 商品采购计划 - 表单操作 */
const productPurchasePlanFormActions: DocumentFormActionConfig = {
  typeId: "product_purchase_plan",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "purchase_plan:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "purchase_plan:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "purchase_plan:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "purchase_plan:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "purchase_plan:void", order: 8 },
    {
      id: "push-down:0", label: "生成采购合同", icon: "ArrowDownToLine", variant: "outline",
      allowedStatuses: ["approved"], permission: "purchase_plan:push_down", order: 10,
    },
  ],
}

/** 包材采购计划 - 表单操作 */
const packagingPurchasePlanFormActions: DocumentFormActionConfig = {
  typeId: "packaging_purchase_plan",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "purchase_plan:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "purchase_plan:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "purchase_plan:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "purchase_plan:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "purchase_plan:void", order: 8 },
    {
      id: "push-down:0", label: "生成采购合同", icon: "ArrowDownToLine", variant: "outline",
      allowedStatuses: ["approved"], permission: "purchase_plan:push_down", order: 10,
    },
  ],
}

/** 采购合同 - 表单操作 */
const purchaseContractFormActions: DocumentFormActionConfig = {
  typeId: "purchase_contract",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "purchase_contract:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "purchase_contract:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "purchase_contract:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "purchase_contract:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "purchase_contract:void", order: 8 },
  ],
}

/** 商品采购合同 - 表单操作 */
const productPurchaseContractFormActions: DocumentFormActionConfig = {
  typeId: "product_purchase_contract",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "purchase_contract:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "purchase_contract:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "purchase_contract:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "purchase_contract:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "purchase_contract:void", order: 8 },
  ],
}

/** 包材采购合同 - 表单操作 */
const packagingPurchaseContractFormActions: DocumentFormActionConfig = {
  typeId: "packaging_purchase_contract",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "purchase_contract:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "purchase_contract:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "purchase_contract:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "purchase_contract:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "purchase_contract:void", order: 8 },
  ],
}

/** 出运计划单 - 表单操作 */
const shippingPlanFormActions: DocumentFormActionConfig = {
  typeId: "shipping_plan",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "shipping_plan:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "shipping_plan:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "shipping_plan:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "shipping_plan:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "shipping_plan:void", order: 8 },
    {
      id: "push-down:0", label: "生成出运单", icon: "ArrowDownToLine", variant: "outline",
      allowedStatuses: ["approved"], permission: "shipping_plan:push_down", order: 10,
    },
  ],
}

/** 出运单 - 表单操作 */
const shippingOrderFormActions: DocumentFormActionConfig = {
  typeId: "shipping_order",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "shipping_order:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "shipping_order:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "shipping_order:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "shipping_order:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "shipping_order:void", order: 8 },
  ],
}

/** 商检单 - 表单操作 */
const inspectionDeclarationFormActions: DocumentFormActionConfig = {
  typeId: "inspection_declaration",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "inspection_declaration:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "inspection_declaration:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "inspection_declaration:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "inspection_declaration:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "inspection_declaration:void", order: 8 },
  ],
}

/** 报关单 - 表单操作 */
const customsDeclarationFormActions: DocumentFormActionConfig = {
  typeId: "customs_declaration",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "customs_declaration:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "customs_declaration:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "customs_declaration:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "customs_declaration:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "customs_declaration:void", order: 8 },
  ],
}

/** 结汇单 - 表单操作 */
const exchangeSettlementFormActions: DocumentFormActionConfig = {
  typeId: "exchange_settlement",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "exchange_settlement:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "exchange_settlement:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "exchange_settlement:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "exchange_settlement:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "exchange_settlement:void", order: 8 },
  ],
}

/** 开票通知 - 表单操作 */
const invoicingNoticeFormActions: DocumentFormActionConfig = {
  typeId: "invoicing_notice",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "invoicing_notice:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "invoicing_notice:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "invoicing_notice:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "invoicing_notice:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "invoicing_notice:void", order: 8 },
  ],
}

/** 付款申请 - 表单操作 */
const paymentApplyFormActions: DocumentFormActionConfig = {
  typeId: "payment_apply",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "payment_apply:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "payment_apply:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "payment_apply:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "payment_apply:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "payment_apply:void", order: 8 },
  ],
}

/** 付款单 - 列表操作 */
const paymentActionConfig: DocumentListActionConfig = {
  typeId: "payment",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "payment:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "payment:create" },
  ],
}

/** 付款单 - 表单操作 */
const paymentFormActions: DocumentFormActionConfig = {
  typeId: "payment",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "payment:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "payment:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "payment:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "payment:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "payment:void", order: 8 },
    {
      id: "push-down:0", label: "确认付款", icon: "CheckCircle", variant: "outline",
      allowedStatuses: ["approved"], permission: "payment:push_down", order: 10,
    },
  ],
}

/** 收款登记 - 列表操作 */
const receiptRegistrationActionConfig: DocumentListActionConfig = {
  typeId: "receipt_registration",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "receipt_registration:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "receipt_registration:create" },
  ],
}

/** 收款登记 - 表单操作 */
const receiptRegistrationFormActions: DocumentFormActionConfig = {
  typeId: "receipt_registration",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "receipt_registration:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "receipt_registration:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "receipt_registration:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
  ],
}

/** 回款认领 - 列表操作 */
const paymentClaimActionConfig: DocumentListActionConfig = {
  typeId: "payment_claim",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "payment_claim:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "payment_claim:create" },
  ],
}

/** 回款认领 - 表单操作 */
const paymentClaimFormActions: DocumentFormActionConfig = {
  typeId: "payment_claim",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "payment_claim:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "payment_claim:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "payment_claim:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
  ],
}

/** 发票登记 - 列表操作 */
const invoiceRegistrationActionConfig: DocumentListActionConfig = {
  typeId: "invoice_registration",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "invoice_registration:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "invoice_registration:create" },
  ],
}

/** 发票登记 - 表单操作 */
const invoiceRegistrationFormActions: DocumentFormActionConfig = {
  typeId: "invoice_registration",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "invoice_registration:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "invoice_registration:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "invoice_registration:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "invoice_registration:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "invoice_registration:void", order: 8 },
  ],
}

/** 加工单 - 表单操作 */
const processingOrderFormActions: DocumentFormActionConfig = {
  typeId: "processing_order",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "processing_order:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "processing_order:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "processing_order:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "processing_order:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "processing_order:void", order: 8 },
  ],
}

/** 报价单 - 列表操作 */
const quotationActionConfig: DocumentListActionConfig = {
  typeId: "quotation",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row.status === "draft",
      permission: "quotation:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "quotation:create" },
  ],
}

/** 报价单 - 表单操作 */
const quotationFormActions: DocumentFormActionConfig = {
  typeId: "quotation",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "quotation:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "quotation:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "quotation:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "quotation:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "quotation:void", order: 8 },
    {
      id: "push-down:0", label: "生成销售合同", icon: "ArrowDownToLine", variant: "outline",
      allowedStatuses: ["approved"], permission: "quotation:push_down", order: 10,
    },
  ],
}

/** 验货单 - 表单操作 */
const inspectionOrderFormActions: DocumentFormActionConfig = {
  typeId: "inspection_order",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "inspection_order:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "inspection_order:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "inspection_order:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "inspection_order:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    { id: "void", label: "作废", icon: "Trash2", variant: "destructive", allowedStatuses: ["approved"], permission: "inspection_order:void", order: 8 },
  ],
}

/** 让步接收单 - 表单操作 */
const concessionAcceptanceFormActions: DocumentFormActionConfig = {
  typeId: "concession_acceptance",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "concession_acceptance:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "concession_acceptance:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "concession_acceptance:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
  ],
}

/** 标准产品 - 表单操作 */
const standardProductFormActions: DocumentFormActionConfig = {
  typeId: "standard_product",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "standard_product:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "standard_product:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "standard_product:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
    {
      id: "push-down:0", label: "生成客户产品", icon: "ArrowDownToLine", variant: "outline",
      allowedStatuses: ["approved"], permission: "standard_product:push_down", order: 10,
    },
    {
      id: "push-down:1", label: "生成自营产品", icon: "ArrowDownToLine", variant: "outline",
      allowedStatuses: ["approved"], permission: "standard_product:push_down", order: 11,
    },
  ],
}

/** 客户产品 - 表单操作 */
const customerProductFormActions: DocumentFormActionConfig = {
  typeId: "customer_product",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "customer_product:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "customer_product:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "customer_product:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
  ],
}

/** 自营产品 - 表单操作 */
const selfOwnedProductFormActions: DocumentFormActionConfig = {
  typeId: "self_owned_product",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "self_owned_product:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "self_owned_product:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "self_owned_product:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
  ],
}

/** 客户通用表单操作 */
const customerFormActionsDef = (typeId: string): DocumentFormActionConfig => ({
  typeId,
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: `${typeId}:submit`, order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: `${typeId}:approve`, order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: `${typeId}:approve`, order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: `${typeId}:close`, order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
  ],
})

/** 供应商通用表单操作 */
const supplierFormActionsDef = (typeId: string): DocumentFormActionConfig => ({
  typeId,
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: `${typeId}:submit`, order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: `${typeId}:approve`, order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: `${typeId}:approve`, order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: `${typeId}:close`, order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
  ],
})

const manufacturerFormActions = supplierFormActionsDef("manufacturer")
const serviceProviderFormActions = supplierFormActionsDef("service_provider")
const logisticsFormActions = supplierFormActionsDef("logistics")

export function setupSchemas(): void {
  // 注册单据 Schema
  registry.registerSchema(salesContractSchema)
  registry.registerSchema(exportSalesContractSchema)
  registry.registerSchema(domesticSalesContractSchema)
  registry.registerSchema(jointVentureSalesContractSchema)
  registry.registerSchema(purchasePlanSchema)
  registry.registerSchema(productPurchasePlanSchema)
  registry.registerSchema(packagingPurchasePlanSchema)
  registry.registerSchema(purchaseContractSchema)
  registry.registerSchema(productPurchaseContractSchema)
  registry.registerSchema(packagingPurchaseContractSchema)

  // 注册产品 Schema
  registry.registerSchema(standardProductSchema)
  registry.registerSchema(customerProductSchema)
  registry.registerSchema(selfOwnedProductSchema)

  // 注册客户 Schema
  registry.registerSchema(customerSchema)
  registry.registerSchema(domesticCustomerSchema)
  registry.registerSchema(internationalCustomerSchema)

  // 注册供应商 Schema (三种子类型)
  registry.registerSchema(manufacturerSchema)
  registry.registerSchema(serviceProviderSchema)
  registry.registerSchema(logisticsSchema)

  // 注册仓库 Schema (四种单据)
  registry.registerSchema(warehouseInboundSchema)
  registry.registerSchema(warehouseOutboundSchema)
  registry.registerSchema(warehouseInboundNoticeSchema)
  registry.registerSchema(warehouseOutboundNoticeSchema)

  // 注册验货单 Schema
  registry.registerSchema(inspectionOrderSchema)

  // 注册让步接收单 Schema
  registry.registerSchema(concessionAcceptanceSchema)

  // 注册出运计划单 & 出运单 Schema
  registry.registerSchema(shippingPlanSchema)
  registry.registerSchema(shippingOrderSchema)

  // 注册商检单 & 报关单 Schema
  registry.registerSchema(inspectionDeclarationSchema)
  registry.registerSchema(customsDeclarationSchema)

  // 注册结汇单 Schema
  registry.registerSchema(exchangeSettlementSchema)

  // 注册开票通知 Schema
  registry.registerSchema(invoicingNoticeSchema)

  // 注册付款申请 Schema
  registry.registerSchema(paymentApplySchema)

  // 注册付款单 Schema
  registry.registerSchema(paymentSchema)

  // 注册收款登记 Schema
  registry.registerSchema(receiptRegistrationSchema)

  // 注册回款认领 Schema
  registry.registerSchema(paymentClaimSchema)

  // 注册发票登记 Schema
  registry.registerSchema(invoiceRegistrationSchema)

  // 注册加工单 Schema
  registry.registerSchema(processingOrderSchema)

  // 注册报价单 Schema
  registry.registerSchema(quotationSchema)

  // 注册采购流程下推规则
  registry.registerPushDownRule(salesContractToPurchasePlanRule)
  registry.registerPushDownRule(purchasePlanToPurchaseContractRule)

  // 注册出运流程下推规则
  registry.registerPushDownRule(shippingPlanToShippingOrderRule)

  // 注册产品下推规则
  registry.registerPushDownRule(standardToCustomerProductRule)
  registry.registerPushDownRule(standardToSelfOwnedProductRule)

  // 注册采购流程变更规则
  registry.registerChangeRule(salesContractChangeRule)
  registry.registerChangeRule(salesContractChangeToPurchasePlanRule)
  registry.registerChangeRule(purchasePlanChangeRule)
  registry.registerChangeRule(purchaseContractChangeRule)

  // 注册产品变更规则
  registry.registerChangeRule(standardProductChangeRule)

  // 注册客户变更规则
  registry.registerChangeRule(customerChangeRule)

  // 注册验货单变更规则
  registry.registerChangeRule(inspectionOrderChangeRule)

  // 注册让步接收单变更规则
  registry.registerChangeRule(concessionAcceptanceChangeRule)

  // 注册供应商变更规则 (三种子类型)
  registry.registerChangeRule(manufacturerChangeRule)
  registry.registerChangeRule(serviceProviderChangeRule)
  registry.registerChangeRule(logisticsChangeRule)

  // 注册出运流程变更规则
  registry.registerChangeRule(shippingPlanChangeRule)
  registry.registerChangeRule(shippingOrderChangeRule)

  // 注册商检单 & 报关单变更规则
  registry.registerChangeRule(inspectionDeclarationChangeRule)
  registry.registerChangeRule(customsDeclarationChangeRule)

  // 注册结汇单变更规则
  registry.registerChangeRule(exchangeSettlementChangeRule)

  // 注册开票通知变更规则
  registry.registerChangeRule(invoicingNoticeChangeRule)

  // 注册付款申请变更规则
  registry.registerChangeRule(paymentApplyChangeRule)

  // 注册付款单变更规则
  registry.registerChangeRule(paymentChangeRule)

  // 注册收款登记变更规则
  registry.registerChangeRule(receiptRegistrationChangeRule)

  // 注册回款认领变更规则
  registry.registerChangeRule(paymentClaimChangeRule)

  // 注册发票登记变更规则
  registry.registerChangeRule(invoiceRegistrationChangeRule)

  // 注册加工单变更规则
  registry.registerChangeRule(processingOrderChangeRule)

  // 注册报价单变更规则
  registry.registerChangeRule(quotationChangeRule)

  // 注册列表操作配置
  registry.registerActionConfig(salesContractActionConfig)
  registry.registerActionConfig(exportSalesContractActionConfig)
  registry.registerActionConfig(domesticSalesContractActionConfig)
  registry.registerActionConfig(jointVentureSalesContractActionConfig)
  registry.registerActionConfig(purchasePlanActionConfig)
  registry.registerActionConfig(productPurchasePlanActionConfig)
  registry.registerActionConfig(packagingPurchasePlanActionConfig)
  registry.registerActionConfig(purchaseContractActionConfig)
  registry.registerActionConfig(productPurchaseContractActionConfig)
  registry.registerActionConfig(packagingPurchaseContractActionConfig)
  registry.registerActionConfig(standardProductActionConfig)
  registry.registerActionConfig(customerProductActionConfig)
  registry.registerActionConfig(selfOwnedProductActionConfig)
  registry.registerActionConfig(domesticCustomerActionConfig)
  registry.registerActionConfig(internationalCustomerActionConfig)
  registry.registerActionConfig(customerActionConfig)
  registry.registerActionConfig(manufacturerActionConfig)
  registry.registerActionConfig(serviceProviderActionConfig)
  registry.registerActionConfig(logisticsActionConfig)
  registry.registerActionConfig(warehouseInboundActionConfig)
  registry.registerActionConfig(warehouseOutboundActionConfig)
  registry.registerActionConfig(warehouseInboundNoticeActionConfig)
  registry.registerActionConfig(warehouseOutboundNoticeActionConfig)
  registry.registerActionConfig(inspectionOrderActionConfig)
  registry.registerActionConfig(concessionAcceptanceActionConfig)
  registry.registerActionConfig(shippingPlanActionConfig)
  registry.registerActionConfig(shippingOrderActionConfig)
  registry.registerActionConfig(inspectionDeclarationActionConfig)
  registry.registerActionConfig(customsDeclarationActionConfig)
  registry.registerActionConfig(exchangeSettlementActionConfig)
  registry.registerActionConfig(invoicingNoticeActionConfig)
  registry.registerActionConfig(paymentApplyActionConfig)
  registry.registerActionConfig(paymentActionConfig)
  registry.registerActionConfig(receiptRegistrationActionConfig)
  registry.registerActionConfig(paymentClaimActionConfig)
  registry.registerActionConfig(invoiceRegistrationActionConfig)
  registry.registerActionConfig(processingOrderActionConfig)

  // 注册报价单列表操作配置
  registry.registerActionConfig(quotationActionConfig)

  // 注册表单操作配置
  registry.registerFormActionConfig(salesContractFormActions)
  registry.registerFormActionConfig(purchasePlanFormActions)
  registry.registerFormActionConfig(productPurchasePlanFormActions)
  registry.registerFormActionConfig(packagingPurchasePlanFormActions)
  registry.registerFormActionConfig(purchaseContractFormActions)
  registry.registerFormActionConfig(productPurchaseContractFormActions)
  registry.registerFormActionConfig(packagingPurchaseContractFormActions)
  registry.registerFormActionConfig(standardProductFormActions)
  registry.registerFormActionConfig(customerProductFormActions)
  registry.registerFormActionConfig(selfOwnedProductFormActions)
  registry.registerFormActionConfig(customerFormActionsDef("customer"))
  registry.registerFormActionConfig(customerFormActionsDef("domestic_customer"))
  registry.registerFormActionConfig(customerFormActionsDef("international_customer"))
  registry.registerFormActionConfig(manufacturerFormActions)
  registry.registerFormActionConfig(serviceProviderFormActions)
  registry.registerFormActionConfig(logisticsFormActions)
  registry.registerFormActionConfig(inspectionOrderFormActions)
  registry.registerFormActionConfig(concessionAcceptanceFormActions)
  registry.registerFormActionConfig(shippingPlanFormActions)
  registry.registerFormActionConfig(shippingOrderFormActions)
  registry.registerFormActionConfig(inspectionDeclarationFormActions)
  registry.registerFormActionConfig(customsDeclarationFormActions)
  registry.registerFormActionConfig(exchangeSettlementFormActions)
  registry.registerFormActionConfig(invoicingNoticeFormActions)
  registry.registerFormActionConfig(paymentApplyFormActions)
  registry.registerFormActionConfig(paymentFormActions)
  registry.registerFormActionConfig(receiptRegistrationFormActions)
  registry.registerFormActionConfig(paymentClaimFormActions)
  registry.registerFormActionConfig(invoiceRegistrationFormActions)
  registry.registerFormActionConfig(processingOrderFormActions)

  // 注册报价单表单操作配置
  registry.registerFormActionConfig(quotationFormActions)

  // 用户和角色数据已迁移到后端数据库，通过 seed 初始化
  // 审核规则已迁移到服务端数据库，无需前端注册
}

// 用户和角色数据已迁移到后端数据库
// 初始化通过 prisma seed 完成
// 测试账号：admin (admin123), demo (123456)

