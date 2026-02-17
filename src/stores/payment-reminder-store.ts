/**
 * Payment Reminder Store (付款提醒 Store)
 *
 * 管理付款提醒状态，通过轮询获取新提醒
 */

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import {
  getPaymentRemindersApi,
  getPaymentUnreadCountApi,
  getPaymentReminderStatsApi,
  markPaymentReminderAsReadApi,
  markAllPaymentRemindersAsReadApi,
  type PaymentReminder,
  type PaymentReminderStats,
} from "@/apis/payment-workbench-api"

interface PaymentReminderStoreState {
  reminders: PaymentReminder[]
  stats: PaymentReminderStats | null
  unreadCount: number
  loading: boolean
  error: string | null
  pollingTimer: ReturnType<typeof setInterval> | null
  initialized: boolean

  // 分页
  page: number
  pageSize: number
  total: number

  // 操作
  fetchReminders: (params?: { page?: number; pageSize?: number; reminderType?: number; readStatus?: number }) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  fetchStats: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refresh: () => Promise<void>

  // 轮询
  startPolling: () => void
  stopPolling: () => void
}

const POLL_INTERVAL = 60_000 // 1分钟轮询一次

export const usePaymentReminderStore = create<PaymentReminderStoreState>()(
  immer((set, get) => ({
    reminders: [],
    stats: null,
    unreadCount: 0,
    loading: false,
    error: null,
    pollingTimer: null,
    initialized: false,
    page: 1,
    pageSize: 20,
    total: 0,

    fetchReminders: async (params) => {
      set((s) => {
        s.loading = true
        s.error = null
      })

      try {
        const result = await getPaymentRemindersApi({
          page: params?.page ?? get().page,
          pageSize: params?.pageSize ?? get().pageSize,
          reminderType: params?.reminderType,
          readStatus: params?.readStatus,
        })

        set((s) => {
          s.reminders = result.data
          s.total = result.total
          s.page = result.page
          s.pageSize = result.pageSize
          s.loading = false
          s.initialized = true
        })
      } catch (error) {
        set((s) => {
          s.loading = false
          s.error = error instanceof Error ? error.message : "获取提醒列表失败"
        })
      }
    },

    fetchUnreadCount: async () => {
      try {
        const { count } = await getPaymentUnreadCountApi()
        set((s) => {
          s.unreadCount = count
        })
      } catch {
        // 静默失败
      }
    },

    fetchStats: async () => {
      try {
        const stats = await getPaymentReminderStatsApi()
        set((s) => {
          s.stats = stats
          s.unreadCount = stats.unread
        })
      } catch {
        // 静默失败
      }
    },

    markAsRead: async (id) => {
      try {
        await markPaymentReminderAsReadApi(id)
        set((s) => {
          const reminder = s.reminders.find((r) => r.id === id)
          if (reminder && reminder.readStatus === 0) {
            reminder.readStatus = 1
            reminder.readAt = new Date().toISOString()
            s.unreadCount = Math.max(0, s.unreadCount - 1)
            if (s.stats) {
              s.stats.unread = Math.max(0, s.stats.unread - 1)
              if (reminder.reminderType === 1) {
                s.stats.dueSoon = Math.max(0, s.stats.dueSoon - 1)
              } else if (reminder.reminderType === 2) {
                s.stats.overdue = Math.max(0, s.stats.overdue - 1)
              }
            }
          }
        })
      } catch (error) {
        set((s) => {
          s.error = error instanceof Error ? error.message : "标记已读失败"
        })
      }
    },

    markAllAsRead: async () => {
      try {
        await markAllPaymentRemindersAsReadApi()
        set((s) => {
          s.reminders.forEach((r) => {
            if (r.readStatus === 0) {
              r.readStatus = 1
              r.readAt = new Date().toISOString()
            }
          })
          s.unreadCount = 0
          if (s.stats) {
            s.stats.unread = 0
            s.stats.dueSoon = 0
            s.stats.overdue = 0
          }
        })
      } catch (error) {
        set((s) => {
          s.error = error instanceof Error ? error.message : "标记全部已读失败"
        })
      }
    },

    refresh: async () => {
      await Promise.all([get().fetchReminders(), get().fetchStats()])
    },

    startPolling: () => {
      const { pollingTimer } = get()
      if (pollingTimer) return // 已在轮询

      // 立即执行一次
      get().fetchUnreadCount()

      const timer = setInterval(() => {
        get().fetchUnreadCount()
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
