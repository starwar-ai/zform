/**
 * Category types
 * 统一业务属性配置相关类型定义
 */

// ==================== 通用基础类型 ====================

/** 分类类型标识 */
export type CategoryTypeKey = 'customer' | 'product' | 'exhibition' | 'customer-source'

/** 基础分类字段 */
interface BaseCategoryFields {
  id: string
  createdBy: string | null
  createdAt: string
  updatedBy: string | null
  updatedAt: string
}

// ==================== 客户分类 ====================

export interface CustomerCategory extends BaseCategoryFields {
  code: string
  name: string
  parentId: string | null
}

export interface CustomerCategoryTreeNode extends CustomerCategory {
  children: CustomerCategoryTreeNode[]
}

export interface CreateCustomerCategoryInput {
  code: string
  name: string
  parentId?: string | null
}

export interface UpdateCustomerCategoryInput {
  code?: string
  name?: string
  parentId?: string | null
}

// ==================== 产品分类（海关编码） ====================

export interface ProductCategory extends BaseCategoryFields {
  code: string
  name: string
  hsCode: string
  categoryCode: string | null
  parentId: string | null
  type: string | null
  level: number
  serialLength: number
}

export interface ProductCategoryTreeNode extends ProductCategory {
  children: ProductCategoryTreeNode[]
}

export interface CreateProductCategoryInput {
  code: string
  name: string
  hsCode: string
  categoryCode?: string | null
  parentId?: string | null
  type?: string | null
  level?: number
  serialLength?: number
}

export interface UpdateProductCategoryInput {
  code?: string
  name?: string
  hsCode?: string
  categoryCode?: string | null
  parentId?: string | null
  type?: string | null
  level?: number
  serialLength?: number
}

// ==================== 展会分类 ====================

export interface ExhibitionCategory extends BaseCategoryFields {
  name: string
  isDomestic: boolean
}

export interface CreateExhibitionCategoryInput {
  name: string
  isDomestic?: boolean
}

export interface UpdateExhibitionCategoryInput {
  name?: string
  isDomestic?: boolean
}

// ==================== 客户来源 ====================

export interface CustomerSourceTag extends BaseCategoryFields {
  code: string
  name: string
  isCommon: boolean
}

export interface CreateCustomerSourceTagInput {
  code: string
  name: string
  isCommon?: boolean
}

export interface UpdateCustomerSourceTagInput {
  code?: string
  name?: string
  isCommon?: boolean
}

// ==================== 配置驱动类型 ====================

/** 表单字段定义 */
export interface CategoryFormField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'parent-select'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: unknown
}

/** 表格列定义 */
export interface CategoryColumn {
  key: string
  label: string
  width?: string
  render?: 'text' | 'badge' | 'boolean' | 'date'
}

/** 分类配置 */
export interface CategoryConfig {
  key: CategoryTypeKey
  label: string
  icon: string               // lucide-react icon name
  apiPath: string             // e.g. '/categories/customer'
  isTree: boolean             // 是否树形结构
  columns: CategoryColumn[]   // 表格列
  formFields: CategoryFormField[] // 表单字段
  nameField: string           // 名称字段（用于树形展示）
  codeField?: string          // 编码字段（可选）
}
