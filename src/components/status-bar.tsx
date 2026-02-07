/**
 * StatusBar
 *
 * 底部状态栏，固定在右侧内容区最下方。
 * 右侧包含通知铃铛按钮，点击弹出待处理任务面板。
 */

import { Bell } from "lucide-react"
import { useNotificationStore } from "@/stores/notification-store"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { NotificationPanel } from "@/components/notification-panel"

export function StatusBar() {
  const unreadCount = useNotificationStore((s) => s.unreadCount())

  return (
    <div className="h-8 border-t bg-background flex items-center justify-between px-3 shrink-0">
      {/* 左侧：系统信息 */}
      <div className="text-xs text-muted-foreground">ZForm</div>

      {/* 右侧：通知铃铛 */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="relative flex items-center justify-center h-6 w-6 rounded hover:bg-accent transition-colors">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium text-white bg-red-500 rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-auto p-3">
          <NotificationPanel />
        </PopoverContent>
      </Popover>
    </div>
  )
}
