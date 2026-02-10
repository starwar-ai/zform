/**
 * SalesContractManagement
 *
 * 销售合同管理组件，包含外销合同、内销合同、联营合同三个 Tab。
 * 每个 Tab 复用 DocumentListTable 渲染各自的列表。
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"

type SalesContractTab = "export_sales_contract" | "domestic_sales_contract" | "joint_venture_sales_contract"

export function SalesContractManagement() {
  const [activeTab, setActiveTab] = useState<SalesContractTab>("export_sales_contract")
  const openTab = useTabStore((s) => s.openTab)

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  // 根据当前tab设置默认筛选条件
  const getDefaultFilters = () => {
    switch (activeTab) {
      case "export_sales_contract":
        return [{ columnId: "contractType", operator: "eq" as const, value: "EXPORT" }]
      case "domestic_sales_contract":
        return [{ columnId: "contractType", operator: "eq" as const, value: "DOMESTIC" }]
      case "joint_venture_sales_contract":
        return [{ columnId: "contractType", operator: "eq" as const, value: "JOINT_VENTURE" }]
      default:
        return []
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* 销售合同类型 Tab 切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SalesContractTab)}>
        <TabsList>
          <TabsTrigger value="export_sales_contract">外销合同</TabsTrigger>
          <TabsTrigger value="domestic_sales_contract">内销合同</TabsTrigger>
          <TabsTrigger value="joint_venture_sales_contract">联营合同</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前合同列表 */}
      <DocumentListTable 
        typeId="sales_contract" 
        onOpenDocument={handleOpenDocument} 
        defaultFilters={getDefaultFilters()}
      />
    </div>
  )
}