/**
 * Document API Client
 *
 * 统一单据 API 前端封装。
 * 所有单据类型 (销售合同、采购计划、产品等) 共用一套 API，通过 typeId 区分。
 *
 * 路由约定:
 *   GET    /api/documents/types                          - 获取已注册类型列表
 *   GET    /api/documents/:typeId/list                   - 列表查询 (筛选/排序/聚合)
 *   POST   /api/documents/:typeId                        - 新建
 *   GET    /api/documents/:typeId/:id                    - 详情
 *   PUT    /api/documents/:typeId/:id                    - 更新
 *   DELETE /api/documents/:typeId/:id                    - 删除
 *   GET    /api/documents/:typeId/:id/items              - 明细行列表
 *   POST   /api/documents/:typeId/:id/items              - 添加明细行
 *   PUT    /api/documents/:typeId/:id/items/:itemId      - 更新明细行
 *   DELETE /api/documents/:typeId/:id/items/:itemId      - 删除明细行
 *   POST   /api/documents/:typeId/:id/actions/:action    - 执行自定义操作
 */

import type { FetchParams, FetchResult, AggregateItem } from "@/components/list-table/types"
import type { DocumentData } from "@/core/types"
import { normalizeDocumentData } from "../lib/document-transform";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api"

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/** 通用请求函数 (与 approval-api 保持一致的认证头) */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { useAuthStore } = await import("@/stores/auth-store")
  const currentUser = useAuthStore.getState().currentUser

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (currentUser) {
    headers["x-user-id"] = currentUser.id
    headers["x-user-name"] = encodeURIComponent(currentUser.name)
    headers["x-user-roles"] = currentUser.roleIds.join(",")
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const json: ApiResponse<T> = await res.json()

  if (!res.ok || !json.success) {
    throw new Error(json.message || `请求失败: ${res.status}`)
  }

  return json.data
}

// ============================================================
// 类型元数据
// ============================================================

/** 已注册的单据类型信息 */
export interface DocumentTypeMeta {
  typeId: string
  typeName: string
  hasItems: boolean
  actions: string[]
  aggregateFields: {
    field: string
    type: "sum" | "avg" | "count" | "min" | "max"
    columnId?: string
  }[]
}

/**
 * 获取所有已注册的单据类型
 *
 * GET /api/documents/types
 */
export async function fetchDocumentTypesApi(): Promise<DocumentTypeMeta[]> {
  return request<DocumentTypeMeta[]>("/documents/types")
}

// ============================================================
// 单据列表查询
// ============================================================

/** 列表模式: document=单据模式(每行一个单据), detail=明细模式(每行一个明细行) */
export type ListMode = "document" | "detail"

/** 扁平化的单据行数据 (服务端已将 masterData 展开到顶层) */
export type FlatDocumentRow = Record<string, unknown> & {
  _id: string
  _code: string
  _status: string
  _createdAt: string
  _sourceTypeId?: string
  /** 明细行 ID (仅明细模式下存在) */
  _detailRowId?: string
}

/** 服务端返回的列表数据结构 */
interface ServerListResult {
  data: FlatDocumentRow[]
  total: number
  aggregates?: AggregateItem[]
}

/**
 * 查询单据列表
 *
 * GET /api/documents/:typeId/list
 *
 * 响应中包含:
 *   - data: 扁平化的行数据
 *   - total: 总记录数
 *   - aggregates: 列合计 (可选)
 */
