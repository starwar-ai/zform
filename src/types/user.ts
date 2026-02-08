/**
 * User types
 * 用户管理相关类型定义（与后端 SysUser 模型对齐）
 */

export type UserStatus = "active" | "inactive"

export interface User {
  id: string
  username: string // 用户名（登录名）
  name: string // 姓名
  email?: string | null // 邮箱
  phone?: string | null // 电话
  department?: string | null // 部门（旧字段，兼容保留）
  departmentId?: string | null // 部门ID（FK 关联 Department 表）
  roleIds: string[] // 关联的角色ID列表（来自 SysUserRole 关联）
  status: UserStatus // 状态
  createdBy?: string | null
  createdAt: string // ISO 日期字符串
  updatedBy?: string | null
  updatedAt: string
  deletedAt?: string | null
}

export interface CreateUserInput {
  username: string
  password?: string
  name: string
  email?: string
  phone?: string
  roleIds?: string[]
  department?: string
  departmentId?: string
  status?: UserStatus
}

export interface UpdateUserInput {
  name?: string
  password?: string
  email?: string
  phone?: string
  department?: string
  departmentId?: string | null
  status?: UserStatus
}
