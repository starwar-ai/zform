/**
 * Example Setup
 *
 * 注册示例业务单据到 Registry。
 * 在应用启动时调用。
 */

import { registry } from "@/core/registry"
import {
  salesContractSchema,
  purchasePlanSchema,
  purchaseContractSchema,
  salesToPurchasePlanRule,
  purchasePlanToContractRule,
  salesContractChangeRule,
  purchasePlanChangeRule,
} from "./schemas"

export function setupExampleSchemas(): void {
  // 注册单据 Schema
  registry.registerSchema(salesContractSchema)
  registry.registerSchema(purchasePlanSchema)
  registry.registerSchema(purchaseContractSchema)

  // 注册下推规则
  registry.registerPushDownRule(salesToPurchasePlanRule)
  registry.registerPushDownRule(purchasePlanToContractRule)

  // 注册变更规则
  registry.registerChangeRule(salesContractChangeRule)
  registry.registerChangeRule(purchasePlanChangeRule)
}
