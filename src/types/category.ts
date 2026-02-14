/**
 * Category types
 * 统一参数配置相关类型定义
 */

// ==================== 通用基础类型 ====================

/** 分类类型标识 */
export type CategoryTypeKey = 'customer' | 'product' | 'product-category' | 'exhibition' | 'customer-source' | 'order-route' | 'other-config'

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

// ==================== 产品分类（树形结构） ====================

/** 产品分类 - 基础结构 */
export interface ProductCategory extends BaseCategoryFields {
  code: string              // 分类编码
  name: string             // 分类名称
  level?: number           // 层级
  codePrefix?: string | null  // 产品编码前缀（对应 code_prefix）
  serialLength?: number    // 流水号长度（对应 serial_length）
  parentId: string | null  // 父分类ID
}

/** 产品分类 - 树形节点（递归结构） */
export interface ProductCategoryTreeNode extends ProductCategory {
  children: ProductCategoryTreeNode[]  // 子分类列表
}

// ==================== 海关编码 ====================

export interface HsCode extends BaseCategoryFields {
  code: string              // 编号（必填）
  hsCode: string           // 编码（必填）
  name: string             // 商品名称（必填）
  customsUnit: string      // 报关单位（必填）
  taxRefundRate: number    // 退税率（必填）
  taxRate: number | null   // 征税率
  remark: string | null    // 备注
  fullName: string | null  // 商品全称
  levyRate: number | null  // 征收率
  secondUnit: string | null // 第二单位
}

export interface CreateHsCodeInput {
  code: string
  hsCode: string
  name: string
  customsUnit: string
  taxRefundRate: number
  taxRate?: number | null
  remark?: string | null
  fullName?: string | null
  levyRate?: number | null
  secondUnit?: string | null
}

// 保留旧类型别名以兼容现有代码
export type CreateProductCategoryInput = CreateHsCodeInput

export interface UpdateHsCodeInput {
  code?: string
  hsCode?: string
  name?: string
  customsUnit?: string
  taxRefundRate?: number
  taxRate?: number | null
  remark?: string | null
  fullName?: string | null
  levyRate?: number | null
  secondUnit?: string | null
}

// 保留旧类型别名以兼容现有代码
export type UpdateProductCategoryInput = UpdateHsCodeInput

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
