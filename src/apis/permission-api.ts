/**
 * Permission API Client
 *
 * 操作权限管理 API 前端封装。
 */

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

/** 权限项 */
export interface Permission {
  id: string
  code: string
  name: string
  resource: string
  action: string
  groupCode: string | null
  description: string | null
}

/** 权限组（含权限列表） */
export interface PermissionGroup {
  id: string
  code: string
  name: string
  category: string
  description: string | null
  icon: string | null
  sortOrder: number
  permissions: Permission[]
}

/** 获取分组权限列表 */
export async function fetchPermissionsGroupedApi(
  search?: string
): Promise<PermissionGroup[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : ""
  return request<PermissionGroup[]>(`/permissions/grouped${params}`)
}

/** 获取角色的操作权限 ID 列表 */
export async function fetchRolePermissionIdsApi(
  roleId: string
): Promise<string[]> {
  return request<string[]>(`/roles/${roleId}/permissions`)
}

/** 分配角色操作权限 */
export async function assignRolePermissionsApi(
  roleId: string,
  permissionIds: string[]
): Promise<void> {
  await request<null>(`/roles/${roleId}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissionIds }),
  })
}
