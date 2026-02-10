/**
 * QualityManagement
 *
 * 质检管理组件，包含来料质检、过程质检、成品质检三个 Tab。
 * 每个 Tab 使用各自的 typeId 对应独立的 DocumentSchema。
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"

type QualityTab = "incoming" | "process" | "finished"

export function QualityManagement() {
  const [activeTab, setActiveTab] = useState<QualityTab>("incoming")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  return (
    <div className="space-y-6 p-6">

      {/* 质检类型 Tab 切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as QualityTab)}>
        <TabsList>
          <TabsTrigger value="incoming">来料质检</TabsTrigger>
          <TabsTrigger value="process">过程质检</TabsTrigger>
          <TabsTrigger value="finished">成品质检</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前质检列表 */}
      {activeTab === "incoming" && (
        <DocumentListTable
          typeId="quality_incoming"
          onOpenDocument={handleOpenDocument}
        />
      )}
      {activeTab === "process" && (
        <DocumentListTable
          typeId="quality_process"
          onOpenDocument={handleOpenDocument}
        />
      )}
      {activeTab === "finished" && (
        <DocumentListTable
          typeId="quality_finished"
          onOpenDocument={handleOpenDocument}
        />
      )}
    </div>
  )
}
