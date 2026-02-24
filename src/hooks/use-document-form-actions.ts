/**
 * Document Form Actions Hook
 *
 * 根据单据状态、用户权限、审核状态，解析当前用户在表单页可执行的操作列表。
 * 核心过滤链: allowedStatuses -> permission -> visible(ctx)
 */

import { useMemo } from "react"
import type { DocumentData, DocumentFormActionDef, ActionContext } from "@/core/types"
import { registry } from "@/core/registry"
import { useAuthStore } from "@/stores/auth-store"
import { useApprovalPermission } from "@/hooks/use-approval"
import { useUserPermissions } from "@/hooks/use-user-permissions"

const EMPTY_PERMISSIONS = new Set<string>()

/**
 * 解析单据表单页可用操作
 *
 * @param doc 当前单据数据 (可为 undefined，此时返回空操作列表)
 * @returns visibleActions - 可见的操作列表 (已按 order 排序)
 *          isDisabled - 判断某个操作是否禁用
 */
export function useDocumentFormActions(
  doc: DocumentData | undefined,
  activeChange?: { id: string; originalData: Record<string, unknown>; changeReason: string } | null,
) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const { permissions } = useUserPermissions()
  const { canApproveDoc, canWithdraw, canSubmit } = useApprovalPermission(
    doc?.typeId ?? "",
    doc?.id ?? ""
  )

  const formActionConfig = useMemo(
    () => (doc ? registry.getFormActionConfig(doc.typeId) : undefined),
    [doc?.typeId]
  )

  // 组装操作上下文
  const actionContext = useMemo<ActionContext | null>(() => {
    if (!doc) return null
    return {
      doc,
      isNew: Boolean(doc._isNew),
      currentUserId: currentUser?.id ?? "",
      userPermissions: permissions ?? EMPTY_PERMISSIONS,
      approvalState: {
        canApprove: canApproveDoc,
        canWithdraw,
        canSubmit,
      },
      activeChange,
    }
  }, [doc, currentUser?.id, permissions, canApproveDoc, canWithdraw, canSubmit, activeChange])

  // 过滤并排序可见操作
  const visibleActions = useMemo<DocumentFormActionDef[]>(() => {
    if (!formActionConfig || !doc || !actionContext) return []

    return formActionConfig.actions
      .filter((action) => {
        // 1. allowedStatuses 检查
        if (
          action.allowedStatuses &&
          action.allowedStatuses.length > 0 &&
          !action.allowedStatuses.includes(doc.status)
        ) {
          return false
        }

        // 2. permission 检查
        if (action.permission && !permissions.has(action.permission)) {
          return false
        }

        // 3. visible 回调检查 (优先级最高)
        if (action.visible && !action.visible(actionContext)) {
          return false
        }

        return true
      })
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
  }, [formActionConfig, doc, permissions, actionContext])

  // 禁用状态检查
  const disabledMap = useMemo(() => {
    const map = new Map<string, boolean>()
    if (!actionContext) return map
    for (const action of visibleActions) {
      if (action.disabled) {
        map.set(action.id, action.disabled(actionContext))
      } else {
        map.set(action.id, false)
      }
    }
    return map
  }, [visibleActions, actionContext])

  const isDisabled = (actionId: string) => disabledMap.get(actionId) ?? false

  return { visibleActions, isDisabled }
}
