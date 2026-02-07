/**
 * NotificationPanel
 *
 * 待处理审批任务通知面板，在 Popover 中展示。
 */

import { useNotificationStore } from "@/stores/notification-store"
import { useTabStore } from "@/stores/tab-store"
import { registry } from "@/core"
import { Clock, FileText, Inbox } from "lucide-react"

export function NotificationPanel() {
  const notifications = useNotificationStore((s) => s.notifications)
  const dismiss = useNotificationStore((s) => s.dismiss)
  const clearAll = useNotificationStore((s) => s.clearAll)
  const { openTab } = useTabStore()

  const handleClickItem = (n: (typeof notifications)[0]) => {
    // 打开对应单据 tab
    const schema = registry.getSchema(n.docType)
    const title = schema
      ? `${schema.typeName} - ${n.docId}`
      : `${n.docType} - ${n.docId}`

    openTab("document-form", { typeId: n.docType, docId: n.docId }, title)
    dismiss(n.id)
  }

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return `${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
    } catch {
      return dateStr
    }
  }

  return (
    <div className="w-80">
      {/* 标题栏 */}
      <div className="flex items-center justify-between pb-3 border-b mb-2">
        <span className="text-sm font-medium">
          待处理任务
          {notifications.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({notifications.length})
            </span>
          )}
        </span>
        {notifications.length > 0 && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={clearAll}
          >
            全部清除
          </button>
        )}
      </div>

      {/* 任务列表 */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Inbox className="h-8 w-8 mb-2 opacity-50" />
          <span className="text-sm">暂无待处理任务</span>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto -mx-1 px-1 space-y-1">
          {notifications.map((n) => (
            <button
              key={n.id}
              className="w-full text-left p-2.5 rounded-md hover:bg-accent transition-colors group"
              onClick={() => handleClickItem(n)}
            >
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {n.description}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(n.createdAt)}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
