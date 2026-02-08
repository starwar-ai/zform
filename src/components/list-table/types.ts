/**
 * ListTable 类型定义
 *
 * 数据表格组件的核心类型，包括列定义、筛选器、分页、查询接口等。
 */

import type { FieldType } from "@/core/types"

// ============================================================
// 筛选操作符
// ============================================================

/** 筛选操作符 */
export type FilterOperator =
  // 通用
  | "eq"        // 等于
  | "neq"       // 不等于
  | "isEmpty"   // 为空
  | "isNotEmpty" // 不为空
  // 文本
  | "contains"   // 包含
  | "startsWith" // 开头是
  | "endsWith"   // 结尾是
  // 数值/日期
  | "gt"   // 大于
  | "gte"  // 大于等于
  | "lt"   // 小于
  | "lte"  // 小于等于
  | "between" // 区间
  // 日期
  | "before" // 早于
  | "after"  // 晚于
  // 选择
  | "in" // 在列表中

/** 操作符元数据 */
export interface OperatorMeta {
  /** 操作符标识 */
  id: FilterOperator
  /** 显示标签 */
  label: string
  /** 符号 (用于紧凑显示) */
  symbol: string
  /** 是否需要值输入 */
  needsValue: boolean
  /** 是否需要双值输入 (如 between) */
  needsSecondValue: boolean
}

// ============================================================
// 列筛选状态
// ============================================================

/** 单列筛选状态 */
export interface ColumnFilter {
  /** 列 ID */
  columnId: string
  /** 操作符 */
  operator: FilterOperator
  /** 筛选值 */
  value: unknown
  /** 第二个筛选值 (用于 between) */
  secondValue?: unknown
}

// ============================================================
// 列定义
// ============================================================

/** ListTable 列定义 */
export interface ListTableColumn<T = unknown> {
  /** 列标识 (对应数据字段名) */
  id: string
  /** 显示名称 */
  label: string
  /** 字段类型 (决定筛选操作符和渲染方式) */
  type: FieldType
  /** 是否可排序 (默认 true) */
  sortable?: boolean
  /** 是否可筛选 (默认 true) */
  filterable?: boolean
  /** 列宽 (px) */
  width?: number
  /** 最小列宽 */
  minWidth?: number
  /** 下拉选项 (type=select 时) */
  options?: { label: string; value: string }[]
  /** 自定义单元格渲染 */
  render?: (value: unknown, row: T) => React.ReactNode
  /** 是否默认隐藏 */
  defaultHidden?: boolean
}

// ============================================================
// 查询接口
// ============================================================

/** 排序状态 */
export interface SortingItem {
  /** 排序字段 ID */
  id: string
  /** 是否降序 */
  desc: boolean
}

/** 分页状态 */
export interface PaginationState {
  /** 当前页索引 (从 0 开始) */
  pageIndex: number
  /** 每页条数 */
  pageSize: number
}

/** 传给 queryFn 的查询参数 */
export interface FetchParams {
  /** 分页 */
  pagination: PaginationState
  /** 筛选条件 */
  filters: ColumnFilter[]
  /** 排序 */
  sorting: SortingItem[]
}

/** queryFn 返回的查询结果 */
export interface FetchResult<T> {
  /** 当前页数据 */
  data: T[]
  /** 总记录数 */
  total: number
}

// ============================================================
// 组件 Props
// ============================================================

/** ListTable 组件 Props */
export interface ListTableProps<T> {
  /** 列定义 */
  columns: ListTableColumn<T>[]
  /** TanStack Query 的 queryKey */
  queryKey: string[]
  /** 数据查询函数 */
  queryFn: (params: FetchParams) => Promise<FetchResult<T>>
  /** 表格标题 */
  title?: string
  /** 标题图标 */
  titleIcon?: React.ReactNode
  /** 额外的工具栏操作 (如"新建"按钮) */
  toolbarActions?: React.ReactNode
  /** 行点击回调 */
  onRowClick?: (row: T) => void
  /** 默认每页条数 (默认 20) */
  defaultPageSize?: number
  /** 行唯一标识提取函数 */
  rowKey?: (row: T) => string
  /** 导出文件名 (不含扩展名) */
  exportFilename?: string
}
