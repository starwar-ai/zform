import { useEffect, useState } from "react"
import { useSidebarStore } from "@/stores/sidebar-store"
import { useTabStore, type TabType } from "@/stores/tab-store"
import { useMenuStore } from "@/stores/menu-store"
import { useAuthStore } from "@/stores/auth-store"
import type { MenuTreeNode } from "@/types/menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  FileText,
  Users,
  Shield,
  Menu,
  Settings,
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Truck,
  Building2,
  CreditCard,
  Bell,
  BarChart3,
  FolderOpen,
  Database,
  Globe,
  Lock,
  KeyRound,
  type LucideIcon,
} from "lucide-react"

// lucide-react 图标映射表
const iconMap: Record<string, LucideIcon> = {
  Home,
  FileText,
  Users,
  Shield,
  Menu,
  Settings,
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Truck,
  Building2,
  CreditCard,
  Bell,
  BarChart3,
  FolderOpen,
  Database,
  Globe,
  Lock,
  KeyRound,
  ChevronLeft,
  ChevronRight,
}

/** 根据图标名获取对应的 lucide-react 组件 */
function getIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return FileText
  return iconMap[iconName] || FileText
}

/** 递归过滤菜单树，移除按钮类型的菜单项 */
function filterButtonMenus(nodes: MenuTreeNode[]): MenuTreeNode[] {
  return nodes
    .filter((node) => node.menuType !== "button")
    .map((node) => ({
      ...node,
      children: filterButtonMenus(node.children),
    }))
}

/** 解析菜单路径，转换为 openTab 调用参数 */
function parseMenuPath(path?: string | null): {
  type: TabType
  params?: Record<string, unknown>
} | null {
  if (!path) return null

  // 处理 type-list 路径: /type-list/sales_contract
  if (path.startsWith("/type-list/")) {
    const typeId = path.replace("/type-list/", "")
    return { type: "type-list", params: { typeId } }
  }

  // 直接映射 tab 类型
  const pathToTabType: Record<string, TabType> = {
    "/dashboard": "dashboard",
    "/user-management": "user-management",
    "/role-management": "role-management",
    "/menu-management": "menu-management",
    "/department-management": "department-management",
  }

  const tabType = pathToTabType[path]
  if (tabType) {
    return { type: tabType }
  }

  return null
}

/** 递归菜单项组件 */
function MenuItemRenderer({
  node,
  isExpanded: isSidebarExpanded,
  expandedMenuIds,
  onToggleExpand,
  onClickMenu,
}: {
  node: MenuTreeNode
  isExpanded: boolean
  expandedMenuIds: Set<string>
  onToggleExpand: (id: string) => void
  onClickMenu: (node: MenuTreeNode) => void
}) {
  const Icon = getIcon(node.icon)
  const hasChildren = node.children.length > 0
  const isMenuExpanded = expandedMenuIds.has(node.id)

  if (!isSidebarExpanded) {
    // 折叠模式：只显示图标
    return (
      <div>
        <Button
          variant="ghost"
          className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => {
            if (hasChildren) {
              onToggleExpand(node.id)
            } else {
              onClickMenu(node)
            }
          }}
          title={node.title}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          hasChildren && "pr-2"
        )}
        onClick={() => {
          if (hasChildren) {
            onToggleExpand(node.id)
          } else {
            onClickMenu(node)
          }
        }}
      >
        <Icon className="h-4 w-4 mr-2 shrink-0" />
        <span className="truncate flex-1 text-left">{node.title}</span>
        {hasChildren && (
          <ChevronDown
            className={cn(
              "h-3 w-3 shrink-0 transition-transform text-muted-foreground",
              !isMenuExpanded && "-rotate-90"
            )}
          />
        )}
      </Button>
      {/* 子菜单 */}
      {hasChildren && isMenuExpanded && (
        <div className="ml-4 space-y-0.5">
          {node.children.map((child) => (
            <MenuItemRenderer
              key={child.id}
              node={child}
              isExpanded={isSidebarExpanded}
              expandedMenuIds={expandedMenuIds}
              onToggleExpand={onToggleExpand}
              onClickMenu={onClickMenu}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { isExpanded, toggle } = useSidebarStore()
  const { openTab } = useTabStore()
  const { userMenuTree, fetchUserMenus } = useMenuStore()
  const { isAuthenticated } = useAuthStore()
  const [expandedMenuIds, setExpandedMenuIds] = useState<Set<string>>(new Set())

  // 登录后加载用户可见菜单
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserMenus()
    }
  }, [isAuthenticated, fetchUserMenus])

  // 默认展开所有有子菜单的顶级菜单
  useEffect(() => {
    if (userMenuTree.length > 0) {
      const ids = new Set<string>()
      userMenuTree.forEach((node) => {
        if (node.children.length > 0) {
          ids.add(node.id)
        }
      })
      setExpandedMenuIds(ids)
    }
  }, [userMenuTree])

  const handleToggleExpand = (id: string) => {
    setExpandedMenuIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleClickMenu = (node: MenuTreeNode) => {
    const parsed = parseMenuPath(node.path)
    if (parsed) {
      openTab(parsed.type, parsed.params, node.title)
    }
  }

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
        {/* 首页（始终显示） */}
        <Button
          variant="ghost"
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isExpanded ? "justify-start" : "justify-center"
          )}
          onClick={() => openTab("dashboard", {}, "首页")}
        >
          <Home className={cn("h-4 w-4", isExpanded && "mr-2")} />
          {isExpanded && <span>首页</span>}
        </Button>

        {/* 动态菜单 */}
        {userMenuTree.length > 0 && (
          <>
            <div className="my-2 border-t border-sidebar-border" />
            {filterButtonMenus(userMenuTree).map((node) => (
              <MenuItemRenderer
                key={node.id}
                node={node}
                isExpanded={isExpanded}
                expandedMenuIds={expandedMenuIds}
                onToggleExpand={handleToggleExpand}
                onClickMenu={handleClickMenu}
              />
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}
