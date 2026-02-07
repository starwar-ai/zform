/**
 * Example Setup
 *
 * 注册示例业务单据到 Registry。
 * 在应用启动时调用。
 */

import { registry } from "@/core/registry"
import {
  salesContractSchema,
  purchaseContractSchema,
} from "./schemas"
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
  purchasePlanToPurchaseContractRule,
  salesContractChangeToPurchasePlanRule,
  purchasePlanChangeRule,
} from "./purchase-plan-schemas"

export function setupExampleSchemas(): void {
  // 注册单据 Schema
  registry.registerSchema(salesContractSchema)
  registry.registerSchema(purchasePlanSchema)
  registry.registerSchema(purchaseContractSchema)

  // 注册产品 Schema
  registry.registerSchema(standardProductSchema)
  registry.registerSchema(customerProductSchema)
  registry.registerSchema(selfOwnedProductSchema)

  // 注册采购下推规则
  registry.registerPushDownRule(salesContractToPurchasePlanRule)
  registry.registerPushDownRule(purchasePlanToPurchaseContractRule)

  // 注册产品下推规则
  registry.registerPushDownRule(standardToCustomerProductRule)
  registry.registerPushDownRule(standardToSelfOwnedProductRule)

  // 注册采购变更规则
  registry.registerChangeRule(salesContractChangeToPurchasePlanRule)
  registry.registerChangeRule(purchasePlanChangeRule)

  // 注册产品变更规则
  registry.registerChangeRule(standardProductChangeRule)
}
