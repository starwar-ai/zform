/**
 * Approval Hooks
 *
 * React hooks 封装审核操作。
 * 所有审核逻辑由服务端执行，前端仅调用 API。
 */

import { useCallback, useEffect, useMemo } from "react"
import { useApprovalStore } from "@/stores/approval-store"
import { useAuthStore } from "@/stores/auth-store"
import type { ApprovalInstanceResponse } from "@/lib/approval-api"

/**
 * 单据审核操作 hook
 *
 * 提供提交、审批、拒绝、撤回等操作，以及审核状态和历史。
 */
export function useApproval(docType: string, docId: string) {
  const store = useApprovalStore()
  const loading = useApprovalStore((s) => s.loading)
  const instances = useApprovalStore(
    (s) => s.historyCache[`${docType}:${docId}`]
  )

  // 首次加载时获取审核历史
  useEffect(() => {
    if (docType && docId) {
      store.fetchHistory(docType, docId)
    }
  }, [docType, docId])

  // 最新的审核实例
  const latestInstance: ApprovalInstanceResponse | undefined = useMemo(() => {
    if (!instances || instances.length === 0) return undefined
    return instances[0]
  }, [instances])

  // 所有审核记录（时间线用）
  const allRecords = useMemo(() => {
    if (!instances) return []
    return instances.flatMap((inst) => inst.records)
  }, [instances])

  const submit = useCallback(
    async (docNumber?: string) => {
      return store.submit({ docType, docId, docNumber })
    },
    [docType, docId]
  )

  const approve = useCallback(
    async (comment?: string) => {
      if (!latestInstance) return { success: false, message: "无审核实例" }
      return store.process(latestInstance.id, "approve", comment)
    },
    [latestInstance]
  )

  const reject = useCallback(
    async (comment?: string) => {
      if (!latestInstance) return { success: false, message: "无审核实例" }
      return store.process(latestInstance.id, "reject", comment)
    },
    [latestInstance]
  )

  const withdraw = useCallback(async () => {
    if (!latestInstance) return { success: false, message: "无审核实例" }
    return store.withdraw(latestInstance.id)
  }, [latestInstance])

  const refresh = useCallback(() => {
    return store.fetchHistory(docType, docId)
  }, [docType, docId])

  return {
    loading,
    instances: instances ?? [],
    latestInstance,
    allRecords,
    submit,
    approve,
    reject,
    withdraw,
    refresh,
  }
}

/**
 * 审核权限检查 hook
 *
 * 基于服务端返回的审核实例数据判断当前用户权限。
 */
export function useApprovalPermission(docType: string, docId: string) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const latestInstance = useApprovalStore((s) => {
    const instances = s.historyCache[`${docType}:${docId}`]
    return instances?.[0]
  })

  const canApproveDoc = useMemo(() => {
    if (!latestInstance || !currentUser) return false
    if (latestInstance.status !== "in_progress") return false
    // 禁止自审
    if (latestInstance.submitterId === currentUser.id) return false
    // 不可重复审批
    const approvers = latestInstance.currentLevelApprovers as string[]
    if (approvers.includes(currentUser.id)) return false

    // 检查当前级别权限
    const levels = latestInstance.rule.levels
    const levelDef = levels[latestInstance.currentLevel - 1]
    if (!levelDef) return false

    if (levelDef.userIds?.includes(currentUser.id)) return true
    if (levelDef.roleIds) {
      return currentUser.roleIds.some((rid) => levelDef.roleIds!.includes(rid))
    }
    return false
  }, [latestInstance, currentUser])

  const canWithdraw = useMemo(() => {
    if (!latestInstance || !currentUser) return false
    return (
      latestInstance.status === "in_progress" &&
      latestInstance.submitterId === currentUser.id
    )
  }, [latestInstance, currentUser])

  const canSubmit = useMemo(() => {
    if (!latestInstance) return true
    return (
      latestInstance.status === "rejected" ||
      latestInstance.status === "pending"
    )
  }, [latestInstance])

  return { canApproveDoc, canWithdraw, canSubmit }
}

/**
 * 待审批列表 hook
 */
export function usePendingApprovals() {
  const store = useApprovalStore()
  const pendingList = useApprovalStore((s) => s.pendingList)
  const loading = useApprovalStore((s) => s.loading)

  useEffect(() => {
    store.fetchPending()
  }, [])

  const refresh = useCallback(() => {
    return store.fetchPending()
  }, [])

  return { pendingList, loading, refresh }
}
