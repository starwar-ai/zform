/**
 * StatusBar
 *
 * 底部状态栏，固定在右侧内容区最下方。
 * 右侧包含通知铃铛按钮，点击弹出待处理任务面板。
 */

import { Bell, User, LogOut, Settings } from "lucide-react"
import { useNotificationStore } from "@/stores/notification-store"
import { useAuthStore } from "@/stores/auth-store"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationPanel } from "@/components/notification-panel"

export function StatusBar() {
  const unreadCount = useNotificationStore((s) => s.unreadCount())
  const { currentUser, logout } = useAuthStore()

  const handleLogout = () => {
    if (confirm("确定要退出登录吗？")) {
      logout()
    }
  }

  return (
    <div className="h-8 border-t bg-background flex items-center justify-between px-3 shrink-0">
      {/* 左侧：系统信息 + 当前用户 */}
      <div className="flex items-center gap-3 min-w-0">
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-w-0">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-[120px]">{currentUser.name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel>我的账号</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 text-sm">
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-muted-foreground text-xs">{currentUser.email}</p>
                {currentUser.department && (
                  <p className="text-muted-foreground text-xs mt-1">
                    部门: {currentUser.department}
                  </p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Settings className="h-4 w-4 mr-2" />
                个人设置
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

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
