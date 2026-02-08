/**
 * Department API Client
 *
 * 部门管理 API 前端封装。
 */

import type { Department, DepartmentTreeNode, CreateDepartmentInput, UpdateDepartmentInput } from "@/types/department"

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

/** 获取部门树 */
export async function fetchDepartmentTreeApi(): Promise<DepartmentTreeNode[]> {
  return request<DepartmentTreeNode[]>("/departments")
}

/** 获取部门扁平列表 */
export async function fetchDepartmentsApi(): Promise<Department[]> {
  return request<Department[]>("/departments/flat")
}

/** 获取单个部门 */
export async function fetchDepartmentApi(id: string): Promise<Department> {
  return request<Department>(`/departments/${id}`)
}

/** 创建部门 */
export async function createDepartmentApi(data: CreateDepartmentInput): Promise<Department> {
  return request<Department>("/departments", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/** 更新部门 */
export async function updateDepartmentApi(id: string, data: UpdateDepartmentInput): Promise<Department> {
  return request<Department>(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/** 删除部门 */
export async function deleteDepartmentApi(id: string): Promise<void> {
  await request<null>(`/departments/${id}`, {
    method: "DELETE",
  })
}
