/**
 * TabContent
 *
 * 标签内容渲染器。根据激活标签的类型动态渲染对应组件。
 */

import { useTabStore } from "@/stores/tab-store"
import { DocumentList } from "@/components/document-list"
import { DocumentForm } from "@/components/document-form"
import { TypeFilteredList } from "@/components/type-filtered-list"
import { UserManagement } from "@/components/user-management"
import { RoleManagement } from "@/components/role-management"
import { MenuManagement } from "@/components/menu-management"

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
  const handleOpenDocument = (docId: string) => {
    openTab("document-form", { docId }, `单据 ${docId}`)
  }

  // 根据标签类型渲染内容
  const renderContent = () => {
    switch (activeTab.type) {
      case "document-list":
        return (
          <div className="p-6">
            <DocumentList onOpenDocument={handleOpenDocument} />
          </div>
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
          <TypeFilteredList
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
