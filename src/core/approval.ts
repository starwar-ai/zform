/**
 * Approval Types & Helpers
 *
 * 审核系统类型定义和前端辅助函数。
 * 审核引擎已迁移到服务端，此文件仅保留前端需要的类型和辅助工具。
 */

/** 审核动作标签映射 */
export const APPROVAL_ACTION_LABELS: Record<string, string> = {
  submit: "提交审核",
  approve: "审批通过",
  reject: "审批拒绝",
  withdraw: "撤回审核",
}

/** 审核状态标签映射 */
export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: "待提交",
  in_progress: "审批中",
  approved: "已通过",
  rejected: "已拒绝",
}

/** 审核状态对应的颜色 (用于 UI badge) */
export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  pending: "secondary",
  in_progress: "warning",
  approved: "success",
  rejected: "destructive",
}
