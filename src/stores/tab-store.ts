import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"
import { nanoid } from "nanoid"

// 标签类型
export type TabType =
  | "dashboard"
  | "document-list"
  | "document-form"
  | "type-list"
  | "user-management"
  | "role-management"
  | "menu-management"
  | "department-management"
  | "business-entities"
  | "business-parameters"
  | "product-management"
  | "customer-management"
  | "supplier-management"
  | "sales-management"
  | "purchase-plan-management"
  | "purchase-contract-management"
  | "warehouse-management" // 保留兼容
  | "warehouse-inventory" // 库存查询
  | "warehouse-inbound" // 入库管理
  | "warehouse-outbound" // 出库管理
  | "shipping-document-management" // 出运单证管理
  | "approval-flow-management" // 审批流程配置
  | "approval-flow-editor" // 审批规则编辑

// 标签数据结构
export interface Tab {
  id: string // 标签唯一 ID
  type: TabType // 标签类型
  title: string // 显示标题
  closable: boolean // 是否可关闭
  params?: Record<string, unknown> // 路由参数
  createdAt: number // 创建时间
}

// 关闭前钩子：返回 true 允许关闭，false 阻止关闭
export type BeforeCloseHook = (tabId: string) => boolean | Promise<boolean>

interface TabStoreState {
  tabs: Tab[]
  activeTabId: string | null
  beforeCloseHooks: Record<string, BeforeCloseHook>

  // 核心方法
  openTab: (
    type: TabType,
    params?: Record<string, unknown>,
    title?: string
  ) => string
  closeTab: (tabId: string) => Promise<void>
  closeAllTabs: () => Promise<void>
  closeOtherTabs: (tabId: string) => Promise<void>
  closeLeftTabs: (tabId: string) => Promise<void>
  closeRightTabs: (tabId: string) => Promise<void>
  switchTab: (tabId: string) => void
  moveTab: (fromIndex: number, toIndex: number) => void
  updateTabTitle: (tabId: string, title: string) => void
  
  // 钩子管理
  registerBeforeCloseHook: (tabId: string, hook: BeforeCloseHook) => void
  unregisterBeforeCloseHook: (tabId: string) => void
}

// 判断两个标签是否相同（基于 type 和 params）
function isSameTab(
  tab1: { type: TabType; params?: Record<string, unknown> },
  tab2: { type: TabType; params?: Record<string, unknown> }
): boolean {
  if (tab1.type !== tab2.type) return false

  const params1 = tab1.params || {}
  const params2 = tab2.params || {}

  const keys1 = Object.keys(params1).sort()
  const keys2 = Object.keys(params2).sort()

  if (keys1.length !== keys2.length) return false

  return keys1.every((key) => params1[key] === params2[key])
}

