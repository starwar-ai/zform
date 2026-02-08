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
import { registry } from "@/core/registry"
import { createDocumentApi, updateDocumentApi } from "@/lib/document-api"
import { MasterForm } from "./master-form"
import { DetailTable } from "./detail-table"
import { TracePanel } from "./trace-panel"
import { ImpactDialog } from "./impact-dialog"
import { UnsavedChangesDialog } from "./unsaved-changes-dialog"
import { ApprovalHistory } from "./approval-history"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ResizablePanelGroup,
  ResizablePanel,
  usePanelRef,
} from "@/components/ui/resizable"
import { Save, Send, ArrowDownToLine, FileText, PanelRightClose, PanelRightOpen } from "lucide-react"

interface DocumentFormProps {
  docId: string
  onNavigate?: (docId: string) => void
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

export function DocumentForm({ docId, onNavigate }: DocumentFormProps) {
  const doc = useDocumentStore((s) => s.documents[docId])
  const {
    updateMasterField,
    addDetailRow,
    updateDetailRow,
    deleteDetailRow,
    saveDocument,
    updateStatus,
  } = useDocumentStore()
  const { activeTabId, updateTabTitle, registerBeforeCloseHook, unregisterBeforeCloseHook } = useTabStore()

  const { upstream, downstream } = useTraceability(docId)
  const { getAvailableRules, executePushDown } = usePushDown()
  const { evaluate } = useImpactAssessment()

  const [impactOpen, setImpactOpen] = useState(false)
  const [assessment, setAssessment] = useState<ImpactAssessment | null>(null)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false)
  const pendingSaveRef = useRef<DocumentData | null>(null)
  const pendingCloseResolveRef = useRef<((value: boolean) => void) | null>(null)
  const sidePanelRef = usePanelRef()
  
  // 保存初始数据快照用于变更检测
  const initialDocSnapshot = useRef<string | null>(null)

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
  const pushDownRules = getAvailableRules(doc.typeId)

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

  useEffect(() => {
    if (!activeTabId) return
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
    isNew,
    schema.typeName,
    doc.masterData?.code,
    doc.docNumber,
    doc.id,
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
    const rule = pushDownRules[ruleIndex]
    if (!rule) return
    const newDoc = executePushDown(doc, rule)
    onNavigate?.(newDoc.id)
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
          {isEditable && (
            <>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? "保存中..." : "保存"}
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={saving}>
                <Send className="h-4 w-4 mr-1" />
                {saving ? "提交中..." : "提交"}
              </Button>
            </>
          )}
          {pushDownRules.map((rule, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handlePushDown(index)}
            >
              <ArrowDownToLine className="h-4 w-4 mr-1" />
              {rule.name}
            </Button>
          ))}
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
                <Tabs defaultValue="master">
                  <TabsList>
                    <TabsTrigger value="master">主信息</TabsTrigger>
                    {schema.detailTables.map((t) => (
                      <TabsTrigger key={t.id} value={t.id}>
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="master" className="mt-4">
                    <MasterForm
                      fields={schema.masterFields}
                      data={doc.masterData}
                      onChange={(fieldId, value) =>
                        updateMasterField(docId, fieldId, value)
                      }
                      disabled={!isEditable}
                    />
                  </TabsContent>

                  {schema.detailTables.map((tableDef) => {
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
                </Tabs>
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
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="trace">关联单据</TabsTrigger>
                    <TabsTrigger value="approval">审核记录</TabsTrigger>
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
                  <div className="p-3 pt-1">
                    <ApprovalHistory
                      docType={doc.typeId}
                      docId={docId}
                      embedded
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
