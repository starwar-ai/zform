/**
 * AppHeader
 * 应用顶部导航栏
 */

import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings } from "lucide-react"

export function AppHeader() {
  const { currentUser, logout } = useAuthStore()

  if (!currentUser) return null

  const handleLogout = () => {
    if (confirm("确定要退出登录吗？")) {
      logout()
    }
  }

  return (
    <header className="h-14 border-b bg-background px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold">ZForm</h1>
        <span className="text-sm text-muted-foreground">
          企业单据管理系统
        </span>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <User className="h-4 w-4" />
              <span>{currentUser.name}</span>
              <Badge variant="outline" className="text-xs">
                {currentUser.username}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>我的账号</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-sm">
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-muted-foreground text-xs">
                {currentUser.email}
              </p>
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
      </div>
    </header>
  )
}
