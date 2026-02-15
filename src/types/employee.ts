/**
 * Employee Types
 *
 * 员工相关类型定义
 */

export interface Employee {
  id: string
  username: string
  name: string
  email?: string | null
  phone?: string | null
  department?: string | null
  departmentId?: string | null
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface EmployeeWithDetails extends Employee {
  roles?: Array<{
    id: string
    name: string
    code: string
  }>
  stores?: Array<{
    id: string
    name: string
    isManager: boolean
  }>
  departments?: Array<{
    id: string
    name: string
    isManager: boolean
  }>
}