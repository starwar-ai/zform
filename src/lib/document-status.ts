/**
 * Document Status
 *
 * 单据状态相关的展示配置（标签、颜色等）。
 */

import type { DocumentStatus } from "@/core/types"

export const statusLabels: Record<DocumentStatus, string> = {
  PENDING: "待提交",
  DRAFT: "草稿",
  SUBMITTED: "已提交",
  APPROVED: "已审批",
  REJECTED: "已拒绝",
  CLOSED: "已关闭",
  CANCELLED: "已取消",
}

export const statusColors: Record<
  DocumentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  DRAFT: "secondary",
  SUBMITTED: "default",
  APPROVED: "default",
  REJECTED: "destructive",
  CLOSED: "outline",
  CANCELLED: "destructive",
}
