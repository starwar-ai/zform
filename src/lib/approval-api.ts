/**
 * Approval API Client
 *
 * 审核系统前端 API 调用封装。
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
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

// ============================================================
// 审核 API 类型
// ============================================================

export interface ApprovalInstanceResponse {
  id: string
  ruleId: string
  docType: string
  docId: string
  docNumber: string | null
  status: string
  currentLevel: number
  currentLevelApprovers: string[]
  submitterId: string
  submitterName: string | null
  submittedAt: string
  completedAt: string | null
  rule: {
    id: string
    code: string
    name: string
    levels: ApprovalLevelConfig[]
  }
  records: ApprovalRecordResponse[]
}

export interface ApprovalLevelConfig {
  name: string
  mode?: "single" | "all" | "any"
  roleIds?: string[]
  userIds?: string[]
}

export interface ApprovalRecordResponse {
  id: string
  instanceId: string
  level: number
  action: string
  userId: string
  userName: string
  comment: string | null
  createdAt: string
}

export interface ApprovalRuleResponse {
  id: string
  code: string
  name: string
  docType: string
  levels: ApprovalLevelConfig[]
  condition: unknown
  enabled: boolean
}

// ============================================================
// API 方法
// ============================================================

/** 提交审核 */
export async function submitApprovalApi(params: {
  docType: string
  docId: string
  docNumber?: string
}): Promise<{ instance: ApprovalInstanceResponse; message: string }> {
  return request("/approvals/submit", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

/** 审批（通过/拒绝） */
export async function processApprovalApi(
  instanceId: string,
  params: { action: "approve" | "reject"; comment?: string }
): Promise<{ instance: ApprovalInstanceResponse; message: string }> {
  return request(`/approvals/${instanceId}/process`, {
    method: "POST",
    body: JSON.stringify(params),
  })
}

/** 撤回审核 */
export async function withdrawApprovalApi(
  instanceId: string
): Promise<{ instance: ApprovalInstanceResponse; message: string }> {
  return request(`/approvals/${instanceId}/withdraw`, {
    method: "POST",
  })
}

/** 查询单据审核历史 */
export async function getApprovalHistoryApi(
  docType: string,
  docId: string
): Promise<ApprovalInstanceResponse[]> {
  return request(`/approvals/history/${docType}/${docId}`)
}

/** 查询待审批列表 */
export async function getPendingApprovalsApi(): Promise<
  ApprovalInstanceResponse[]
> {
  return request("/approvals/pending")
}

/** 查询审核规则列表 */
export async function getApprovalRulesApi(
  docType?: string
): Promise<ApprovalRuleResponse[]> {
  const query = docType ? `?docType=${docType}` : ""
  return request(`/approvals/rules${query}`)
}

/** 检查单据是否需要审核 */
export async function checkApprovalRequiredApi(
  docType: string,
  docId: string
): Promise<{ required: boolean }> {
  return request(`/approvals/check/${docType}/${docId}`)
}
