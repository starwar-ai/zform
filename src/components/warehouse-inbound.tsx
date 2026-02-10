/**
 * WarehouseInbound
 *
 * 入库管理组件，包含入库通知单和入库单两个Tab
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"
import { PackageOpen } from "lucide-react"

type InboundTab = "notice" | "order"

export function WarehouseInbound() {
  const [activeTab, setActiveTab] = useState<InboundTab>("notice")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-2">
        <PackageOpen className="h-5 w-5" />
        <h1 className="text-xl font-bold">入库管理</h1>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InboundTab)}>
        <TabsList>
          <TabsTrigger value="notice">入库通知单</TabsTrigger>
          <TabsTrigger value="order">入库单</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前列表 */}
      {activeTab === "notice" && (
        <DocumentListTable
          typeId="warehouse_inbound_notice"
          onOpenDocument={handleOpenDocument}
        />
      )}
      {activeTab === "order" && (
        <DocumentListTable
          typeId="warehouse_inbound"
          onOpenDocument={handleOpenDocument}
        />
      )}
    </div>
  )
}
