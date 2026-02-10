/**
 * PurchaseContractManagement
 *
 * 采购合同管理组件，包含商品采购合同、包材采购合同两个 Tab。
 * 每个 Tab 复用 DocumentListTable 渲染各自的列表。
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"

type PurchaseContractTab = "product_purchase" | "packaging_purchase"

export function PurchaseContractManagement() {
  const [activeTab, setActiveTab] = useState<PurchaseContractTab>("product_purchase")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  // 根据当前tab获取对应的typeId
  const getTypeId = (): string => {
    switch (activeTab) {
      case "product_purchase":
        return "product_purchase_contract"
      case "packaging_purchase":
        return "packaging_purchase_contract"
      default:
        return "purchase_contract"
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* 采购合同类型 Tab 切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PurchaseContractTab)}>
        <TabsList>
          <TabsTrigger value="product_purchase">商品采购</TabsTrigger>
          <TabsTrigger value="packaging_purchase">包材采购</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前采购合同列表 */}
      <DocumentListTable 
        typeId={getTypeId()} 
        onOpenDocument={handleOpenDocument} 
      />
    </div>
  )
}
