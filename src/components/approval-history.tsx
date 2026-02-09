/**
 * Approval History Panel (审核记录面板)
 *
 * 以时间线形式展示单据的审核历史记录。
 * 包含审核状态、每一步审核动作（谁、什么时间、通过/拒绝、意见）。
 */

import { useApproval } from "@/hooks/use-approval"
import {
  APPROVAL_ACTION_LABELS,
  APPROVAL_STATUS_LABELS,
} from "@/core/approval"
import type { ApprovalInstanceResponse, ApprovalRecordResponse } from "@/apis/approval-api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface ApprovalHistoryProps {
  docType: string
  docId: string
  className?: string
  /** 嵌入模式：不渲染外层 Card，直接输出内容 */
  embedded?: boolean
}

/** 审核动作图标 */
function ActionIcon({ action }: { action: string }) {
  const icons: Record<string, { icon: string; color: string }> = {
    submit: { icon: "📤", color: "text-blue-500" },
    approve: { icon: "✅", color: "text-green-500" },
    reject: { icon: "❌", color: "text-red-500" },
    withdraw: { icon: "↩️", color: "text-yellow-500" },
  }
  const { icon, color } = icons[action] ?? { icon: "•", color: "text-gray-500" }
  return <span className={cn("text-lg", color)}>{icon}</span>
}

/** 审核状态 Badge */
function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    in_progress: "default",
    approved: "default",
    rejected: "destructive",
  }
  const colorMap: Record<string, string> = {
    approved: "bg-green-600 hover:bg-green-600/80",
    in_progress: "bg-blue-600 hover:bg-blue-600/80",
  }

  return (
    <Badge
      variant={variantMap[status] ?? "outline"}
      className={colorMap[status] ?? ""}
    >
      {APPROVAL_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

/** 格式化时间 */
function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** 单条审核记录 */
function RecordItem({ record }: { record: ApprovalRecordResponse }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 flex-shrink-0">
        <ActionIcon action={record.action} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{record.userName}</span>
          <span className="text-sm text-muted-foreground">
            {APPROVAL_ACTION_LABELS[record.action] ?? record.action}
          </span>
          {record.level > 0 && (
            <span className="text-xs text-muted-foreground">
              (第{record.level}级)
            </span>
          )}
        </div>
        {record.comment && (
          <p className="mt-1 text-sm text-muted-foreground bg-muted/50 rounded px-2 py-1">
            {record.comment}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatTime(record.createdAt)}
        </p>
      </div>
    </div>
  )
}

/** 单个审核实例块（一次完整的审核流程） */
function InstanceBlock({ instance }: { instance: ApprovalInstanceResponse }) {
  const levels = instance.rule.levels
  const totalLevels = levels.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{instance.rule.name}</span>
          <StatusBadge status={instance.status} />
        </div>
        {instance.status === "in_progress" && (
          <span className="text-xs text-muted-foreground">
            第 {instance.currentLevel} / {totalLevels} 级:
            {" "}{levels[instance.currentLevel - 1]?.name}
          </span>
        )}
      </div>
      <div className="border-l-2 border-muted ml-2 pl-3 space-y-0.5">
        {instance.records.map((record) => (
          <RecordItem key={record.id} record={record} />
        ))}
      </div>
    </div>
  )
}

/**
 * 审核历史面板
 */
/** 审核记录内容（不含外层 Card） */
function ApprovalContent({ instances, loading }: { instances: ApprovalInstanceResponse[]; loading: boolean }) {
  if (loading && instances.length === 0) {
    return <p className="text-sm text-muted-foreground">加载中...</p>
  }

  if (instances.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无审核记录</p>
  }

  return (
    <div className="space-y-4">
      {instances.map((instance, idx) => (
        <div key={instance.id}>
          {idx > 0 && <Separator className="my-3" />}
          <InstanceBlock instance={instance} />
        </div>
      ))}
    </div>
  )
}

/**
 * 审核历史面板
 */
export function ApprovalHistory({ docType, docId, className, embedded }: ApprovalHistoryProps) {
  const { instances, loading } = useApproval(docType, docId)

  if (embedded) {
    return (
      <div className={className}>
        <ApprovalContent instances={instances} loading={loading} />
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">审核记录</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <ApprovalContent instances={instances} loading={loading} />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
