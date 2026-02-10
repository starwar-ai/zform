/**
 * WarehouseOutbound
 *
 * 出库管理组件，包含出库通知单和出库单两个Tab
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"
import { PackageX } from "lucide-react"

type OutboundTab = "notice" | "order"

export function WarehouseOutbound() {
  const [activeTab, setActiveTab] = useState<OutboundTab>("notice")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-2">
        <PackageX className="h-5 w-5" />
        <h1 className="text-xl font-bold">出库管理</h1>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OutboundTab)}>
        <TabsList>
          <TabsTrigger value="notice">出库通知单</TabsTrigger>
          <TabsTrigger value="order">出库单</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前列表 */}
      {activeTab === "notice" && (
        <DocumentListTable
          typeId="warehouse_outbound_notice"
          onOpenDocument={handleOpenDocument}
        />
      )}
      {activeTab === "order" && (
        <DocumentListTable
          typeId="warehouse_outbound"
          onOpenDocument={handleOpenDocument}
        />
      )}
    </div>
  )
}