export const useTabStore = create<TabStoreState>()(
  persist(
    immer((set, get) => ({
      tabs: [],
      activeTabId: null,
      beforeCloseHooks: {},

      openTab: (type, params = {}, title = "新标签") => {
        const state = get()

        // 检查是否已存在相同标签
        const existingTab = state.tabs.find((tab) =>
          isSameTab({ type, params }, tab)
        )

        if (existingTab) {
          // 存在则激活
          set((draft) => {
            draft.activeTabId = existingTab.id
          })
          return existingTab.id
        }

        // 创建新标签
        const newTab: Tab = {
          id: nanoid(),
          type,
          title,
          closable:
            type !== "dashboard" ||
            Object.keys(params).length > 0, // 首页不可关闭
          params,
          createdAt: Date.now(),
        }

        set((draft) => {
          // 首页标签始终插入到第一个位置
          if (type === "dashboard") {
            draft.tabs.unshift(newTab)
          } else {
            draft.tabs.push(newTab)
          }
          draft.activeTabId = newTab.id
        })

        return newTab.id
      },

      closeTab: async (tabId) => {
        const state = get()
        const tab = state.tabs.find((t) => t.id === tabId)
        if (!tab || !tab.closable) return

        // 执行关闭前钩子
        const hook = state.beforeCloseHooks[tabId]
        if (hook) {
          const canClose = await hook(tabId)
          if (!canClose) return
        }

        set((draft) => {
          const index = draft.tabs.findIndex((tab) => tab.id === tabId)
          if (index === -1) return

          draft.tabs.splice(index, 1)

          // 清除钩子
          delete draft.beforeCloseHooks[tabId]

          // 如果关闭的是激活标签，激活邻近标签
          if (draft.activeTabId === tabId) {
            if (draft.tabs.length === 0) {
              draft.activeTabId = null
            } else if (index < draft.tabs.length) {
              // 激活右侧标签
              draft.activeTabId = draft.tabs[index].id
            } else {
              // 激活左侧标签
              draft.activeTabId = draft.tabs[index - 1].id
            }
          }
        })
      },

      closeAllTabs: async () => {
        const state = get()
        const closableTabs = state.tabs.filter((tab) => tab.closable)

        // 依次检查所有可关闭标签的钩子
        for (const tab of closableTabs) {
          const hook = state.beforeCloseHooks[tab.id]
          if (hook) {
            const canClose = await hook(tab.id)
            if (!canClose) return // 任何一个阻止则取消全部关闭
          }
        }

        set((draft) => {
          const unclosableTabs = draft.tabs.filter((tab) => !tab.closable)
          
          // 清除所有可关闭标签的钩子
          for (const tab of closableTabs) {
            delete draft.beforeCloseHooks[tab.id]
          }

          draft.tabs = unclosableTabs

          // 如果当前激活标签被关闭，激活第一个不可关闭标签
          if (
            draft.activeTabId &&
            !unclosableTabs.find((tab) => tab.id === draft.activeTabId)
          ) {
            draft.activeTabId =
              unclosableTabs.length > 0 ? unclosableTabs[0].id : null
          }
        })
      },

      closeOtherTabs: async (tabId) => {
        const state = get()
        const currentTab = state.tabs.find((tab) => tab.id === tabId)
        if (!currentTab) return

        const tabsToClose = state.tabs.filter(
          (tab) => tab.id !== tabId && tab.closable
        )

        // 依次检查要关闭的标签的钩子
        for (const tab of tabsToClose) {
          const hook = state.beforeCloseHooks[tab.id]
          if (hook) {
            const canClose = await hook(tab.id)
            if (!canClose) return
          }
        }

        set((draft) => {
          const unclosableTabs = draft.tabs.filter((tab) => !tab.closable)
          
          // 清除要关闭标签的钩子
          for (const tab of tabsToClose) {
            delete draft.beforeCloseHooks[tab.id]
          }

          draft.tabs = [...unclosableTabs, currentTab].filter(
            (tab, index, self) => self.findIndex((t) => t.id === tab.id) === index
          )
          draft.activeTabId = tabId
        })
      },

      closeLeftTabs: async (tabId) => {
        const state = get()
        const index = state.tabs.findIndex((tab) => tab.id === tabId)
        if (index === -1) return

        const leftTabs = state.tabs.slice(0, index)
        const closableLeftTabs = leftTabs.filter((tab) => tab.closable)

        // 检查左侧可关闭标签的钩子
        for (const tab of closableLeftTabs) {
          const hook = state.beforeCloseHooks[tab.id]
          if (hook) {
            const canClose = await hook(tab.id)
            if (!canClose) return
          }
        }

        set((draft) => {
          const index = draft.tabs.findIndex((tab) => tab.id === tabId)
          if (index === -1) return

          const leftTabs = draft.tabs.slice(0, index)
          const rightTabs = draft.tabs.slice(index)

          const unclosableLeftTabs = leftTabs.filter((tab) => !tab.closable)
          
          // 清除左侧可关闭标签的钩子
          for (const tab of closableLeftTabs) {
            delete draft.beforeCloseHooks[tab.id]
          }

          draft.tabs = [...unclosableLeftTabs, ...rightTabs]

          // 如果当前激活标签被关闭，激活目标标签
          if (
            draft.activeTabId &&
            !draft.tabs.find((tab) => tab.id === draft.activeTabId)
          ) {
            draft.activeTabId = tabId
          }
        })
      },

      closeRightTabs: async (tabId) => {
        const state = get()
        const index = state.tabs.findIndex((tab) => tab.id === tabId)
        if (index === -1) return

        const rightTabs = state.tabs.slice(index + 1)
        const closableRightTabs = rightTabs.filter((tab) => tab.closable)

        // 检查右侧可关闭标签的钩子
        for (const tab of closableRightTabs) {
          const hook = state.beforeCloseHooks[tab.id]
          if (hook) {
            const canClose = await hook(tab.id)
            if (!canClose) return
          }
        }

        set((draft) => {
          const index = draft.tabs.findIndex((tab) => tab.id === tabId)
          if (index === -1) return

          const leftTabs = draft.tabs.slice(0, index + 1)
          const rightTabs = draft.tabs.slice(index + 1)

          const unclosableRightTabs = rightTabs.filter((tab) => !tab.closable)
          
          // 清除右侧可关闭标签的钩子
          for (const tab of closableRightTabs) {
            delete draft.beforeCloseHooks[tab.id]
          }

          draft.tabs = [...leftTabs, ...unclosableRightTabs]

          // 如果当前激活标签被关闭，激活目标标签
          if (
            draft.activeTabId &&
            !draft.tabs.find((tab) => tab.id === draft.activeTabId)
          ) {
            draft.activeTabId = tabId
          }
        })
      },

      switchTab: (tabId) => {
        set((draft) => {
          if (draft.tabs.find((tab) => tab.id === tabId)) {
            draft.activeTabId = tabId
          }
        })
      },

      moveTab: (fromIndex, toIndex) => {
        set((draft) => {
          if (
            fromIndex < 0 ||
            fromIndex >= draft.tabs.length ||
            toIndex < 0 ||
            toIndex >= draft.tabs.length
          ) {
            return
          }

          // 首页标签不可移动
          if (draft.tabs[fromIndex].type === "dashboard") return

          // 不允许移动到首页标签之前
          if (toIndex === 0 && draft.tabs[0]?.type === "dashboard") return

          const [movedTab] = draft.tabs.splice(fromIndex, 1)
          draft.tabs.splice(toIndex, 0, movedTab)
        })
      },

      updateTabTitle: (tabId, title) => {
        set((draft) => {
          const tab = draft.tabs.find((t) => t.id === tabId)
          if (tab) {
            tab.title = title
          }
        })
      },

      registerBeforeCloseHook: (tabId, hook) => {
        set((draft) => {
          draft.beforeCloseHooks[tabId] = hook
        })
      },

      unregisterBeforeCloseHook: (tabId) => {
        set((draft) => {
          delete draft.beforeCloseHooks[tabId]
        })
      },
    })),
    {
      name: "zform-tab-storage",
      // 仅持久化 tabs 和 activeTabId
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
      // 从持久化恢复时，清理已废弃的标签类型
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<TabStoreState>
        const cleanedTabs = (persistedState.tabs || []).filter(
          (tab) => tab.type !== "document-list" || Object.keys(tab.params || {}).length > 0
        )
        const activeTabId = persistedState.activeTabId
        const isActiveValid = cleanedTabs.some((tab) => tab.id === activeTabId)
        return {
          ...current,
          tabs: cleanedTabs,
          activeTabId: isActiveValid
            ? activeTabId!
            : cleanedTabs.length > 0
              ? cleanedTabs[0].id
              : null,
        }
      },
    }
  )
)