export async function fetchDocumentListApi(
  typeId: string,
  params: FetchParams,
  mode: ListMode = "document",
  detailTableId?: string,
  search?: string
): Promise<FetchResult<FlatDocumentRow>> {
  const searchParams = new URLSearchParams()

  // 模式
  searchParams.set("mode", mode)

  // 明细模式下传入明细表 ID
  if (mode === "detail" && detailTableId) {
    searchParams.set("detailTableId", detailTableId)
  }

  // 分页
  searchParams.set("pageIndex", String(params.pagination.pageIndex))
  searchParams.set("pageSize", String(params.pagination.pageSize))

  // 筛选 (序列化为 JSON)
  if (params.filters.length > 0) {
    searchParams.set("filters", JSON.stringify(params.filters))
  }

  // 排序 (序列化为 JSON)
  if (params.sorting.length > 0) {
    searchParams.set("sorting", JSON.stringify(params.sorting))
  }

  // 关键字搜索
  if (search) {
    searchParams.set("search", search)
  }

  const result = await request<ServerListResult>(
    `/documents/${typeId}/list?${searchParams.toString()}`
  )

  return {
    data: result.data,
    total: result.total,
    aggregates: result.aggregates,
  }
}

// ============================================================
// 单据 CRUD
// ============================================================

/**
 * 获取单据详情
 *
 * GET /api/documents/:typeId/:id
 */
export async function fetchDocumentApi(
  typeId: string,
  id: string
): Promise<DocumentData> {
  const rawDoc = await request<any>(`/documents/${typeId}/${id}`)
  return normalizeDocumentData(typeId, rawDoc)
}

/**
 * 新建单据
 *
 * POST /api/documents/:typeId
 */
export async function createDocumentApi(
  typeId: string,
  data: Record<string, unknown> = {}
): Promise<any> {
  return request<any>(`/documents/${typeId}`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * 更新单据
 *
 * PUT /api/documents/:typeId/:id
 */
export async function updateDocumentApi(
  typeId: string,
  id: string,
  data: Record<string, unknown>
): Promise<any> {
  return request<any>(`/documents/${typeId}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * 删除单据
 *
 * DELETE /api/documents/:typeId/:id
 */
export async function deleteDocumentApi(
  typeId: string,
  id: string
): Promise<void> {
  await request<any>(`/documents/${typeId}/${id}`, {
    method: "DELETE",
  })
}

// ============================================================
// 明细行操作
// ============================================================

/**
 * 获取明细行列表
 *
 * GET /api/documents/:typeId/:id/items
 */
export async function fetchDocumentItemsApi(
  typeId: string,
  docId: string
): Promise<any[]> {
  return request<any[]>(`/documents/${typeId}/${docId}/items`)
}

/**
 * 添加明细行
 *
 * POST /api/documents/:typeId/:id/items
 */
export async function addDocumentItemApi(
  typeId: string,
  docId: string,
  data: Record<string, unknown>
): Promise<any> {
  return request<any>(`/documents/${typeId}/${docId}/items`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * 更新明细行
 *
 * PUT /api/documents/:typeId/:id/items/:itemId
 */
export async function updateDocumentItemApi(
  typeId: string,
  docId: string,
  itemId: string,
  data: Record<string, unknown>
): Promise<any> {
  return request<any>(`/documents/${typeId}/${docId}/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * 删除明细行
 *
 * DELETE /api/documents/:typeId/:id/items/:itemId
 */
export async function deleteDocumentItemApi(
  typeId: string,
  docId: string,
  itemId: string
): Promise<void> {
  await request<any>(`/documents/${typeId}/${docId}/items/${itemId}`, {
    method: "DELETE",
  })
}

// ============================================================
// 自定义操作 (Actions)
// ============================================================

/**
 * 执行单据的自定义操作
 *
 * POST /api/documents/:typeId/:id/actions/:action
 *
 * 示例:
 *   executeDocumentAction('sales_contract', docId, 'approve', { approved: true })
 *   executeDocumentAction('sales_contract', docId, 'signBack', { signBackDate: '...' })
 *   executeDocumentAction('standard_product', docId, 'addBom', { childProductId, quantity })
 */
export async function executeDocumentAction(
  typeId: string,
  id: string,
  action: string,
  body: Record<string, unknown> = {}
): Promise<any> {
  return request<any>(`/documents/${typeId}/${id}/actions/${action}`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}
