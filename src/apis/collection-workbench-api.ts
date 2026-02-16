/**
 * 收款工作台 API Client
 * 收款管理的工作台、报表、提醒相关接口封装
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface PaginatedApiResponse<T> {
  success: boolean
  message: string
  data: T[]
  total: number
  page: number
  pageSize: number
}

/** 通用请求函数 */
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

/** 分页请求函数 */
async function requestPaginated<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T[]; total: number; page: number; pageSize: number }> {
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

  const json: PaginatedApiResponse<T> = await res.json()

  if (!res.ok || !json.success) {
    throw new Error(json.message || `请求失败: ${res.status}`)
  }

  return {
    data: json.data,
    total: json.total,
    page: json.page,
    pageSize: json.pageSize,
  }
}

// ============================================================
// 类型定义
// ============================================================

export interface WorkbenchDashboard {
  totalReceivable: number
  totalReceived: number
  totalRemaining: number
  thisWeekReceivable: number
  thisWeekCount: number
  overdueReceivable: number
  overdueCount: number
  completedCount: number
  progressRate: number
}

export interface SalesContractInfo {
  id: string
  code: string
  customerId: string
  customerCode: string
  customerName: string | null
  salesmanId: string | null
  totalAmount?: number
  currency?: string
}

export interface CollectionPlanItem {
  id: string
  salesContractId: string
  periodIndex: number
  receiptMethodType: number | null
  receiptDescription: string | null
  receiptDateBase: number | null
  baseDate: string | null
  daysOffset: number
  expectedReceiptDate: string | null
  receiptRatio: number
  realCollectionRatio: number | null
  periodReceivable: number
  periodReceived: number
  blockPurchaseUntilPaid: number
  blockShipmentUntilPaid: number
  exeStatus: number
  overdueStatus: number
  overdueDays: number
  reminderStatus: number
  actualReceiptDate: string | null
  salesContract: SalesContractInfo
}

export interface CollectionProgress {
  salesContractId: string
  totalReceivable: number
  totalReceived: number
  totalRemaining: number
  progressRate: number
  plans: {
    id: string
    periodIndex: number
    receiptDescription: string | null
    expectedReceiptDate: string | null
    actualReceiptDate: string | null
    receivable: number
    received: number
    remaining: number
    ratio: number
    status: 'pending' | 'partial' | 'completed' | 'overdue'
    overdueDays: number
  }[]
}

export interface OverdueReportSummary {
  totalOverdueAmount: number
  totalOverdueCount: number
  maxOverdueDays: number
  avgOverdueDays: number
}

export interface CollectionReminder {
  id: string
  collectionPlanId: string
  salesContractId: string
  salesContractCode: string | null
  customerId: string | null
  customerCode: string | null
  customerName: string | null
  reminderType: number
  reminderDate: string
  expectedDate: string
  receivableAmt: number
  receivedAmt: number
  overdueDays: number
  periodIndex: number
  targetUserId: string | null
  readStatus: number
  handleStatus: number
  readAt: string | null
  createdAt: string
  collectionPlan?: {
    id: string
    periodIndex: number
    receiptDescription: string | null
    periodReceivable: number
    periodReceived: number
    expectedReceiptDate: string | null
    exeStatus: number
  }
}

export interface ReminderStats {
  total: number
  unread: number
  dueSoon: number
  overdue: number
}

export interface SchedulerStatus {
  running: boolean
  jobs: Array<{
    name: string
    nextInvocation: string | null
  }>
  lastRunTime: string | null
  lastRunStatus: 'success' | 'error' | null
  lastRunMessage: string | null
  stats: {
    dueSoonReminders: number
    overdueReminders: number
    plansUpdated: number
  } | null
}

// ============================================================
// API 方法
// ============================================================

/** 获取工作台统计数据 */
export async function getDashboardApi(): Promise<WorkbenchDashboard> {
  return request('/collection-workbench/dashboard')
}

