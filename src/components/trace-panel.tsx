/**
 * TracePanel
 *
 * 追溯面板: 显示当前单据的上下游关系。
 */

import type { DocumentData } from "@/core/types"
import { registry } from "@/core/registry"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown } from "lucide-react"

interface TracePanelProps {
  upstream: DocumentData[]
  downstream: DocumentData[]
  onNavigate: (docId: string) => void
}

const statusLabels: Record<string, string> = {
  draft: "草稿",
  submitted: "已提交",
  approved: "已审批",
  closed: "已关闭",
  cancelled: "已取消",
}

export function TracePanel({
  upstream,
  downstream,
  onNavigate,
}: TracePanelProps) {
  if (upstream.length === 0 && downstream.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        无关联单据
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {upstream.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            上游单据
          </h4>
          <div className="space-y-1">
            {upstream.map((doc) => (
              <DocLink key={doc.id} doc={doc} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      )}
      {downstream.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <ArrowDown className="h-3 w-3" />
            下游单据
          </h4>
          <div className="space-y-1">
            {downstream.map((doc) => (
              <DocLink key={doc.id} doc={doc} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DocLink({
  doc,
  onNavigate,
}: {
  doc: DocumentData
  onNavigate: (docId: string) => void
}) {
  const schema = registry.getSchema(doc.typeId)
  return (
    <button
      className="w-full text-left p-2 rounded-md border hover:bg-accent transition-colors flex items-center justify-between"
      onClick={() => onNavigate(doc.id)}
    >
      <div>
        <span className="text-sm font-medium">{doc.docNumber}</span>
        <span className="text-xs text-muted-foreground ml-2">
          {schema?.typeName ?? doc.typeId}
        </span>
      </div>
      <Badge variant="outline" className="text-xs">
        {statusLabels[doc.status] ?? doc.status}
      </Badge>
    </button>
  )
}
