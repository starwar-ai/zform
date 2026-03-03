/**
 * ProductManagement
 *
 * 产品管理组件，包含标准产品、客户产品、自营产品三个 Tab。
 * 每个 Tab 复用 DocumentListTable 渲染各自的列表。
 */

import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentListTable } from "@/components/list-table"
import { useTabStore } from "@/stores/tab-store"
import { executeDocumentAction } from "@/apis/document-api"
import type { FlatDocumentRow } from "@/apis/document-api"

type ProductTab = "standard_product" | "customer_product" | "self_owned_product"

export function ProductManagement() {
  const [activeTab, setActiveTab] = useState<ProductTab>("standard_product")
  const openTab = useTabStore((s) => s.openTab)
  const queryClient = useQueryClient()

  const handleOpenDocument = (docId: string, typeId?: string) => {
    openTab("document-form", { docId, typeId }, `单据 ${docId}`)
  }

  /** 刷新当前 Tab 的列表 */
  const refreshList = useCallback((typeId: string) => {
    queryClient.invalidateQueries({ queryKey: ["documents", typeId] })
  }, [queryClient])

  /** 处理列表行快捷操作 */
  const handleAction = useCallback(async (actionId: string, row: FlatDocumentRow) => {
    const id = String(row.id)
    const typeId = activeTab

    try {
      switch (actionId) {
        case "submit": {
          if (!confirm("确认提交审核？")) return
          await executeDocumentAction(typeId, id, "submit")
          refreshList(typeId)
          break
        }
        case "withdraw": {
          if (!confirm("确认撤回？")) return
          await executeDocumentAction(typeId, id, "withdraw")
          refreshList(typeId)
          break
        }
        case "approve": {
          if (!confirm("确认审批通过？")) return
          await executeDocumentAction(typeId, id, "approve", {})
          refreshList(typeId)
          break
        }
        case "reject": {
          const reason = prompt("请输入拒绝原因：")
          if (reason === null) return
          await executeDocumentAction(typeId, id, "reject", { reason })
          refreshList(typeId)
          break
        }
        case "revert-audit": {
          if (!confirm("确认反审核？产品将恢复为草稿状态。")) return
          await executeDocumentAction(typeId, id, "revertAudit")
          refreshList(typeId)
          break
        }
        default:
          console.warn(`[ProductManagement] 未处理的操作: "${actionId}"`)
      }
    } catch (err) {
      alert(`操作失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [activeTab, refreshList])

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
        <DocumentListTable typeId="standard_product" onOpenDocument={handleOpenDocument} onAction={handleAction} />
      )}
      {activeTab === "customer_product" && (
        <DocumentListTable typeId="customer_product" onOpenDocument={handleOpenDocument} onAction={handleAction} />
      )}
      {activeTab === "self_owned_product" && (
        <DocumentListTable typeId="self_owned_product" onOpenDocument={handleOpenDocument} onAction={handleAction} />
      )}
    </div>
  )
}