/** 获取本周待收款列表 */
export async function getThisWeekDueApi(params?: {
  page?: number
  pageSize?: number
}): Promise<{ data: CollectionPlanItem[]; total: number; page: number; pageSize: number }> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  const queryStr = query.toString()
  return requestPaginated(`/collection-workbench/this-week${queryStr ? '?' + queryStr : ''}`)
}

/** 获取逾期列表 */
export async function getOverdueListApi(params?: {
  page?: number
  pageSize?: number
  customerId?: string
  salesmanId?: string
  minOverdueDays?: number
  maxOverdueDays?: number
}): Promise<{ data: CollectionPlanItem[]; total: number; page: number; pageSize: number }> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  if (params?.customerId) query.set('customerId', params.customerId)
  if (params?.salesmanId) query.set('salesmanId', params.salesmanId)
  if (params?.minOverdueDays !== undefined) query.set('minOverdueDays', String(params.minOverdueDays))
  if (params?.maxOverdueDays !== undefined) query.set('maxOverdueDays', String(params.maxOverdueDays))
  const queryStr = query.toString()
  return requestPaginated(`/collection-workbench/overdue${queryStr ? '?' + queryStr : ''}`)
}

/** 获取逾期报表 */
export async function getOverdueReportApi(params?: {
  page?: number
  pageSize?: number
  customerId?: string
  salesmanId?: string
  minOverdueDays?: number
  maxOverdueDays?: number
}): Promise<{
  data: CollectionPlanItem[]
  total: number
  page: number
  pageSize: number
  summary: OverdueReportSummary
}> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  if (params?.customerId) query.set('customerId', params.customerId)
  if (params?.salesmanId) query.set('salesmanId', params.salesmanId)
  if (params?.minOverdueDays !== undefined) query.set('minOverdueDays', String(params.minOverdueDays))
  if (params?.maxOverdueDays !== undefined) query.set('maxOverdueDays', String(params.maxOverdueDays))
  const queryStr = query.toString()
  return request(`/collection-workbench/overdue-report${queryStr ? '?' + queryStr : ''}`)
}

/** 获取单个合同收款进度 */
export async function getProgressApi(salesContractId: string): Promise<CollectionProgress> {
  return request(`/collection-workbench/progress/${salesContractId}`)
}

/** 获取提醒列表 */
export async function getRemindersApi(params?: {
  page?: number
  pageSize?: number
  reminderType?: number
  readStatus?: number
}): Promise<{ data: CollectionReminder[]; total: number; page: number; pageSize: number }> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  if (params?.reminderType !== undefined) query.set('reminderType', String(params.reminderType))
  if (params?.readStatus !== undefined) query.set('readStatus', String(params.readStatus))
  const queryStr = query.toString()
  return requestPaginated(`/collection-workbench/reminders${queryStr ? '?' + queryStr : ''}`)
}

/** 获取未读提醒数量 */
export async function getUnreadCountApi(): Promise<{ count: number }> {
  return request('/collection-workbench/reminders/unread-count')
}

/** 获取提醒统计 */
export async function getReminderStatsApi(): Promise<ReminderStats> {
  return request('/collection-workbench/reminders/stats')
}

/** 标记提醒为已读 */
export async function markReminderAsReadApi(id: string): Promise<void> {
  await request(`/collection-workbench/reminders/${id}/read`, { method: 'POST' })
}

/** 标记所有提醒为已读 */
export async function markAllRemindersAsReadApi(): Promise<{ updated: number }> {
  return request('/collection-workbench/reminders/read-all', { method: 'POST' })
}

/** 标记提醒为已处理 */
export async function markReminderAsHandledApi(id: string): Promise<void> {
  await request(`/collection-workbench/reminders/${id}/handled`, { method: 'POST' })
}

/** 手动触发提醒检查 */
export async function triggerReminderCheckApi(): Promise<{
  success: boolean
  message: string
  stats?: {
    dueSoonReminders: number
    overdueReminders: number
    plansUpdated: number
  }
}> {
  return request('/collection-workbench/scheduler/trigger', { method: 'POST' })
}

/** 获取调度器状态 */
export async function getSchedulerStatusApi(): Promise<SchedulerStatus> {
  return request('/collection-workbench/scheduler/status')
}
