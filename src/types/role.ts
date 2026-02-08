/**
 * Role types
 * 角色管理相关类型定义（与后端 SysRole 模型对齐）
 */

export type RoleStatus = "active" | "inactive"

export interface Role {
  id: string
  code: string // 角色编码
  name: string // 角色名称
  description?: string | null // 描述
  status: RoleStatus // 状态
  createdBy?: string | null
  createdAt: string // ISO 日期字符串
  updatedBy?: string | null
  updatedAt: string
  deletedAt?: string | null
}

export interface CreateRoleInput {
  code: string
  name: string
  description?: string
  status?: RoleStatus
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  status?: RoleStatus
}
