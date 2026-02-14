/**
 * API Client - 公共请求函数
 *
 * 统一封装认证头、错误处理。所有 API 模块应复用此 request 函数，
 * 避免在每个 api 文件中重复定义。
 */

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api"

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/**
 * 通用请求函数
 *
 * 自动附加认证 header，解析标准 { success, message, data } 响应格式。
 *
 * @param path  API 路径（不含 base，如 "/pms/sku/generate-code"）
 * @param options  fetch 选项
 * @returns 响应 data 字段
 */
export async function request<T>(
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
