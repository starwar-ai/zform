/**
 * Business Entity API Client
 *
 * 统一实体配置 API 前端封装。
 */

import type { ParameterTypeKey } from "@/types/parameter"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api"

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/** 根据类型获取 API 路径前缀 */
function getParameterPath(type: ParameterTypeKey): string {
  const pathMap: Record<string, string> = {
    customer: "/parameters/customer",
    "customer-source": "/parameters/customer-source",
    product: "/parameters/product",
    "product-category": "/parameters/product-category",
    exhibition: "/parameters/exhibition",
    "order-route": "/parameters/order-routes",
    "transport-method": "/parameters/transport-methods",
    "payment-terms": "/parameters/payment-terms",
    "supplier-payment-terms": "/parameters/supplier-payment-terms",
  }
  return pathMap[type] ?? `/parameters/${type}`
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

/** 获取参数列表/树 */
export async function fetchParameterListApi<T>(type: ParameterTypeKey): Promise<T[]> {
  const path = getParameterPath(type)
  return request<T[]>(path)
}

/** 创建参数 */
export async function createParameterApi<T>(
  type: ParameterTypeKey,
  data: Record<string, unknown>
): Promise<T> {
  const path = getParameterPath(type)
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/** 更新参数 */
export async function updateParameterApi<T>(
  type: ParameterTypeKey,
  id: string,
  data: Record<string, unknown>
): Promise<T> {
  const basePath = getParameterPath(type)
  return request<T>(`${basePath}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/** 删除参数 */
export async function deleteParameterApi(
  type: ParameterTypeKey,
  id: string
): Promise<void> {
  const basePath = getParameterPath(type)
  await request<null>(`${basePath}/${id}`, {
    method: "DELETE",
  })
}

/** 批量更新参数排序 */
export async function reorderParameterApi(
  type: ParameterTypeKey,
  items: { id: string; sortOrder: number }[]
): Promise<void> {
  const basePath = getParameterPath(type)
  await request<null>(`${basePath}/reorder`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  })
}
