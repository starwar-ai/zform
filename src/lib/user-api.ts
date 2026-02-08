/**
 * User API Client
 *
 * 用户管理 API 前端封装。
 */

import type { User } from "@/types/user"

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

/** 获取用户列表 */
export async function fetchUsersApi(): Promise<User[]> {
  return request<User[]>("/users")
}

/** 创建用户 */
export async function createUserApi(data: {
  username: string
  password?: string
  name: string
  email?: string
  phone?: string
  department?: string
  status?: string
  roleIds?: string[]
}): Promise<User> {
  return request<User>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/** 更新用户 */
export async function updateUserApi(
  id: string,
  data: {
    name?: string
    password?: string
    email?: string
    phone?: string
    department?: string
    status?: string
  }
): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/** 删除用户 */
export async function deleteUserApi(id: string): Promise<void> {
  await request<null>(`/users/${id}`, {
    method: "DELETE",
  })
}

/** 分配角色 */
export async function assignUserRolesApi(
  userId: string,
  roleIds: string[]
): Promise<void> {
  await request<null>(`/users/${userId}/roles`, {
    method: "PUT",
    body: JSON.stringify({ roleIds }),
  })
}

/** 登录 */
export async function loginApi(
  username: string,
  password: string
): Promise<User> {
  return request<User>("/users/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
}
