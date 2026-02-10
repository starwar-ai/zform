/**
 * WarehouseManagement
 *
 * 仓库管理组件，包含入库管理、出库管理、库存查询三个 Tab。
 * 每个 Tab 使用各自的 typeId 对应独立的 DocumentSchema。
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"

type WarehouseTab = "inbound" | "outbound" | "inventory"

export function WarehouseManagement() {
  const [activeTab, setActiveTab] = useState<WarehouseTab>("inbound")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  return (
    <div className="space-y-6 p-6">

      {/* 仓库类型 Tab 切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as WarehouseTab)}>
        <TabsList>
          <TabsTrigger value="inbound">入库管理</TabsTrigger>
          <TabsTrigger value="outbound">出库管理</TabsTrigger>
          <TabsTrigger value="inventory">库存查询</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前仓库列表 */}
      {activeTab === "inbound" && (
        <DocumentListTable
          typeId="warehouse_inbound"
          onOpenDocument={handleOpenDocument}
        />
      )}
      {activeTab === "outbound" && (
        <DocumentListTable
          typeId="warehouse_outbound"
          onOpenDocument={handleOpenDocument}
        />
      )}
      {activeTab === "inventory" && (
        <DocumentListTable
          typeId="warehouse_inventory"
          onOpenDocument={handleOpenDocument}
        />
      )}
    </div>
  )
}
