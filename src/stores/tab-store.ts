import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"
import { nanoid } from "nanoid"

// 标签类型
export type TabType =
  | "document-list"
  | "document-form"
  | "type-list"
  | "user-management"
  | "role-management"
  | "menu-management"

// 标签数据结构
export interface Tab {
  id: string // 标签唯一 ID
  type: TabType // 标签类型
  title: string // 显示标题
  closable: boolean // 是否可关闭
  params?: Record<string, unknown> // 路由参数
  createdAt: number // 创建时间
}

interface TabStoreState {
  tabs: Tab[]
  activeTabId: string | null

  // 核心方法
  openTab: (
    type: TabType,
    params?: Record<string, unknown>,
    title?: string
  ) => string
  closeTab: (tabId: string) => void
  closeAllTabs: () => void
  closeOtherTabs: (tabId: string) => void
  closeLeftTabs: (tabId: string) => void
  closeRightTabs: (tabId: string) => void
  switchTab: (tabId: string) => void
  moveTab: (fromIndex: number, toIndex: number) => void
  updateTabTitle: (tabId: string, title: string) => void
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
          closable: type !== "document-list" || Object.keys(params).length > 0, // 首页不可关闭
          params,
          createdAt: Date.now(),
        }

        set((draft) => {
          draft.tabs.push(newTab)
          draft.activeTabId = newTab.id
        })

        return newTab.id
      },

      closeTab: (tabId) => {
        set((draft) => {
          const index = draft.tabs.findIndex((tab) => tab.id === tabId)
          if (index === -1) return

          const tab = draft.tabs[index]
          if (!tab.closable) return // 不可关闭的标签

          draft.tabs.splice(index, 1)

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

      closeAllTabs: () => {
        set((draft) => {
          const unclosableTabs = draft.tabs.filter((tab) => !tab.closable)
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

      closeOtherTabs: (tabId) => {
        set((draft) => {
          const currentTab = draft.tabs.find((tab) => tab.id === tabId)
          if (!currentTab) return

          const unclosableTabs = draft.tabs.filter((tab) => !tab.closable)
          draft.tabs = [...unclosableTabs, currentTab].filter(
            (tab, index, self) => self.findIndex((t) => t.id === tab.id) === index
          )
          draft.activeTabId = tabId
        })
      },

      closeLeftTabs: (tabId) => {
        set((draft) => {
          const index = draft.tabs.findIndex((tab) => tab.id === tabId)
          if (index === -1) return

          const leftTabs = draft.tabs.slice(0, index)
          const rightTabs = draft.tabs.slice(index)

          const unclosableLeftTabs = leftTabs.filter((tab) => !tab.closable)
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

      closeRightTabs: (tabId) => {
        set((draft) => {
          const index = draft.tabs.findIndex((tab) => tab.id === tabId)
          if (index === -1) return

          const leftTabs = draft.tabs.slice(0, index + 1)
          const rightTabs = draft.tabs.slice(index + 1)

          const unclosableRightTabs = rightTabs.filter((tab) => !tab.closable)
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
    })),
    {
      name: "zform-tab-storage",
      // 仅持久化 tabs 和 activeTabId
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
)
