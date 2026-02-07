/**
 * Example Setup
 *
 * 注册示例业务单据到 Registry，初始化默认用户和角色。
 * 在应用启动时调用。
 */

import { registry } from "@/core/registry"
import { useUserStore } from "@/stores/user-store"
import { useRoleStore } from "@/stores/role-store"
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

  // 初始化默认用户和角色
  initializeDefaultData()

  // 审核规则已迁移到服务端数据库，无需前端注册
}

/**
 * 初始化默认用户和角色
 */
function initializeDefaultData(): void {
  const roleStore = useRoleStore.getState()
  const userStore = useUserStore.getState()

  // 检查是否已经初始化过
  const existingRoles = roleStore.getAllRoles()
  if (existingRoles.length > 0) {
    // 已有数据，跳过初始化
    return
  }

  // 创建默认角色
  const adminRole = roleStore.createRole({
    code: "ADMIN",
    name: "系统管理员",
    description: "拥有系统所有权限",
    permissions: ["*"],
    status: "active",
  })

  const managerRole = roleStore.createRole({
    code: "MANAGER",
    name: "业务经理",
    description: "负责业务审批和管理",
    permissions: ["document:*", "user:view"],
    status: "active",
  })

  const userRole = roleStore.createRole({
    code: "USER",
    name: "普通用户",
    description: "普通业务人员",
    permissions: ["document:view", "document:create"],
    status: "active",
  })

  // 创建默认用户
  userStore.createUser({
    username: "admin",
    name: "系统管理员",
    email: "admin@zform.com",
    phone: "13800138000",
    roleIds: [adminRole.id],
    department: "技术部",
    status: "active",
  })

  userStore.createUser({
    username: "demo",
    name: "演示用户",
    email: "demo@zform.com",
    phone: "13800138001",
    roleIds: [userRole.id],
    department: "销售部",
    status: "active",
  })

  userStore.createUser({
    username: "manager",
    name: "张经理",
    email: "manager@zform.com",
    phone: "13800138002",
    roleIds: [managerRole.id],
    department: "业务部",
    status: "active",
  })

  console.log("✅ 默认用户和角色初始化完成")
  console.log("📋 测试账号：")
  console.log("   • admin (系统管理员)")
  console.log("   • demo (普通用户)")
  console.log("   • manager (业务经理)")
}

