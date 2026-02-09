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
  salesContractChangeRule,
} from "./sales-contract-schemas"
import {
  purchaseContractSchema,
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
  salesContractToPurchasePlanRule,
  salesContractChangeToPurchasePlanRule,
  purchasePlanChangeRule,
} from "./purchase-plan-schemas"
import {
  customerSchema,
  customerChangeRule,
} from "./customer-schemas"
import {
  supplierSchema,
  supplierChangeRule,
} from "./supplier-schemas"

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
      visible: (row) => row._status === "draft",
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
      visible: (row) => row._status === "draft",
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
      visible: (row) => row._status === "draft",
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
      visible: (row) => row._status === "draft",
      permission: "customer:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "customer:create" },
  ],
}

/** 供应商 - 列表操作 */
const supplierActionConfig: DocumentListActionConfig = {
  typeId: "supplier",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row._status === "draft",
      permission: "supplier:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "supplier:create" },
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

/** 客户 - 表单操作 */
const customerFormActions: DocumentFormActionConfig = {
  typeId: "customer",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "customer:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "customer:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "customer:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "customer:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
  ],
}

/** 供应商 - 表单操作 */
const supplierFormActions: DocumentFormActionConfig = {
  typeId: "supplier",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "supplier:submit", order: 2 },
    {
      id: "approve", label: "审批", icon: "Check", allowedStatuses: ["submitted"],
      permission: "supplier:approve", order: 3,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "reject", label: "拒绝", icon: "X", variant: "destructive", allowedStatuses: ["submitted"],
      permission: "supplier:approve", order: 4,
      visible: (ctx) => ctx.approvalState?.canApprove ?? false,
    },
    {
      id: "withdraw", label: "撤回", icon: "Undo2", variant: "outline", allowedStatuses: ["submitted"], order: 5,
      visible: (ctx) => ctx.approvalState?.canWithdraw ?? false,
    },
    { id: "close", label: "关闭", icon: "Lock", variant: "outline", allowedStatuses: ["approved"], permission: "supplier:close", order: 6 },
    { id: "cancel", label: "取消", icon: "Ban", variant: "destructive", allowedStatuses: ["draft"], order: 7 },
  ],
}

export function setupSchemas(): void {
  // 注册单据 Schema
  registry.registerSchema(salesContractSchema)
  registry.registerSchema(purchasePlanSchema)
  registry.registerSchema(purchaseContractSchema)

  // 注册产品 Schema
  registry.registerSchema(standardProductSchema)
  registry.registerSchema(customerProductSchema)
  registry.registerSchema(selfOwnedProductSchema)

  // 注册客户 Schema
  registry.registerSchema(customerSchema)

  // 注册供应商 Schema
  registry.registerSchema(supplierSchema)

  // 注册采购流程下推规则
  registry.registerPushDownRule(salesContractToPurchasePlanRule)
  registry.registerPushDownRule(purchasePlanToPurchaseContractRule)

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

  // 注册供应商变更规则
  registry.registerChangeRule(supplierChangeRule)

  // 注册列表操作配置
  registry.registerActionConfig(salesContractActionConfig)
  registry.registerActionConfig(purchasePlanActionConfig)
  registry.registerActionConfig(purchaseContractActionConfig)
  registry.registerActionConfig(standardProductActionConfig)
  registry.registerActionConfig(customerProductActionConfig)
  registry.registerActionConfig(selfOwnedProductActionConfig)
  registry.registerActionConfig(customerActionConfig)
  registry.registerActionConfig(supplierActionConfig)

  // 注册表单操作配置
  registry.registerFormActionConfig(salesContractFormActions)
  registry.registerFormActionConfig(purchasePlanFormActions)
  registry.registerFormActionConfig(purchaseContractFormActions)
  registry.registerFormActionConfig(standardProductFormActions)
  registry.registerFormActionConfig(customerProductFormActions)
  registry.registerFormActionConfig(selfOwnedProductFormActions)
  registry.registerFormActionConfig(customerFormActions)
  registry.registerFormActionConfig(supplierFormActions)

  // 用户和角色数据已迁移到后端数据库，通过 seed 初始化
  // 审核规则已迁移到服务端数据库，无需前端注册
}

// 用户和角色数据已迁移到后端数据库
// 初始化通过 prisma seed 完成
// 测试账号：admin (admin123), demo (123456)

