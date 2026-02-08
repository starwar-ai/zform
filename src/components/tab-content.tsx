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
