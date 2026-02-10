/**
 * ShippingDocumentManagement
 *
 * 出运单证管理组件，包含商检单、报关单两个 Tab。
 * 每个 Tab 复用 DocumentListTable 渲染各自的列表。
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"

type ShippingDocumentTab = "inspection" | "customs"

export function ShippingDocumentManagement() {
  const [activeTab, setActiveTab] = useState<ShippingDocumentTab>("inspection")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  // 根据当前tab获取对应的typeId
  const getTypeId = (): string => {
    switch (activeTab) {
      case "inspection":
        return "inspection_declaration"
      case "customs":
        return "customs_declaration"
      default:
        return "inspection_declaration"
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* 出运单证类型 Tab 切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ShippingDocumentTab)}>
        <TabsList>
          <TabsTrigger value="inspection">商检单</TabsTrigger>
          <TabsTrigger value="customs">报关单</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前出运单证列表 */}
      <DocumentListTable 
        typeId={getTypeId()} 
        onOpenDocument={handleOpenDocument} 
      />
    </div>
  )
}
