/**
 * Document Status
 *
 * 单据状态相关的展示配置（标签、颜色等）。
 */

import type { DocumentStatus } from "@/core/types"

export const statusLabels: Record<DocumentStatus, string> = {
  draft: "草稿",
  submitted: "已提交",
  approved: "已审批",
  closed: "已关闭",
  cancelled: "已取消",
}

export const statusColors: Record<
  DocumentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  submitted: "default",
  approved: "default",
  closed: "outline",
  cancelled: "destructive",
}
