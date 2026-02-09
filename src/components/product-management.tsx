/**
 * ProductManagement
 *
 * 产品管理组件，包含标准产品、客户产品、自营产品三个 Tab。
 * 每个 Tab 复用 DocumentListTable 渲染各自的列表。
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"

type ProductTab = "standard_product" | "customer_product" | "self_owned_product"

export function ProductManagement() {
  const [activeTab, setActiveTab] = useState<ProductTab>("standard_product")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  return (
    <div className="space-y-6 p-6">

      {/* 产品类型 Tab 切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProductTab)}>
        <TabsList>
          <TabsTrigger value="standard_product">标准产品</TabsTrigger>
          <TabsTrigger value="customer_product">客户产品</TabsTrigger>
          <TabsTrigger value="self_owned_product">自营产品</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前产品列表 */}
      {activeTab === "standard_product" && (
        <DocumentListTable typeId="standard_product" onOpenDocument={handleOpenDocument} />
      )}
      {activeTab === "customer_product" && (
        <DocumentListTable typeId="customer_product" onOpenDocument={handleOpenDocument} />
      )}
      {activeTab === "self_owned_product" && (
        <DocumentListTable typeId="self_owned_product" onOpenDocument={handleOpenDocument} />
      )}
    </div>
  )
}
