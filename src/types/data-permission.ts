/**
 * Data Permission types
 * 数据权限管理相关类型定义
 */

/** 数据权限级别 */
export type DataPermissionLevel = "all" | "department" | "personal"

/** 数据权限级别标签 */
export const DATA_PERMISSION_LEVEL_LABELS: Record<DataPermissionLevel, string> = {
  all: "全部",
  department: "部门",
  personal: "个人",
}

/** 数据权限配置 */
export interface DataPermission {
  id: string
  roleId: string
  typeId: string           // 单据类型ID，"*" 表示全部类型
  level: DataPermissionLevel
  extraDepartmentIds: string[] // 特殊授权部门ID列表
  extraUserIds: string[]       // 特殊授权用户ID列表
  createdAt: string
  updatedAt: string
}

/** 保存数据权限的输入 */
export interface SaveDataPermissionInput {
  typeId: string
  level: DataPermissionLevel
  extraDepartmentIds?: string[]
  extraUserIds?: string[]
}
