/**
 * DocumentForm
 *
 * 完整的单据表单组件。
 * 组合 MasterForm + DetailTable + TracePanel + ImpactDialog。
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import type {
  DocumentData,
  ImpactAssessment,
} from "@/core/types"
import { useDocumentStore, getTraceableStore } from "@/stores/document-store"
import { useTabStore } from "@/stores/tab-store"
import { useTraceability, usePushDown, useImpactAssessment } from "@/hooks/use-document"
import { useApproval } from "@/hooks/use-approval"
import { useDocumentFormActions } from "@/hooks/use-document-form-actions"
import { registry } from "@/core/registry"
import { createDocumentApi, updateDocumentApi, fetchDocumentApi } from "@/apis/document-api"
import { MasterForm } from "./master-form"
import { DetailTable } from "./detail-table"
import { ProductImageUpload } from "./product-image-upload"
import { TracePanel } from "./trace-panel"
import { ImpactDialog } from "./impact-dialog"
import { UnsavedChangesDialog } from "./unsaved-changes-dialog"
import { ApprovalHistory } from "./approval-history"
import { ApprovalFlowVisualizer } from "./approval-flow-visualizer"
import { DocumentPermissionPanel } from "./document-permission-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ResizablePanelGroup,
  ResizablePanel,
  usePanelRef,
} from "@/components/ui/resizable"
import {
  Save, Send, ArrowDownToLine, FileText, PanelRightClose, PanelRightOpen,
  Check, X, Undo2, Lock, Ban, Trash2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

/** 图标名称 → 组件映射 */
const iconMap: Record<string, LucideIcon> = {
  Save, Send, ArrowDownToLine, Check, X, Undo2, Lock, Ban, Trash2,
}

/** 根据图标名称渲染图标 */
function ActionIcon({ name }: { name?: string }) {
  if (!name) return null
  const Icon = iconMap[name]
  if (!Icon) return null
  return <Icon className="h-4 w-4 mr-1" />
}

interface DocumentFormProps {
  docId: string
  typeId?: string
  onNavigate?: (docId: string, typeId?: string) => void
}

const statusLabels: Record<string, string> = {
  draft: "草稿",
  submitted: "已提交",
  approved: "已审批",
  closed: "已关闭",
  cancelled: "已取消",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "default",
  approved: "default",
  closed: "outline",
  cancelled: "destructive",
}

