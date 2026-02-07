/**
 * AppLayout
 *
 * 应用主布局容器。包含三层结构：侧边栏 + 标签栏 + 内容区 + 状态栏。
 */

import { useEffect } from "react"
import { useTabStore } from "@/stores/tab-store"
import { useNotificationStore } from "@/stores/notification-store"
import { Sidebar } from "@/components/sidebar"
import { TabBar } from "@/components/tab-bar"
import { TabContent } from "@/components/tab-content"
import { StatusBar } from "@/components/status-bar"

export function AppLayout() {
  const { tabs, openTab } = useTabStore()
  const startPolling = useNotificationStore((s) => s.startPolling)
  const stopPolling = useNotificationStore((s) => s.stopPolling)

  // 初始化：如果没有任何标签，打开首页
  useEffect(() => {
    if (tabs.length === 0) {
      openTab("document-list", {}, "单据列表")
    }
  }, []) // 仅在组件挂载时执行一次

  // 启动/停止通知轮询
  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧导航栏 */}
      <Sidebar />

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 标签栏 */}
        <TabBar />

        {/* 内容区 */}
        <TabContent />

        {/* 底部状态栏 */}
        <StatusBar />
      </div>
    </div>
  )
}
