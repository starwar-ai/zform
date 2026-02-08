/**
 * Example Setup
 *
 * 注册示例业务单据到 Registry，初始化默认用户和角色。
 * 在应用启动时调用。
 */

import { registry } from "@/core/registry"
import type { DocumentListActionConfig } from "@/core/types"
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
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline" },
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
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline" },
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
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline" },
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
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline" },
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
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline" },
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
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline" },
  ],
}

export function setupExampleSchemas(): void {
  // 注册单据 Schema
  registry.registerSchema(salesContractSchema)
  registry.registerSchema(purchasePlanSchema)
  registry.registerSchema(purchaseContractSchema)

  // 注册产品 Schema
  registry.registerSchema(standardProductSchema)
  registry.registerSchema(customerProductSchema)
  registry.registerSchema(selfOwnedProductSchema)

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

  // 注册列表操作配置
  registry.registerActionConfig(salesContractActionConfig)
  registry.registerActionConfig(purchasePlanActionConfig)
  registry.registerActionConfig(purchaseContractActionConfig)
  registry.registerActionConfig(standardProductActionConfig)
  registry.registerActionConfig(customerProductActionConfig)
  registry.registerActionConfig(selfOwnedProductActionConfig)

  // 用户和角色数据已迁移到后端数据库，通过 seed 初始化
  // 审核规则已迁移到服务端数据库，无需前端注册
}

// 用户和角色数据已迁移到后端数据库
// 初始化通过 prisma seed 完成
// 测试账号：admin (admin123), demo (123456)

