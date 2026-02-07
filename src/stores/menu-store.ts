import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"
import { nanoid } from "nanoid"
import type {
  Menu,
  CreateMenuInput,
  UpdateMenuInput,
  MenuTreeNode,
} from "@/types/menu"

interface MenuStoreState {
  menus: Record<string, Menu>

  // CRUD 操作
  createMenu: (input: CreateMenuInput) => Menu
  updateMenu: (id: string, input: UpdateMenuInput) => void
  deleteMenu: (id: string) => void
  getMenu: (id: string) => Menu | undefined
  getAllMenus: () => Menu[]
  getMenusByParent: (parentId: string | null) => Menu[]
  getMenuTree: () => MenuTreeNode[]
  getChildMenus: (parentId: string) => Menu[]
}

// 构建菜单树
function buildMenuTree(
  menus: Menu[],
  parentId: string | null = null,
  level: number = 0
): MenuTreeNode[] {
  return menus
    .filter((menu) => menu.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((menu) => ({
      ...menu,
      level,
      children: buildMenuTree(menus, menu.id, level + 1),
    }))
}

export const useMenuStore = create<MenuStoreState>()(
  persist(
    immer((set, get) => ({
      menus: {},

      createMenu: (input) => {
        const existingMenus = Object.values(get().menus)
        const maxOrder = existingMenus
          .filter((m) => m.parentId === (input.parentId ?? null))
          .reduce((max, m) => Math.max(max, m.order), 0)

        const menu: Menu = {
          id: nanoid(),
          title: input.title,
          icon: input.icon,
          path: input.path,
          parentId: input.parentId ?? null,
          order: input.order ?? maxOrder + 1,
          type: input.type ?? "menu",
          permission: input.permission,
          status: input.status ?? "visible",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set((draft) => {
          draft.menus[menu.id] = menu
        })

        return menu
      },

      updateMenu: (id, input) => {
        set((draft) => {
          const menu = draft.menus[id]
          if (!menu) return

          if (input.title !== undefined) menu.title = input.title
          if (input.icon !== undefined) menu.icon = input.icon
          if (input.path !== undefined) menu.path = input.path
          if (input.parentId !== undefined) menu.parentId = input.parentId
          if (input.order !== undefined) menu.order = input.order
          if (input.type !== undefined) menu.type = input.type
          if (input.permission !== undefined) menu.permission = input.permission
          if (input.status !== undefined) menu.status = input.status

          menu.updatedAt = Date.now()
        })
      },

      deleteMenu: (id) => {
        set((draft) => {
          // 递归删除所有子菜单
          const deleteRecursive = (menuId: string) => {
            const children = Object.values(draft.menus).filter(
              (m) => m.parentId === menuId
            )
            children.forEach((child) => deleteRecursive(child.id))
            delete draft.menus[menuId]
          }

          deleteRecursive(id)
        })
      },

      getMenu: (id) => {
        return get().menus[id]
      },

      getAllMenus: () => {
        return Object.values(get().menus)
      },

      getMenusByParent: (parentId) => {
        return Object.values(get().menus)
          .filter((menu) => menu.parentId === parentId)
          .sort((a, b) => a.order - b.order)
      },

      getMenuTree: () => {
        const allMenus = Object.values(get().menus)
        return buildMenuTree(allMenus)
      },

      getChildMenus: (parentId) => {
        return Object.values(get().menus).filter(
          (menu) => menu.parentId === parentId
        )
      },
    })),
    {
      name: "zform-menu-storage",
    }
  )
)
