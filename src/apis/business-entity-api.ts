/**
 * Business Entity API Client
 *
 * 统一实体配置 API 前端封装。
 */

import type { CategoryTypeKey } from "@/types/category"

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

/** 获取分类列表/树 */
export async function fetchCategoryListApi<T>(type: CategoryTypeKey): Promise<T[]> {
  // 特殊处理运输方式，使用独立的API路径
  const path = type === 'transport-method' ? '/transport-methods' : `/categories/${type}`
  return request<T[]>(path)
}

/** 创建分类 */
export async function createCategoryApi<T>(
  type: CategoryTypeKey,
  data: Record<string, unknown>
): Promise<T> {
  const path = type === 'transport-method' ? '/transport-methods' : `/categories/${type}`
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/** 更新分类 */
export async function updateCategoryApi<T>(
  type: CategoryTypeKey,
  id: string,
  data: Record<string, unknown>
): Promise<T> {
  const basePath = type === 'transport-method' ? '/transport-methods' : `/categories/${type}`
  return request<T>(`${basePath}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/** 删除分类 */
export async function deleteCategoryApi(
  type: CategoryTypeKey,
  id: string
): Promise<void> {
  const basePath = type === 'transport-method' ? '/transport-methods' : `/categories/${type}`
  await request<null>(`${basePath}/${id}`, {
    method: "DELETE",
  })
}