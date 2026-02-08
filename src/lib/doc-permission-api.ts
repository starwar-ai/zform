/**
 * Document Permission API Client
 *
 * 文档级权限管理 API 前端封装。
 */

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api"

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/** 文档权限记录 */
export interface DocPermissionRecord {
  id: string
  docType: string
  docId: string
  userId: string
  userName: string
  permission: "read" | "write"
  createdAt: string
  updatedAt: string
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

/** 获取文档权限列表 */
export async function fetchDocPermissions(
  docType: string,
  docId: string
): Promise<DocPermissionRecord[]> {
  return request<DocPermissionRecord[]>(
    `/document-permissions/${docType}/${docId}`
  )
}

/** 添加或更新文档权限 */
export async function upsertDocPermission(
  docType: string,
  docId: string,
  userId: string,
  userName: string,
  permission: "read" | "write"
): Promise<DocPermissionRecord> {
  return request<DocPermissionRecord>(
    `/document-permissions/${docType}/${docId}`,
    {
      method: "POST",
      body: JSON.stringify({ userId, userName, permission }),
    }
  )
}

/** 删除文档权限 */
export async function removeDocPermission(
  docType: string,
  docId: string,
  userId: string
): Promise<void> {
  await request<null>(
    `/document-permissions/${docType}/${docId}/${userId}`,
    {
      method: "DELETE",
    }
  )
}
