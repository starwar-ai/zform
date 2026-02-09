/**
 * Role API Client
 *
 * 角色管理 API 前端封装。
 */

import type { Role } from "@/types/role"

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

/** 获取角色列表 */
export async function fetchRolesApi(): Promise<Role[]> {
  return request<Role[]>("/roles")
}

/** 创建角色 */
export async function createRoleApi(data: {
  code: string
  name: string
  description?: string
  status?: string
}): Promise<Role> {
  return request<Role>("/roles", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/** 更新角色 */
export async function updateRoleApi(
  id: string,
  data: {
    name?: string
    description?: string
    status?: string
  }
): Promise<Role> {
  return request<Role>(`/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/** 删除角色 */
export async function deleteRoleApi(id: string): Promise<void> {
  await request<null>(`/roles/${id}`, {
    method: "DELETE",
  })
}

/** 获取角色菜单 ID 列表 */
export async function fetchRoleMenuIdsApi(roleId: string): Promise<string[]> {
  return request<string[]>(`/roles/${roleId}/menus`)
}

/** 分配菜单权限 */
export async function assignRoleMenusApi(
  roleId: string,
  menuIds: string[]
): Promise<void> {
  await request<null>(`/roles/${roleId}/menus`, {
    method: "PUT",
    body: JSON.stringify({ menuIds }),
  })
}
