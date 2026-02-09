/**
 * Data Permission API Client
 *
 * 数据权限管理 API 前端封装。
 */

import type { DataPermission, SaveDataPermissionInput } from "@/types/data-permission"

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

/** 获取角色的数据权限 */
export async function fetchRoleDataPermissionsApi(roleId: string): Promise<DataPermission[]> {
  return request<DataPermission[]>(`/data-permissions/role/${roleId}`)
}

/** 批量保存角色的数据权限 */
export async function saveRoleDataPermissionsApi(
  roleId: string,
  permissions: SaveDataPermissionInput[]
): Promise<DataPermission[]> {
  return request<DataPermission[]>(`/data-permissions/role/${roleId}`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  })
}

/** 删除单条数据权限 */
export async function deleteDataPermissionApi(id: string): Promise<void> {
  await request<null>(`/data-permissions/${id}`, {
    method: "DELETE",
  })
}
