/**
 * 统一单据 API —— 类型定义
 *
 * DocumentTypeAdapter 描述了一种单据类型如何映射到 Prisma 模型，
 * 以及它的搜索、聚合、自定义操作等行为。
 */

// ============================================================
// Adapter 核心接口
// ============================================================

/** 聚合字段定义 */
export interface AggregateFieldDef {
  /** Prisma 字段名 */
  field: string
  /** 聚合方式 */
  type: 'sum' | 'avg' | 'count' | 'min' | 'max'
  /** 前端列 ID (用于和列合计对齐，默认同 field) */
  columnId?: string
}

/** 自定义 Action 处理函数 */
export type ActionHandler = (params: {
  id: string
  body: any
  userId: string
  prisma: any
}) => Promise<{ data: any; message: string }>

/**
 * DocumentTypeAdapter
 *
 * 每种单据类型注册一个 adapter，描述：
 * - 如何访问 Prisma model
 * - 如何搜索/筛选/排序
 * - 如何做列合计
 * - 有哪些自定义操作
 */
export interface DocumentTypeAdapter {
  /** 类型标识 (如 'sales_contract') */
  typeId: string
  /** 类型名称 (如 '销售合同') */
  typeName: string

  // ---- Prisma 映射 ----

  /** Prisma model 代理名 (如 'salesContract') —— 即 prisma.salesContract */
  prismaModel: string
  /** 明细表的 Prisma model 代理名 (如 'salesContractItem')，无明细表则不填 */
  prismaItemModel?: string
  /** 明细表关联到主表的外键名 (如 'salesContractId') */
  parentForeignKey?: string
  /** 明细表在主表 include 中的关系名 (如 'items') */
  itemRelationName?: string

  // ---- 列表查询 ----

  /** 关键字搜索的字段列表 (支持 OR 模糊匹配) */
  searchFields: string[]
  /** 列表查询时的 Prisma include */
  listIncludes?: Record<string, any>
  /** 详情查询时的 Prisma include */
  detailIncludes?: Record<string, any>
  /** 默认排序 (Prisma orderBy 格式) */
  defaultOrderBy?: Record<string, 'asc' | 'desc'>

  // ---- 字段映射 ----

  /**
   * Prisma 字段名 → 前端筛选/排序用的 columnId 的反向映射。
   * 前端传 columnId，服务端需翻译为 Prisma 字段名。
   * 如: { '_docNumber': 'code', '_status': 'status', '_createdAt': 'createdAt' }
   */
  columnToPrismaField?: Record<string, string>

  /**
   * 固定的 where 条件 (如某些 adapter 需要按 productType 过滤)
   * 会与搜索/筛选条件合并
   */
  baseWhere?: Record<string, any>

  // ---- 聚合 ----

  /** 支持列合计的字段 */
  aggregateFields?: AggregateFieldDef[]

  // ---- 扁平化 ----

  /**
   * 将 Prisma 查出的一行数据转为前端的 FlatDocumentRow 格式。
   * 必须包含 _id, _docNumber, _status, _createdAt 等标准字段。
   */
  flattenRow: (row: any) => Record<string, unknown>

  /**
   * 将明细模式下的一行 (主表+明细) 转为扁平行。
   * 不提供则不支持明细模式列表。
   */
  flattenDetailRow?: (masterRow: any, detailRow: any) => Record<string, unknown>

  // ---- 生命周期钩子 ----

  /** 创建前 (可以修改 data) */
  onCreate?: (data: any, userId: string, prisma: any) => Promise<any>
  /** 更新前 (可以修改 data) */
  onUpdate?: (id: string, data: any, userId: string, prisma: any) => Promise<any>
  /** 删除前校验 */
  beforeDelete?: (id: string, prisma: any) => Promise<void>

  // ---- 自定义 Actions ----

  /**
   * 类型特有的操作。
   * Key 为 action 名 (如 'approve', 'signBack', 'toPurchasePlan')
   * 通过 POST /documents/:typeId/:id/actions/:action 触发
   */
  actions?: Record<string, ActionHandler>
}

// ============================================================
// 通用查询参数 (前端 → 后端)
// ============================================================

/** 筛选操作符 */
export type FilterOperator =
  | 'eq' | 'neq'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
  | 'in'
  | 'isEmpty' | 'isNotEmpty'

/** 单个筛选条件 */
export interface FilterCondition {
  columnId: string
  operator: FilterOperator
  value: unknown
  secondValue?: unknown
}

/** 排序项 */
export interface SortingItem {
  id: string
  desc: boolean
}

/** 分页 */
export interface PaginationParams {
  pageIndex: number
  pageSize: number
}

/** 统一列表查询参数 */
export interface DocumentListParams {
  mode: 'document' | 'detail'
  detailTableId?: string
  pagination: PaginationParams
  filters: FilterCondition[]
  sorting: SortingItem[]
}

// ============================================================
// 通用响应格式
// ============================================================

/** 聚合结果项 */
export interface AggregateResult {
  /** 对应的前端 columnId */
  columnId: string
  /** 聚合方式 */
  type: 'sum' | 'avg' | 'count' | 'min' | 'max'
  /** 聚合值 */
  value: number | null
}

/** 统一列表响应 */
export interface DocumentListResult {
  data: Record<string, unknown>[]
  total: number
  aggregates?: AggregateResult[]
}
