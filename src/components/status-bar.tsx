/**
 * StatusBar
 *
 * 底部状态栏，固定在右侧内容区最下方。
 */

import { useState } from "react"
import { User, LogOut, Settings } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserSettingsDialog } from "@/components/user-settings-dialog"

export function StatusBar() {
  const { currentUser, logout } = useAuthStore()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleLogout = () => {
    if (confirm("确定要退出登录吗？")) {
      logout()
    }
  }

  return (
    <div className="h-8 border-t bg-background flex items-center justify-between px-3 shrink-0">
      {/* 左侧：当前用户 */}
      <div className="flex items-center gap-3 min-w-0">
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-w-0">
                <User className="h-3.5 w-3.5 shrink-0" />
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
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
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

      {/* 右侧空白 */}
      <div />
      
      <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
