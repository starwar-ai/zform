/**
 * PurchasePlanManagement
 *
 * 采购计划管理组件，包含商品采购、包材采购两个 Tab。
 * 每个 Tab 复用 DocumentListTable 渲染各自的列表。
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"

type PurchasePlanTab = "product_purchase" | "packaging_purchase"

export function PurchasePlanManagement() {
  const [activeTab, setActiveTab] = useState<PurchasePlanTab>("product_purchase")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  // 根据当前tab设置默认筛选条件
  const getDefaultFilters = () => {
    switch (activeTab) {
      case "product_purchase":
        return [{ columnId: "purchaseType", operator: "eq" as const, value: "PRODUCT" }]
      case "packaging_purchase":
        return [{ columnId: "purchaseType", operator: "eq" as const, value: "PACKAGING" }]
      default:
        return []
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* 采购计划类型 Tab 切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PurchasePlanTab)}>
        <TabsList>
          <TabsTrigger value="product_purchase">商品采购</TabsTrigger>
          <TabsTrigger value="packaging_purchase">包材采购</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前采购计划列表 */}
      <DocumentListTable 
        typeId="purchase_plan" 
        onOpenDocument={handleOpenDocument} 
        defaultFilters={getDefaultFilters()}
      />
    </div>
  )
}
