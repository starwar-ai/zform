/**
 * User types
 * 用户管理相关类型定义
 */

export type UserStatus = "active" | "inactive"

export interface User {
  id: string
  username: string // 用户名（登录名）
  name: string // 姓名
  email: string // 邮箱
  phone: string // 电话
  roleIds: string[] // 关联的角色ID列表
  department?: string // 部门
  status: UserStatus // 状态
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

export interface CreateUserInput {
  username: string
  name: string
  email: string
  phone: string
  roleIds: string[]
  department?: string
  status?: UserStatus
}

export interface UpdateUserInput {
  name?: string
  email?: string
  phone?: string
  roleIds?: string[]
  department?: string
  status?: UserStatus
}
