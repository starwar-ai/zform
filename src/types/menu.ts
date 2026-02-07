/**
 * Menu types
 * 菜单管理相关类型定义
 */

export type MenuType = "menu" | "button"
export type MenuStatus = "visible" | "hidden"

export interface Menu {
  id: string
  title: string // 菜单标题
  icon?: string // 图标名称（lucide-react 图标名）
  path?: string // 路由路径
  parentId: string | null // 父菜单ID，null表示顶级菜单
  order: number // 排序顺序
  type: MenuType // 类型：菜单/按钮
  permission?: string // 权限标识（预留）
  status: MenuStatus // 状态：显示/隐藏
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

export interface CreateMenuInput {
  title: string
  icon?: string
  path?: string
  parentId?: string | null
  order?: number
  type?: MenuType
  permission?: string
  status?: MenuStatus
}

export interface UpdateMenuInput {
  title?: string
  icon?: string
  path?: string
  parentId?: string | null
  order?: number
  type?: MenuType
  permission?: string
  status?: MenuStatus
}

// 菜单树节点（用于展示）
export interface MenuTreeNode extends Menu {
  children: MenuTreeNode[]
  level: number // 层级深度，从0开始
}
