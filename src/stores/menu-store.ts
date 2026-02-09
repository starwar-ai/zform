import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type {
  Menu,
  CreateMenuInput,
  UpdateMenuInput,
  MenuTreeNode,
} from "@/types/menu"
import {
  fetchMenusApi,
  fetchMenuTreeApi,
  fetchUserMenusApi,
  createMenuApi,
  updateMenuApi,
  deleteMenuApi,
  reorderMenusApi,
} from "@/apis/menu-api"

interface MenuStoreState {
  menus: Menu[]
  menuTree: MenuTreeNode[]
  userMenuTree: MenuTreeNode[] // 当前用户可见菜单
  loading: boolean
  error: string | null

  // 异步操作
  fetchMenus: () => Promise<void>
  fetchMenuTree: () => Promise<void>
  fetchUserMenus: () => Promise<void>
  createMenu: (input: CreateMenuInput) => Promise<Menu>
  updateMenu: (id: string, input: UpdateMenuInput) => Promise<void>
  deleteMenu: (id: string) => Promise<void>
  reorderMenus: (items: { id: string; orderNum: number }[]) => Promise<void>

  // 辅助方法
  getMenu: (id: string) => Menu | undefined
  getAllMenus: () => Menu[]
  getMenuTree: () => MenuTreeNode[]
  getMenusByParent: (parentId: string | null) => Menu[]
}

export const useMenuStore = create<MenuStoreState>()(
  immer((set, get) => ({
    menus: [],
    menuTree: [],
    userMenuTree: [],
    loading: false,
    error: null,

    fetchMenus: async () => {
      set((draft) => {
        draft.loading = true
        draft.error = null
      })
      try {
        const menus = await fetchMenusApi()
        set((draft) => {
          draft.menus = menus
          draft.loading = false
        })
      } catch (err) {
        set((draft) => {
          draft.error = err instanceof Error ? err.message : "获取菜单失败"
          draft.loading = false
        })
      }
    },

    fetchMenuTree: async () => {
      set((draft) => {
        draft.loading = true
        draft.error = null
      })
      try {
        const tree = await fetchMenuTreeApi()
        set((draft) => {
          draft.menuTree = tree
          draft.loading = false
        })
      } catch (err) {
        set((draft) => {
          draft.error = err instanceof Error ? err.message : "获取菜单树失败"
          draft.loading = false
        })
      }
    },

    fetchUserMenus: async () => {
      try {
        const tree = await fetchUserMenusApi()
        set((draft) => {
          draft.userMenuTree = tree
        })
      } catch (err) {
        console.error("获取用户菜单失败:", err)
      }
    },

    createMenu: async (input) => {
      const menu = await createMenuApi({
        title: input.title,
        icon: input.icon,
        path: input.path,
        parentId: input.parentId,
        orderNum: input.orderNum,
        menuType: input.menuType,
        permission: input.permission,
        status: input.status,
      })
      // 刷新菜单树
      await get().fetchMenuTree()
      await get().fetchMenus()
      return menu
    },

    updateMenu: async (id, input) => {
      await updateMenuApi(id, {
        title: input.title,
        icon: input.icon,
        path: input.path,
        parentId: input.parentId,
        orderNum: input.orderNum,
        menuType: input.menuType,
        permission: input.permission,
        status: input.status,
      })
      // 刷新菜单树
      await get().fetchMenuTree()
      await get().fetchMenus()
    },

    deleteMenu: async (id) => {
      await deleteMenuApi(id)
      // 刷新菜单树
      await get().fetchMenuTree()
      await get().fetchMenus()
    },

    reorderMenus: async (items) => {
      await reorderMenusApi(items)
      // 刷新菜单树
      await get().fetchMenuTree()
      await get().fetchMenus()
    },

    getMenu: (id) => {
      return get().menus.find((m) => m.id === id)
    },

    getAllMenus: () => {
      return get().menus
    },

    getMenuTree: () => {
      return get().menuTree
    },

    getMenusByParent: (parentId) => {
      return get().menus
        .filter((menu) => menu.parentId === parentId)
        .sort((a, b) => a.orderNum - b.orderNum)
    },
  }))
)
