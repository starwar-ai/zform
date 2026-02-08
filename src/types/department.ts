/**
 * Department types
 * 部门管理相关类型定义
 */

export interface Department {
  id: string
  code: string
  name: string
  parentId: string | null
  orderNum: number
  createdAt: string
  updatedAt: string
}

export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[]
}

export interface CreateDepartmentInput {
  code: string
  name: string
  parentId?: string | null
  orderNum?: number
}

export interface UpdateDepartmentInput {
  code?: string
  name?: string
  parentId?: string | null
  orderNum?: number
}
