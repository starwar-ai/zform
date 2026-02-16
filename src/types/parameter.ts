/**
 * Parameter types
 * 统一参数配置相关类型定义
 */

// ==================== 通用基础类型 ====================

/** 分类类型标识 */
export type ParameterTypeKey = 'customer' | 'product' | 'product-category' | 'exhibition' | 'customer-source' | 'order-route' | 'transport-method' | 'other-config'

/** 基础分类字段 */
interface BaseParameterFields {
  id: string
  createdBy: string | null
  createdAt: string
  updatedBy: string | null
  updatedAt: string
}

// ==================== 客户分类 ====================

export interface CustomerCategory extends BaseParameterFields {
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
export interface ProductCategory extends BaseParameterFields {
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

export interface HsCode extends BaseParameterFields {
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

export interface ExhibitionCategory extends BaseParameterFields {
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

export interface CustomerSourceTag extends BaseParameterFields {
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

// ==================== 运输方式 ====================

export interface TransportMethod extends BaseParameterFields {
  code: string
  name: string
  nameEn: string | null
  isCommon: boolean
  sortOrder: number
  isEnabled: boolean
  remark: string | null
}

export interface CreateTransportMethodInput {
  code: string
  name: string
  nameEn?: string | null
  isCommon?: boolean
  sortOrder?: number
  isEnabled?: boolean
  remark?: string | null
}

export interface UpdateTransportMethodInput {
  code?: string
  name?: string
  nameEn?: string | null
  isCommon?: boolean
  sortOrder?: number
  isEnabled?: boolean
  remark?: string | null
}

// ==================== 配置驱动类型 ====================

/** 表单字段定义 */
export interface ParameterFormField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'parent-select'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: unknown
}

/** 表格列定义 */
export interface ParameterColumn {
  key: string
  label: string
  width?: string
  render?: 'text' | 'badge' | 'boolean' | 'date'
}

/** 分类配置 */
export interface ParameterConfig {
  key: ParameterTypeKey
  label: string
  icon: string               // lucide-react icon name
  apiPath: string             // e.g. '/categories/customer'
  isTree: boolean             // 是否树形结构
  columns: ParameterColumn[]   // 表格列
  formFields: ParameterFormField[] // 表单字段
  nameField: string           // 名称字段（用于树形展示）
  codeField?: string          // 编码字段（可选）
}