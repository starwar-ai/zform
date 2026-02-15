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
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

type CustomerTab = "domestic" | "international"

export function CustomerManagement() {
  const [activeTab, setActiveTab] = useState<CustomerTab>("domestic")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `客户 ${docId}`)
  }

  const handleCreateCustomer = () => {
    // 根据当前标签页决定创建哪种类型的客户
    const isForeign = activeTab === "international"
    openTab("document-form", { typeId: "customer", isForeign }, `新建${isForeign ? '国外' : '国内'}客户`)
  }

  return (
    <div className="space-y-6 p-6">
      {/* 客户类型 Tab 切换 */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CustomerTab)}>
          <TabsList>
            <TabsTrigger value="domestic">国内客户</TabsTrigger>
            <TabsTrigger value="international">国外客户</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button onClick={handleCreateCustomer}>
          <Plus className="h-4 w-4 mr-2" />
          新建{activeTab === "domestic" ? "国内" : "国外"}客户
        </Button>
      </div>

      {/* 客户列表内容 */}
      <TabsContent value="domestic" className="mt-0">
        <DocumentListTable
          typeId="customer"
          onOpenDocument={handleOpenDocument}
          defaultFilters={[{ columnId: "isForeign", operator: "eq", value: false }]}
        />
      </TabsContent>

      <TabsContent value="international" className="mt-0">
        <DocumentListTable
          typeId="customer"
          onOpenDocument={handleOpenDocument}
          defaultFilters={[{ columnId: "isForeign", operator: "eq", value: true }]}
        />
      </TabsContent>
    </div>
  )
}