export function DocumentForm({ docId, typeId, onNavigate }: DocumentFormProps) {
  const doc = useDocumentStore((s) => s.documents[docId])
  const {
    updateMasterField,
    addDetailRow,
    updateDetailRow,
    deleteDetailRow,
    saveDocument,
    updateStatus,
    addDocument,
  } = useDocumentStore()
  const { activeTabId, updateTabTitle, registerBeforeCloseHook, unregisterBeforeCloseHook } = useTabStore()

  const { upstream, downstream } = useTraceability(docId)
  const { getAvailableRules, executePushDown } = usePushDown()
  const { evaluate } = useImpactAssessment()
  const approval = useApproval(doc?.typeId ?? "", docId)
  const { visibleActions, isDisabled: isActionDisabled } = useDocumentFormActions(doc)

  const [impactOpen, setImpactOpen] = useState(false)
  const [assessment, setAssessment] = useState<ImpactAssessment | null>(null)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingSaveRef = useRef<DocumentData | null>(null)
  const pendingCloseResolveRef = useRef<((value: boolean) => void) | null>(null)
  const sidePanelRef = usePanelRef()
  
  // 保存初始数据快照用于变更检测
  const initialDocSnapshot = useRef<string | null>(null)

  // 数据加载逻辑：如果 store 中没有数据且提供了 typeId，从服务端加载
  useEffect(() => {
    if (!doc && typeId && !loading && !error) {
      setLoading(true)
      setError(null)
      fetchDocumentApi(typeId, docId)
        .then((data) => {
          addDocument(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error('加载单据失败:', err)
          setError(err.message || '加载单据失败')
          setLoading(false)
        })
    }
  }, [docId, typeId, doc, loading, error, addDocument])

  const togglePanel = useCallback(() => {
    const panel = sidePanelRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      panel.expand()
    } else {
      panel.collapse()
    }
  }, [])

  // 检测是否有变更
  const hasChanges = useMemo(() => {
    if (!doc || !initialDocSnapshot.current) return false
    
    // 将当前数据序列化后与初始快照比较
    const currentSnapshot = JSON.stringify({
      masterData: doc.masterData,
      detailTables: doc.detailTables,
      status: doc.status,
    })
    
    return currentSnapshot !== initialDocSnapshot.current
  }, [doc])

  // 初始化快照
  useEffect(() => {
    if (doc && !initialDocSnapshot.current) {
      initialDocSnapshot.current = JSON.stringify({
        masterData: doc.masterData,
        detailTables: doc.detailTables,
        status: doc.status,
      })
    }
  }, [doc])

  // resolveDocCode 必须在所有条件返回之前定义（Hooks 规则）
  const resolveDocCode = useCallback((value: unknown) => {
    if (typeof value === "string") {
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : ""
    }
    if (typeof value === "number") {
      return String(value)
    }
    return ""
  }, [])

  // 更新 tab title 的 useEffect 必须在所有条件返回之前（Hooks 规则）
  useEffect(() => {
    if (!activeTabId || !doc) return
    const schema = registry.getSchema(doc.typeId)
    if (!schema) return
    
    const isNew = Boolean(doc._isNew)
    const candidateCode = resolveDocCode(
      (doc.masterData as Record<string, unknown> | undefined)?.code 
    )
    const finalCode = candidateCode || doc.id
    const nextTitle = isNew
      ? `${schema.typeName}-新建`
      : `${schema.typeName}-${finalCode}`
    updateTabTitle(activeTabId, nextTitle)
  }, [
    activeTabId,
    updateTabTitle,
    resolveDocCode,
    doc,
  ])

  /** 持久化到服务端: 新建文档调用 create, 已有文档调用 update */
  const persistToServer = useCallback(
    async (docData: DocumentData) => {
      setSaving(true)
      try {
        if (docData._isNew) {
          // 新建文档 → 调用 create API
          const { _isNew, ...payload } = docData
          await createDocumentApi(docData.typeId, payload)
          // 持久化成功后清除 _isNew 标记
          saveDocument({ ...docData, _isNew: undefined })
          // 更新快照
          initialDocSnapshot.current = JSON.stringify({
            masterData: { ...docData.masterData },
            detailTables: docData.detailTables,
            status: "draft",
          })
        } else {
          // 已有文档 → 调用 update API
          const { _isNew, ...payload } = docData
          await updateDocumentApi(docData.typeId, docData.id, payload)
          saveDocument(docData)
          // 更新快照
          initialDocSnapshot.current = JSON.stringify({
            masterData: docData.masterData,
            detailTables: docData.detailTables,
            status: docData.status,
          })
        }
      } catch (err) {
        console.error("保存失败:", err)
        alert(`保存失败: ${err instanceof Error ? err.message : String(err)}`)
        throw err // 重新抛出错误以便调用方处理
      } finally {
        setSaving(false)
      }
    },
    [saveDocument]
  )

  // 处理未保存变更对话框的操作
  const handleUnsavedSave = useCallback(async () => {
    if (!doc) return
    try {
      // 保存文档
      await persistToServer(doc)
      setUnsavedDialogOpen(false)
      // 允许关闭
      pendingCloseResolveRef.current?.(true)
      pendingCloseResolveRef.current = null
    } catch (err) {
      // 保存失败，不关闭标签
      pendingCloseResolveRef.current?.(false)
      pendingCloseResolveRef.current = null
    }
  }, [doc, persistToServer])

  const handleUnsavedDiscard = useCallback(() => {
    setUnsavedDialogOpen(false)
    // 允许关闭但不保存
    pendingCloseResolveRef.current?.(true)
    pendingCloseResolveRef.current = null
  }, [])

  const handleUnsavedCancel = useCallback(() => {
    setUnsavedDialogOpen(false)
    // 阻止关闭
    pendingCloseResolveRef.current?.(false)
    pendingCloseResolveRef.current = null
  }, [])

  // 注册关闭前钩子
  useEffect(() => {
    if (!activeTabId) return

    const beforeCloseHook = async (): Promise<boolean> => {
      // 如果没有变更，允许直接关闭
      if (!hasChanges) return true

      // 有变更，显示确认对话框
      return new Promise((resolve) => {
        pendingCloseResolveRef.current = resolve
        setUnsavedDialogOpen(true)
      })
    }

    registerBeforeCloseHook(activeTabId, beforeCloseHook)

    return () => {
      unregisterBeforeCloseHook(activeTabId)
    }
  }, [activeTabId, hasChanges, registerBeforeCloseHook, unregisterBeforeCloseHook])

  // 加载中状态
  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        加载中...
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        加载失败: {error}
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        单据不存在
      </div>
    )
  }

  const schema = registry.getSchema(doc.typeId)
  if (!schema) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        未找到单据类型定义: {doc.typeId}
      </div>
    )
  }

  const isEditable = doc.status === "draft"
  const isNew = Boolean(doc._isNew)

  // 判断是否为产品类型 (需要显示图片 tab)
  const isProductType = ["standard_product", "customer_product", "self_owned_product"].includes(doc.typeId)

  const handleSave = () => {
    // 构建新文档用于影响评估
    const store = getTraceableStore()
    const oldDoc = store.getDocument(docId)
    if (!oldDoc) return

    // 检查是否有下游单据
    const downstreamDocs = store.getDocumentsBySourceDoc(docId)
    if (downstreamDocs.length > 0) {
      const result = evaluate(oldDoc, doc)
      if (result.impacts.length > 0) {
        setAssessment(result)
        pendingSaveRef.current = doc
        setImpactOpen(true)
        return
      }
    }

    persistToServer(doc)
  }

  const handleImpactConfirm = () => {
    if (pendingSaveRef.current) {
      persistToServer(pendingSaveRef.current)
    }
    setImpactOpen(false)
    pendingSaveRef.current = null
  }

  const handleImpactCancel = () => {
    setImpactOpen(false)
    pendingSaveRef.current = null
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (doc._isNew) {
        // 新建文档提交: 先创建再更新状态
        const { _isNew, ...payload } = doc
        await createDocumentApi(doc.typeId, { ...payload, status: "submitted" })
        saveDocument({ ...doc, _isNew: undefined, status: "submitted" })
      } else {
        // 已有文档提交: 更新状态
        await updateDocumentApi(doc.typeId, doc.id, { ...doc, status: "submitted" })
        updateStatus(docId, "submitted")
      }
    } catch (err) {
      console.error("提交失败:", err)
      alert(`提交失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  const handlePushDown = (ruleIndex: number) => {
    const rules = getAvailableRules(doc.typeId)
    const rule = rules[ruleIndex]
    if (!rule) return
    const newDoc = executePushDown(doc, rule)
    onNavigate?.(newDoc.id, newDoc.typeId)
  }

  /** 审批通过 */
  const handleApprove = async () => {
    setSaving(true)
    try {
      const result = await approval.approve()
      if (result?.success) {
        updateStatus(docId, "approved")
        approval.refresh()
      } else {
        alert(`审批失败: ${result?.message ?? "未知错误"}`)
      }
    } catch (err) {
      console.error("审批失败:", err)
      alert(`审批失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  /** 拒绝 */
  const handleReject = async () => {
    setSaving(true)
    try {
      const result = await approval.reject()
      if (result?.success) {
        updateStatus(docId, "draft")
        approval.refresh()
      } else {
        alert(`拒绝失败: ${result?.message ?? "未知错误"}`)
      }
    } catch (err) {
      console.error("拒绝失败:", err)
      alert(`拒绝失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  /** 撤回 */
  const handleWithdraw = async () => {
    setSaving(true)
    try {
      const result = await approval.withdraw()
      if (result?.success) {
        updateStatus(docId, "draft")
        approval.refresh()
      } else {
        alert(`撤回失败: ${result?.message ?? "未知错误"}`)
      }
    } catch (err) {
      console.error("撤回失败:", err)
      alert(`撤回失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  /** 关闭单据 */
  const handleClose = async () => {
    setSaving(true)
    try {
      await updateDocumentApi(doc.typeId, doc.id, { ...doc, status: "closed" })
      updateStatus(docId, "closed")
    } catch (err) {
      console.error("关闭失败:", err)
      alert(`关闭失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  /** 取消单据 (草稿 → 已取消) */
  const handleCancel = async () => {
    setSaving(true)
    try {
      await updateDocumentApi(doc.typeId, doc.id, { ...doc, status: "cancelled" })
      updateStatus(docId, "cancelled")
    } catch (err) {
      console.error("取消失败:", err)
      alert(`取消失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  /** 作废单据 (已审批 → 已取消) */
  const handleVoid = async () => {
    setSaving(true)
    try {
      await updateDocumentApi(doc.typeId, doc.id, { ...doc, status: "cancelled" })
      updateStatus(docId, "cancelled")
    } catch (err) {
      console.error("作废失败:", err)
      alert(`作废失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  /** 统一操作分发 */
  const handleAction = (actionId: string) => {
    // push-down:N 格式解析
    if (actionId.startsWith("push-down:")) {
      const ruleIndex = parseInt(actionId.split(":")[1], 10)
      handlePushDown(ruleIndex)
      return
    }
    switch (actionId) {
      case "save":
        handleSave()
        break
      case "submit":
        handleSubmit()
        break
      case "approve":
        handleApprove()
        break
      case "reject":
        handleReject()
        break
      case "withdraw":
        handleWithdraw()
        break
      case "close":
        handleClose()
        break
      case "cancel":
        handleCancel()
        break
      case "void":
        handleVoid()
        break
      default:
        console.warn(`[DocumentForm] 未处理的操作: "${actionId}"`)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部: 单据类型 + 编号 + 状态 + 操作 */}
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg ">{schema.typeName}</h2>
          </div>
          <Badge variant={statusColors[doc.status] ?? "outline"}>
            {statusLabels[doc.status] ?? doc.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* 根据状态 + 权限动态渲染操作按钮 */}
          {visibleActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant ?? "outline"}
              size="sm"
              disabled={isActionDisabled(action.id) || saving}
              onClick={() => handleAction(action.id)}
            >
              <ActionIcon name={action.icon} />
              {saving && (action.id === "save" || action.id === "submit")
                ? `${action.label}中...`
                : action.label}
            </Button>
          ))}
          {/* 面板折叠/展开按钮 */}
          {!isNew && (
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePanel}
              title={isPanelCollapsed ? "展开详情面板" : "隐藏详情面板"}
              className="ml-2"
            >
              {isPanelCollapsed ? (
                <PanelRightOpen className="h-4 w-4" />
              ) : (
                <PanelRightClose className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 可拖拽面板布局 */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1 mt-4">
        {/* 左侧主内容区 */}
        <ResizablePanel defaultSize={isNew ? 100 : 75} minSize={50}>
          <div className="h-full pr-2 overflow-auto">
            <Card>
              <CardContent className="pt-4">
                {(() => {
                  const visibleDetailTables = schema.detailTables.filter(
                    (t) => !t.visibleWhen || t.visibleWhen(doc.masterData)
                  )
                  return (
                <Tabs defaultValue="master">
                    <TabsList>
                    <TabsTrigger value="master">主信息</TabsTrigger>
                    {visibleDetailTables.map((t) => (
                        <TabsTrigger key={t.id} value={t.id}>
                          {t.label}
                        </TabsTrigger>
                      ))}
                    {isProductType && (
                      <TabsTrigger value="product_images">产品图片</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="master" className="mt-4">
                    <MasterForm
                      fields={schema.masterFields}
                      data={doc.masterData}
                      onChange={(fieldId, value) =>
                        updateMasterField(docId, fieldId, value)
                      }
                      disabled={!isEditable}
                      mode={
                        isNew
                          ? (doc.sourceRef ? "copy" : "create")
                          : "edit"
                      }
                    />
                  </TabsContent>

                  {visibleDetailTables.map((tableDef) => {
                    const tableData = doc.detailTables.find(
                      (t) => t.tableId === tableDef.id
                    )
                    return (
                      <TabsContent key={tableDef.id} value={tableDef.id} className="mt-4">
                        <DetailTable
                          tableDef={tableDef}
                          rows={tableData?.rows ?? []}
                          onAddRow={() => addDetailRow(docId, tableDef.id)}
                          onDeleteRow={(rowId) =>
                            deleteDetailRow(docId, tableDef.id, rowId)
                          }
                          onUpdateCell={(rowId, fieldId, value) =>
                            updateDetailRow(
                              docId,
                              tableDef.id,
                              rowId,
                              fieldId,
                              value
                            )
                          }
                          disabled={!isEditable}
                        />
                      </TabsContent>
                    )
                  })}

                  {/* 产品图片 Tab */}
                  {isProductType && (
                    <TabsContent value="product_images" className="mt-4">
                      <ProductImageUpload
                        productId={isNew ? null : docId}
                        disabled={!isEditable}
                      />
                    </TabsContent>
                  )}
                </Tabs>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>

        {/* 右侧可折叠面板 */}
        {!isNew && (
          <ResizablePanel
            panelRef={sidePanelRef}
            defaultSize={25}
            minSize={15}
            collapsible
            collapsedSize={0}
            onResize={(size) => {
              setIsPanelCollapsed(size.asPercentage === 0)
            }}
          >
            <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
              {/* 面板标题栏 */}
              <div className="flex items-center px-3 py-2 border-b">
                <span className="text-sm font-semibold">详情</span>
              </div>
              <Tabs defaultValue="trace" className="flex flex-col">
                <div className="px-3 pt-2">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="trace">关联单据</TabsTrigger>
                    <TabsTrigger value="approval">审核记录</TabsTrigger>
                    <TabsTrigger value="permissions">权限</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="trace" className="mt-2">
                  <div className="p-3 pt-1">
                    <TracePanel
                      upstream={upstream}
                      downstream={downstream}
                      onNavigate={(id) => onNavigate?.(id)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="approval" className="mt-2">
                  <div className="p-3 pt-1 space-y-3">
                    {approval.latestInstance && (
                      <div className="h-[200px] border rounded-md">
                        <ApprovalFlowVisualizer
                          levels={approval.latestInstance.rule.levels}
                          instance={approval.latestInstance}
                          records={approval.latestInstance.records}
                          compact
                        />
                      </div>
                    )}
                    <ApprovalHistory
                      docType={doc.typeId}
                      docId={docId}
                      embedded
                    />
                  </div>
                </TabsContent>

                <TabsContent value="permissions" className="mt-2">
                  <div className="p-3 pt-1">
                    <DocumentPermissionPanel
                      docType={doc.typeId}
                      docId={docId}
                      createdBy={doc.createdBy}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>

      {/* 影响评估对话框 */}
      <ImpactDialog
        open={impactOpen}
        onOpenChange={setImpactOpen}
        assessment={assessment}
        onConfirm={handleImpactConfirm}
        onCancel={handleImpactCancel}
      />

      {/* 未保存变更确认对话框 */}
      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        onOpenChange={setUnsavedDialogOpen}
        onSave={handleUnsavedSave}
        onDiscard={handleUnsavedDiscard}
        onCancel={handleUnsavedCancel}
      />
    </div>
  )
}
