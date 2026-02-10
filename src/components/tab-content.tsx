/**
 * TabContent
 *
 * 标签内容渲染器。根据激活标签的类型动态渲染对应组件。
 */

import { useTabStore } from "@/stores/tab-store"
import { DocumentForm } from "@/components/document-form"
import { DocumentListTable } from "@/components/list-table"
import { UserManagement } from "@/components/user-management"
import { RoleManagement } from "@/components/role-management"
import { MenuManagement } from "@/components/menu-management"
import { DepartmentManagement } from "@/components/department-management"
import { CategoryManagement } from "@/components/category-management"
import { BusinessConfig } from "@/components/business-config"
import { ProductManagement } from "@/components/product-management"
import { SupplierManagement } from "@/components/supplier-management"
import { SalesContractManagement } from "@/components/sales-contract-management"
import { PurchasePlanManagement } from "@/components/purchase-plan-management"
import { PurchaseContractManagement } from "@/components/purchase-contract-management"
import { WarehouseManagement } from "@/components/warehouse-management"
import { WarehouseInventory } from "@/components/warehouse-inventory"
import { WarehouseInbound } from "@/components/warehouse-inbound"
import { WarehouseOutbound } from "@/components/warehouse-outbound"
import { QualityManagement } from "@/components/quality-management"
import { DashboardHome } from "@/components/dashboard-home"

export function TabContent() {
  const { tabs, activeTabId, openTab } = useTabStore()

  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">暂无打开的标签</p>
      </div>
    )
  }

  // 处理导航回调，适配为 openTab 调用
  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  // 根据标签类型渲染内容
  const renderContent = () => {
    switch (activeTab.type) {
      case "dashboard":
        return (
          <DashboardHome
            onOpenDocument={handleOpenDocument}
            onOpenTypeList={(typeId, title) =>
              openTab("type-list", { typeId }, title)
            }
          />
        )

      case "document-form":
        if (!activeTab.params?.docId) {
          return (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">无效的单据 ID</p>
            </div>
          )
        }
        return (
          <div className="p-6">
            <DocumentForm
              docId={activeTab.params.docId as string}
              typeId={activeTab.params.typeId as string | undefined}
              onNavigate={handleOpenDocument}
            />
          </div>
        )

      case "type-list":
        if (!activeTab.params?.typeId) {
          return (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">无效的单据类型 ID</p>
            </div>
          )
        }
        return (
          <DocumentListTable
            typeId={activeTab.params.typeId as string}
            onOpenDocument={handleOpenDocument}
          />
        )

      case "user-management":
        return <UserManagement />

      case "role-management":
        return <RoleManagement />

      case "menu-management":
        return <MenuManagement />

      case "department-management":
        return <DepartmentManagement />

      case "category-management":
        return <CategoryManagement />

      case "business-config":
        return <BusinessConfig />

      case "product-management":
        return <ProductManagement />

      case "supplier-management":
        return <SupplierManagement />

      case "sales-management":
        return <SalesContractManagement />

      case "purchase-plan-management":
        return <PurchasePlanManagement />

      case "purchase-contract-management":
        return <PurchaseContractManagement />

      case "warehouse-management":
        return <WarehouseManagement />

      case "warehouse-inventory":
        return <WarehouseInventory />

      case "warehouse-inbound":
        return <WarehouseInbound />

      case "warehouse-outbound":
        return <WarehouseOutbound />

      case "quality-management":
        return <QualityManagement />

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">未知标签类型</p>
          </div>
        )
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-background">{renderContent()}</div>
  )
}
