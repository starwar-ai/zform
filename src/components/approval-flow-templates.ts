/**
 * ApprovalFlowTemplates
 *
 * 流程预置模板。纯前端静态数据，新建规则时可选择模板预填 levels。
 */

import type { ApprovalLevelConfig } from "@/apis/approval-api"

export interface ApprovalTemplate {
  id: string
  name: string
  description: string
  levels: ApprovalLevelConfig[]
}

export const approvalTemplates: ApprovalTemplate[] = [
  {
    id: "single-level",
    name: "单级审批",
    description: "一位审批人即可通过，适用于简单业务",
    levels: [
      { name: "审批", mode: "any", roleIds: [], userIds: [] },
    ],
  },
  {
    id: "two-level",
    name: "两级审批",
    description: "部门主管审批后，由上级领导终审",
    levels: [
      { name: "部门主管审批", mode: "any", roleIds: [], userIds: [] },
      { name: "上级领导审批", mode: "any", roleIds: [], userIds: [] },
    ],
  },
  {
    id: "countersign",
    name: "会签审批",
    description: "所有指定审批人都需通过",
    levels: [
      { name: "会签审批", mode: "all", roleIds: [], userIds: [] },
    ],
  },
  {
    id: "dept-to-gm",
    name: "部门→总经理",
    description: "经理审批后由总经理终审",
    levels: [
      { name: "经理审批", mode: "any", roleIds: ["MANAGER"], userIds: [] },
      { name: "总经理审批", mode: "any", roleIds: ["ADMIN"], userIds: [] },
    ],
  },
  {
    id: "three-level",
    name: "三级审批",
    description: "主管→经理→总经理，逐级审批",
    levels: [
      { name: "主管审批", mode: "any", roleIds: [], userIds: [] },
      { name: "经理审批", mode: "any", roleIds: ["MANAGER"], userIds: [] },
      { name: "总经理审批", mode: "any", roleIds: ["ADMIN"], userIds: [] },
    ],
  },
]
