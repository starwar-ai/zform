/**
 * Menu types
 * 菜单管理相关类型定义（与后端 SysMenu 模型对齐）
 */

export type MenuType = "menu" | "button"
export type MenuStatus = "visible" | "hidden"

export interface Menu {
  id: string
  title: string // 菜单标题
  icon?: string | null // 图标名称（lucide-react 图标名）
  path?: string | null // 路由路径
  parentId: string | null // 父菜单ID，null表示顶级菜单
  orderNum: number // 排序顺序
  menuType: MenuType // 类型：菜单/按钮
  permission?: string | null // 权限标识
  status: MenuStatus // 状态：显示/隐藏
  createdBy?: string | null
  createdAt: string // ISO 日期字符串
  updatedBy?: string | null
  updatedAt: string
  deletedAt?: string | null
}

export interface CreateMenuInput {
  title: string
  icon?: string
  path?: string
  parentId?: string | null
  orderNum?: number
  menuType?: MenuType
  permission?: string
  status?: MenuStatus
}

export interface UpdateMenuInput {
  title?: string
  icon?: string
  path?: string
  parentId?: string | null
  orderNum?: number
  menuType?: MenuType
  permission?: string
  status?: MenuStatus
}

// 菜单树节点（用于展示）
export interface MenuTreeNode extends Menu {
  children: MenuTreeNode[]
}
