import { useSidebarStore } from "@/stores/sidebar-store"
import { useTabStore } from "@/stores/tab-store"
import { registry } from "@/core"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  Users,
  Shield,
  Menu,
  type LucideIcon,
} from "lucide-react"

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  onClick: () => void
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export function Sidebar() {
  const { isExpanded, toggle } = useSidebarStore()
  const { openTab } = useTabStore()

  // 生成导航菜单项
  const homeItem: NavItem = {
    id: "home",
    label: "首页",
    icon: Home,
    onClick: () => openTab("document-list", {}, "单据列表"),
  }

  // 单据管理分组
  const schemas = registry.getAllSchemas()
  const documentItems: NavItem[] = schemas.map((schema) => ({
    id: schema.typeId,
    label: schema.typeName,
    icon: FileText,
    onClick: () =>
      openTab("type-list", { typeId: schema.typeId }, schema.typeName),
  }))

  // 系统管理分组
  const systemItems: NavItem[] = [
    {
      id: "user-management",
      label: "用户管理",
      icon: Users,
      onClick: () => openTab("user-management", {}, "用户管理"),
    },
    {
      id: "role-management",
      label: "角色管理",
      icon: Shield,
      onClick: () => openTab("role-management", {}, "角色管理"),
    },
    {
      id: "menu-management",
      label: "菜单管理",
      icon: Menu,
      onClick: () => openTab("menu-management", {}, "菜单管理"),
    },
  ]

  const navGroups: NavGroup[] = [
    { title: "单据管理", items: documentItems },
    { title: "系统管理", items: systemItems },
  ]

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-300",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      {/* 顶部标题 + 折叠按钮 */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {isExpanded && (
          <h1 className="text-lg font-semibold text-sidebar-foreground">
            ZForm
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {/* 首页 */}
        <Button
          variant="ghost"
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isExpanded ? "justify-start" : "justify-center"
          )}
          onClick={homeItem.onClick}
        >
          <Home className={cn("h-4 w-4", isExpanded && "mr-2")} />
          {isExpanded && <span>{homeItem.label}</span>}
        </Button>

        {/* 分组导航 */}
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="pt-2">
            <div className="my-2 border-t border-sidebar-border" />
            {isExpanded && (
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-sidebar-foreground/60">
                  {group.title}
                </p>
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isExpanded ? "justify-start" : "justify-center"
                  )}
                  onClick={item.onClick}
                >
                  <Icon className={cn("h-4 w-4", isExpanded && "mr-2")} />
                  {isExpanded && <span>{item.label}</span>}
                </Button>
              )
            })}
          </div>
        ))}
      </nav>

    </aside>
  )
}
