/**
 * CustomerManagement
 *
 * 客户管理组件，包含国内客户、国外客户两个 Tab。
 * 每个 Tab 复用 DocumentListTable 渲染各自的客户列表。
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"

type CustomerTab = "domestic" | "international"

export function CustomerManagement() {
  const [activeTab, setActiveTab] = useState<CustomerTab>("domestic")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `客户 ${docId}`)
  }

  return (
    <div className="space-y-6 p-6">
      {/* 客户类型 Tab 切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CustomerTab)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="domestic">国内客户</TabsTrigger>
            <TabsTrigger value="international">国外客户</TabsTrigger>
          </TabsList>

        </div>

        {/* 客户列表内容 */}
        <TabsContent value="domestic" className="mt-6">
          <DocumentListTable
            typeId="domestic_customer"
            onOpenDocument={handleOpenDocument}
          />
        </TabsContent>

        <TabsContent value="international" className="mt-6">
          <DocumentListTable
            typeId="international_customer"
            onOpenDocument={handleOpenDocument}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}