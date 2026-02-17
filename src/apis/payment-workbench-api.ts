/**
 * 付款工作台 API Client
 * 付款管理的工作台、报表、提醒相关接口封装
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

export interface PaymentWorkbenchDashboard {
  totalPayable: number
  totalPaid: number
  totalRemaining: number
  thisWeekPayable: number
  thisWeekCount: number
  overduePayable: number
  overdueCount: number
  completedCount: number
  progressRate: number
}

export interface PurchaseContractInfo {
  id: string
  code: string
  supplierId: string | null
  supplierCode: string | null
  supplierName: string | null
  buyerCode: string | null
  buyerName?: string | null
  totalAmount?: number
  currency?: string
}

export interface PaymentPlanItem {
  id: string
  purchaseContractId: string
  periodIndex: number
  paymentMethodType: number | null
  paymentDescription: string | null
  paymentDateBase: number | null
  baseDate: string | null
  daysOffset: number
  expectedPaymentDate: string | null
  paymentRatio: number
  realPaymentRatio: number | null
  periodPayable: number
  periodPaid: number
  exeStatus: number
  overdueStatus: number
  overdueDays: number
  earlyDays: number
  reminderStatus: number
  actualPaymentDate: string | null
  purchaseContract: PurchaseContractInfo
}

export interface PaymentProgress {
  purchaseContractId: string
  totalPayable: number
  totalPaid: number
  totalRemaining: number
  progressRate: number
  plans: {
    id: string
    periodIndex: number
    paymentDescription: string | null
    expectedPaymentDate: string | null
    actualPaymentDate: string | null
    payable: number
    paid: number
    remaining: number
    ratio: number
    status: 'pending' | 'partial' | 'completed' | 'overdue'
    overdueDays: number
    earlyDays: number
    paymentTiming: 'early' | 'late' | 'ontime' | null
  }[]
}

export interface PaymentOverdueReportSummary {
  totalOverdueAmount: number
  totalOverdueCount: number
  maxOverdueDays: number
  avgOverdueDays: number
}

export interface PaymentReminder {
  id: string
  paymentPlanId: string
  purchaseContractId: string
  purchaseContractCode: string | null
  supplierId: string | null
  supplierCode: string | null
  supplierName: string | null
  reminderType: number
  reminderDate: string
  expectedDate: string
  payableAmt: number
  paidAmt: number
  overdueDays: number
  periodIndex: number
  targetUserId: string | null
  readStatus: number
  handleStatus: number
  readAt: string | null
  createdAt: string
  paymentPlan?: {
    id: string
    periodIndex: number
    paymentDescription: string | null
    periodPayable: number
    periodPaid: number
    expectedPaymentDate: string | null
    exeStatus: number
  }
}

export interface PaymentReminderStats {
  total: number
  unread: number
  dueSoon: number
  overdue: number
}

export interface PaymentSchedulerStatus {
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
export async function getPaymentDashboardApi(): Promise<PaymentWorkbenchDashboard> {
  return request('/payment-workbench/dashboard')
}

/** 获取本周待付款列表 */
export async function getPaymentThisWeekDueApi(params?: {
  page?: number
  pageSize?: number
  supplierId?: string
  buyerCode?: string
}): Promise<{ data: PaymentPlanItem[]; total: number; page: number; pageSize: number }> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  if (params?.supplierId) query.set('supplierId', params.supplierId)
  if (params?.buyerCode) query.set('buyerCode', params.buyerCode)
  const queryStr = query.toString()
  return requestPaginated(`/payment-workbench/this-week${queryStr ? '?' + queryStr : ''}`)
}

/** 获取逾期列表 */
export async function getPaymentOverdueListApi(params?: {
  page?: number
  pageSize?: number
  supplierId?: string
  buyerCode?: string
  minOverdueDays?: number
  maxOverdueDays?: number
}): Promise<{ data: PaymentPlanItem[]; total: number; page: number; pageSize: number }> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  if (params?.supplierId) query.set('supplierId', params.supplierId)
  if (params?.buyerCode) query.set('buyerCode', params.buyerCode)
  if (params?.minOverdueDays !== undefined) query.set('minOverdueDays', String(params.minOverdueDays))
  if (params?.maxOverdueDays !== undefined) query.set('maxOverdueDays', String(params.maxOverdueDays))
  const queryStr = query.toString()
  return requestPaginated(`/payment-workbench/overdue${queryStr ? '?' + queryStr : ''}`)
}

/** 获取逾期报表 */
export async function getPaymentOverdueReportApi(params?: {
  page?: number
  pageSize?: number
  supplierId?: string
  buyerCode?: string
  minOverdueDays?: number
  maxOverdueDays?: number
}): Promise<{
  data: PaymentPlanItem[]
  total: number
  page: number
  pageSize: number
  summary: PaymentOverdueReportSummary
}> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  if (params?.supplierId) query.set('supplierId', params.supplierId)
  if (params?.buyerCode) query.set('buyerCode', params.buyerCode)
  if (params?.minOverdueDays !== undefined) query.set('minOverdueDays', String(params.minOverdueDays))
  if (params?.maxOverdueDays !== undefined) query.set('maxOverdueDays', String(params.maxOverdueDays))
  const queryStr = query.toString()
  return request(`/payment-workbench/overdue-report${queryStr ? '?' + queryStr : ''}`)
}

/** 获取单个合同付款进度 */
export async function getPaymentProgressApi(purchaseContractId: string): Promise<PaymentProgress> {
  return request(`/payment-workbench/progress/${purchaseContractId}`)
}

/** 获取提醒列表 */
export async function getPaymentRemindersApi(params?: {
  page?: number
  pageSize?: number
  reminderType?: number
  readStatus?: number
}): Promise<{ data: PaymentReminder[]; total: number; page: number; pageSize: number }> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  if (params?.reminderType !== undefined) query.set('reminderType', String(params.reminderType))
  if (params?.readStatus !== undefined) query.set('readStatus', String(params.readStatus))
  const queryStr = query.toString()
  return requestPaginated(`/payment-workbench/reminders${queryStr ? '?' + queryStr : ''}`)
}

/** 获取未读提醒数量 */
export async function getPaymentUnreadCountApi(): Promise<{ count: number }> {
  return request('/payment-workbench/reminders/unread-count')
}

/** 获取提醒统计 */
export async function getPaymentReminderStatsApi(): Promise<PaymentReminderStats> {
  return request('/payment-workbench/reminders/stats')
}

/** 标记提醒为已读 */
export async function markPaymentReminderAsReadApi(id: string): Promise<void> {
  await request(`/payment-workbench/reminders/${id}/read`, { method: 'POST' })
}

/** 标记所有提醒为已读 */
export async function markAllPaymentRemindersAsReadApi(): Promise<{ updated: number }> {
  return request('/payment-workbench/reminders/read-all', { method: 'POST' })
}

/** 标记提醒为已处理 */
export async function markPaymentReminderAsHandledApi(id: string): Promise<void> {
  await request(`/payment-workbench/reminders/${id}/handled`, { method: 'POST' })
}

/** 手动触发提醒检查 */
export async function triggerPaymentReminderCheckApi(): Promise<{
  success: boolean
  message: string
  stats?: {
    dueSoonReminders: number
    overdueReminders: number
    plansUpdated: number
  }
}> {
  return request('/payment-workbench/scheduler/trigger', { method: 'POST' })
}

/** 获取调度器状态 */
export async function getPaymentSchedulerStatusApi(): Promise<PaymentSchedulerStatus> {
  return request('/payment-workbench/scheduler/status')
}
