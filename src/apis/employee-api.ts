/**
 * Employee API Client
 *
 * 员工管理 API 前端封装
 */

import type { Employee, EmployeeWithDetails } from "@/types/employee"

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

/** 获取员工列表 */
export async function fetchEmployeesApi(params?: {
  status?: 'active' | 'inactive' | 'all'
  search?: string
  departmentId?: string
  page?: number
  pageSize?: number
}): Promise<{
  records: EmployeeWithDetails[]
  total: number
  page: number
  pageSize: number
}> {
  const searchParams = new URLSearchParams()
  
  if (params?.status && params.status !== 'all') {
    searchParams.set('status', params.status)
  }
  if (params?.search) {
    searchParams.set('search', params.search)
  }
  if (params?.departmentId) {
    searchParams.set('departmentId', params.departmentId)
  }
  if (params?.page) {
    searchParams.set('page', String(params.page))
  }
  if (params?.pageSize) {
    searchParams.set('pageSize', String(params.pageSize))
  }

  const queryString = searchParams.toString()
  const url = `/employees${queryString ? `?${queryString}` : ''}`
  
  return request(url)
}

/** 获取员工详情 */
export async function fetchEmployeeByIdApi(id: string): Promise<EmployeeWithDetails> {
  return request(`/employees/${id}`)
}

/** 创建员工 */
export async function createEmployeeApi(data: {
  username: string
  password: string
  name: string
  email?: string
  phone?: string
  departmentId?: string
  roleIds?: string[]
}): Promise<Employee> {
  return request("/employees", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/** 更新员工 */
export async function updateEmployeeApi(
  id: string,
  data: {
    name?: string
    email?: string
    phone?: string
    departmentId?: string
    status?: 'active' | 'inactive'
  }
): Promise<Employee> {
  return request(`/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/** 删除员工 */
export async function deleteEmployeeApi(id: string): Promise<void> {
  await request(`/employees/${id}`, {
    method: "DELETE",
  })
}

/** 分配角色 */
export async function assignEmployeeRolesApi(
  employeeId: string,
  roleIds: string[]
): Promise<void> {
  await request(`/employees/${employeeId}/roles`, {
    method: "PUT",
    body: JSON.stringify({ roleIds }),
  })
}