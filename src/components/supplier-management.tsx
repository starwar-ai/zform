/**
 * SupplierManagement
 *
 * 供应商管理组件，包含生产商、服务商、物流商三个 Tab。
 * 每个 Tab 使用各自的 typeId 对应独立的 DocumentSchema。
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"

type SupplierTab = "manufacturer" | "service_provider" | "logistics"

export function SupplierManagement() {
  const [activeTab, setActiveTab] = useState<SupplierTab>("manufacturer")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  return (
    <div className="space-y-6 p-6">

      {/* 供应商类型 Tab 切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SupplierTab)}>
        <TabsList>
          <TabsTrigger value="manufacturer">生产商</TabsTrigger>
          <TabsTrigger value="service_provider">服务商</TabsTrigger>
          <TabsTrigger value="logistics">物流商</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前供应商列表 */}
      {activeTab === "manufacturer" && (
        <DocumentListTable
          typeId="manufacturer"
          onOpenDocument={handleOpenDocument}
        />
      )}
      {activeTab === "service_provider" && (
        <DocumentListTable
          typeId="service_provider"
          onOpenDocument={handleOpenDocument}
        />
      )}
      {activeTab === "logistics" && (
        <DocumentListTable
          typeId="logistics"
          onOpenDocument={handleOpenDocument}
        />
      )}
    </div>
  )
}
