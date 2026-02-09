/**
 * Approval Store (审核 Store)
 *
 * 管理单据的审核状态和审核记录。
 * 数据来自服务端 API，本地仅缓存查询结果。
 */

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type {
  ApprovalInstanceResponse,
  ApprovalRecordResponse,
} from "@/apis/approval-api"
import {
  submitApprovalApi,
  processApprovalApi,
  withdrawApprovalApi,
  getApprovalHistoryApi,
  getPendingApprovalsApi,
} from "@/apis/approval-api"

interface ApprovalStoreState {
  /** 单据审核历史缓存, 按 "docType:docId" 索引 */
  historyCache: Record<string, ApprovalInstanceResponse[]>
  /** 待审批列表 */
  pendingList: ApprovalInstanceResponse[]
  /** 加载状态 */
  loading: boolean

  // 查询方法
  fetchHistory: (docType: string, docId: string) => Promise<ApprovalInstanceResponse[]>
  fetchPending: () => Promise<ApprovalInstanceResponse[]>

  // 操作方法
  submit: (params: {
    docType: string
    docId: string
    docNumber?: string
  }) => Promise<{ success: boolean; message: string; instance?: ApprovalInstanceResponse }>
  process: (
    instanceId: string,
    action: "approve" | "reject",
    comment?: string
  ) => Promise<{ success: boolean; message: string; instance?: ApprovalInstanceResponse }>
  withdraw: (
    instanceId: string
  ) => Promise<{ success: boolean; message: string; instance?: ApprovalInstanceResponse }>

  // 辅助
  getLatestInstance: (docType: string, docId: string) => ApprovalInstanceResponse | undefined
  getRecords: (docType: string, docId: string) => ApprovalRecordResponse[]
  clearCache: (docType: string, docId: string) => void
}

function cacheKey(docType: string, docId: string): string {
  return `${docType}:${docId}`
}

export const useApprovalStore = create<ApprovalStoreState>()(
  immer((set, get) => ({
    historyCache: {},
    pendingList: [],
    loading: false,

    fetchHistory: async (docType, docId) => {
      set((s) => { s.loading = true })
      try {
        const instances = await getApprovalHistoryApi(docType, docId)
        set((s) => {
          s.historyCache[cacheKey(docType, docId)] = instances
          s.loading = false
        })
        return instances
      } catch {
        set((s) => { s.loading = false })
        return []
      }
    },

    fetchPending: async () => {
      set((s) => { s.loading = true })
      try {
        const list = await getPendingApprovalsApi()
        set((s) => {
          s.pendingList = list
          s.loading = false
        })
        return list
      } catch {
        set((s) => { s.loading = false })
        return []
      }
    },

    submit: async (params) => {
      try {
        const result = await submitApprovalApi(params)
        // 刷新该单据的审核历史缓存
        await get().fetchHistory(params.docType, params.docId)
        return { success: true, message: result.message, instance: result.instance }
      } catch (err: any) {
        return { success: false, message: err.message || "提交审核失败" }
      }
    },

    process: async (instanceId, action, comment) => {
      try {
        const result = await processApprovalApi(instanceId, { action, comment })
        const inst = result.instance
        // 刷新缓存
        await get().fetchHistory(inst.docType, inst.docId)
        return { success: true, message: result.message, instance: inst }
      } catch (err: any) {
        return { success: false, message: err.message || "审批操作失败" }
      }
    },

    withdraw: async (instanceId) => {
      try {
        const result = await withdrawApprovalApi(instanceId)
        const inst = result.instance
        await get().fetchHistory(inst.docType, inst.docId)
        return { success: true, message: result.message, instance: inst }
      } catch (err: any) {
        return { success: false, message: err.message || "撤回失败" }
      }
    },

    getLatestInstance: (docType, docId) => {
      const instances = get().historyCache[cacheKey(docType, docId)]
      if (!instances || instances.length === 0) return undefined
      return instances[0] // 按 createdAt desc 排列，第一条是最新的
    },

    getRecords: (docType, docId) => {
      const instances = get().historyCache[cacheKey(docType, docId)]
      if (!instances) return []
      return instances.flatMap((inst) => inst.records)
    },

    clearCache: (docType, docId) => {
      set((s) => {
        delete s.historyCache[cacheKey(docType, docId)]
      })
    },
  }))
)
