/**
 * Example Approval Rules
 *
 * 示例审核规则定义。
 * 导出工厂函数, 在 setup 时根据实际角色 ID 生成规则。
 */

import type { ApprovalRule } from "@/core/types"

interface RoleIds {
  admin: string
  manager: string
}

/**
 * 创建示例审核规则
 * @param roles 角色 ID 映射 (从 roleStore 获取)
 */
export function createExampleApprovalRules(roles: RoleIds): ApprovalRule[] {
  /** 销售合同审核: 金额超过 10 万需要两级审批 */
  const salesContractApproval: ApprovalRule = {
    id: "sales_contract_approval",
    typeId: "sales_contract",
    name: "销售合同审核",
    levels: [
      {
        name: "业务经理审批",
        roleIds: [roles.manager],
      },
      {
        name: "总经理审批",
        roleIds: [roles.admin],
      },
    ],
    condition: (doc) => {
      const totalAmount = (doc.masterData.totalAmount as number) ?? 0
      return totalAmount > 100000
    },
  }

  /** 采购计划审核: 单级审批 */
  const purchasePlanApproval: ApprovalRule = {
    id: "purchase_plan_approval",
    typeId: "purchase_plan",
    name: "采购计划审核",
    levels: [
      {
        name: "业务经理审批",
        roleIds: [roles.manager],
      },
    ],
  }

  /** 采购合同审核: 两级审批, 第二级会签 */
  const purchaseContractApproval: ApprovalRule = {
    id: "purchase_contract_approval",
    typeId: "purchase_contract",
    name: "采购合同审核",
    levels: [
      {
        name: "业务经理审批",
        roleIds: [roles.manager],
      },
      {
        name: "管理层会签",
        mode: "all",
        roleIds: [roles.admin, roles.manager],
      },
    ],
  }

  return [
    salesContractApproval,
    purchasePlanApproval,
    purchaseContractApproval,
  ]
}
