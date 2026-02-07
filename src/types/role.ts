/**
 * Role types
 * 角色管理相关类型定义
 */

export type RoleStatus = "active" | "inactive"

export interface Role {
  id: string
  code: string // 角色编码
  name: string // 角色名称
  description: string // 描述
  permissions: string[] // 权限列表（预留）
  status: RoleStatus // 状态
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

export interface CreateRoleInput {
  code: string
  name: string
  description: string
  permissions?: string[]
  status?: RoleStatus
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  permissions?: string[]
  status?: RoleStatus
}
