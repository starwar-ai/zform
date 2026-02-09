/**
 * Menu API Client
 *
 * 菜单管理 API 前端封装。
 */

import type { Menu, MenuTreeNode } from "@/types/menu"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api"

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/** 通用请求函数 */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { useAuthStore } = await import("@/stores/auth-store")
  const currentUser = useAuthStore.getState().currentUser

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (currentUser) {
    headers["x-user-id"] = currentUser.id
    headers["x-user-name"] = encodeURIComponent(currentUser.name)
    headers["x-user-roles"] = currentUser.roleIds.join(",")
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const json: ApiResponse<T> = await res.json()

  if (!res.ok || !json.success) {
    throw new Error(json.message || `请求失败: ${res.status}`)
  }

  return json.data
}

/** 获取全部菜单（扁平列表） */
export async function fetchMenusApi(): Promise<Menu[]> {
  return request<Menu[]>("/menus")
}

/** 获取菜单树 */
export async function fetchMenuTreeApi(): Promise<MenuTreeNode[]> {
  return request<MenuTreeNode[]>("/menus/tree")
}

/** 获取当前用户可见菜单树 */
export async function fetchUserMenusApi(): Promise<MenuTreeNode[]> {
  return request<MenuTreeNode[]>("/menus/user-menus")
}

/** 创建菜单 */
export async function createMenuApi(data: {
  title: string
  icon?: string
  path?: string
  parentId?: string | null
  orderNum?: number
  menuType?: string
  permission?: string
  status?: string
}): Promise<Menu> {
  return request<Menu>("/menus", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/** 更新菜单 */
export async function updateMenuApi(
  id: string,
  data: {
    title?: string
    icon?: string
    path?: string
    parentId?: string | null
    orderNum?: number
    menuType?: string
    permission?: string
    status?: string
  }
): Promise<Menu> {
  return request<Menu>(`/menus/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/** 删除菜单 */
export async function deleteMenuApi(id: string): Promise<void> {
  await request<null>(`/menus/${id}`, {
    method: "DELETE",
  })
}

/** 批量更新排序 */
export async function reorderMenusApi(
  items: { id: string; orderNum: number }[]
): Promise<void> {
  await request<null>("/menus/reorder", {
    method: "PUT",
    body: JSON.stringify({ items }),
  })
}
