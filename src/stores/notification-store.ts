/**
 * Notification Store (通知 Store)
 *
 * 管理待审批通知状态，通过轮询对比检测新增/消失的待审批任务。
 */

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { getPendingApprovalsApi } from "@/lib/approval-api"
import type { ApprovalInstanceResponse } from "@/lib/approval-api"

export interface Notification {
  id: string
  title: string
  description: string
  instanceId: string
  docType: string
  docId: string
  createdAt: string
}

interface NotificationStoreState {
  notifications: Notification[]
  /** 上次轮询获取的 pending instanceId 集合 */
  lastPendingIds: Set<string>
  /** 轮询定时器 */
  pollingTimer: ReturnType<typeof setInterval> | null
  /** 是否已初始化（首次轮询完成） */
  initialized: boolean

  // 计算属性
  unreadCount: () => number

  // 操作
  addNotification: (n: Notification) => void
  dismiss: (id: string) => void
  dismissByInstanceId: (instanceId: string) => void
  clearAll: () => void

  // 轮询
  startPolling: () => void
  stopPolling: () => void
  fetchAndCompare: () => Promise<void>
}

function buildNotification(inst: ApprovalInstanceResponse): Notification {
  const levelName =
    inst.rule.levels[inst.currentLevel - 1]?.name || `第${inst.currentLevel}级`
  return {
    id: `notif-${inst.id}`,
    title: `${inst.rule.name} - ${inst.docNumber || inst.docId}`,
    description: `提交人: ${inst.submitterName || inst.submitterId} | 当前: ${levelName}`,
    instanceId: inst.id,
    docType: inst.docType,
    docId: inst.docId,
    createdAt: inst.submittedAt,
  }
}

const POLL_INTERVAL = 30_000

export const useNotificationStore = create<NotificationStoreState>()(
  immer((set, get) => ({
    notifications: [],
    lastPendingIds: new Set(),
    pollingTimer: null,
    initialized: false,

    unreadCount: () => get().notifications.length,

    addNotification: (n) => {
      set((s) => {
        if (!s.notifications.find((x) => x.id === n.id)) {
          s.notifications.unshift(n)
        }
      })
    },

    dismiss: (id) => {
      set((s) => {
        s.notifications = s.notifications.filter((n) => n.id !== id)
      })
    },

    dismissByInstanceId: (instanceId) => {
      set((s) => {
        s.notifications = s.notifications.filter(
          (n) => n.instanceId !== instanceId
        )
      })
    },

    clearAll: () => {
      set((s) => {
        s.notifications = []
      })
    },

    fetchAndCompare: async () => {
      try {
        const pendingList = await getPendingApprovalsApi()
        const newIds = new Set(pendingList.map((inst) => inst.id))
        const { lastPendingIds, initialized } = get()

        if (initialized) {
          // 新增的 — 生成通知
          for (const inst of pendingList) {
            if (!lastPendingIds.has(inst.id)) {
              const notif = buildNotification(inst)
              get().addNotification(notif)
            }
          }

          // 消失的 — 自动移除通知
          for (const oldId of lastPendingIds) {
            if (!newIds.has(oldId)) {
              get().dismissByInstanceId(oldId)
            }
          }
        } else {
          // 首次加载：把所有 pending 都作为通知
          const notifs = pendingList.map(buildNotification)
          set((s) => {
            s.notifications = notifs
            s.initialized = true
          })
        }

        set((s) => {
          s.lastPendingIds = newIds
        })
      } catch {
        // 静默失败，下次轮询重试
      }
    },

    startPolling: () => {
      const { pollingTimer } = get()
      if (pollingTimer) return // 已在轮询

      // 立即执行一次
      get().fetchAndCompare()

      const timer = setInterval(() => {
        get().fetchAndCompare()
      }, POLL_INTERVAL)

      set((s) => {
        s.pollingTimer = timer as unknown as ReturnType<typeof setInterval>
      })
    },

    stopPolling: () => {
      const { pollingTimer } = get()
      if (pollingTimer) {
        clearInterval(pollingTimer)
        set((s) => {
          s.pollingTimer = null
        })
      }
    },
  }))
)
