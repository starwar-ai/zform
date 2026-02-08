/**
 * DocumentForm
 *
 * 完整的单据表单组件。
 * 组合 MasterForm + DetailTable + TracePanel + ImpactDialog。
 */

import { useState, useRef, useCallback } from "react"
import type {
  DocumentData,
  ImpactAssessment,
} from "@/core/types"
import { useDocumentStore, getTraceableStore } from "@/stores/document-store"
import { useTraceability, usePushDown, useImpactAssessment } from "@/hooks/use-document"
import { registry } from "@/core/registry"
import { MasterForm } from "./master-form"
import { DetailTable } from "./detail-table"
import { TracePanel } from "./trace-panel"
import { ImpactDialog } from "./impact-dialog"
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

  const { upstream, downstream } = useTraceability(docId)
  const { getAvailableRules, executePushDown } = usePushDown()
  const { evaluate } = useImpactAssessment()

  const [impactOpen, setImpactOpen] = useState(false)
  const [assessment, setAssessment] = useState<ImpactAssessment | null>(null)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const pendingSaveRef = useRef<DocumentData | null>(null)
  const sidePanelRef = usePanelRef()

  const togglePanel = useCallback(() => {
    const panel = sidePanelRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      panel.expand()
    } else {
      panel.collapse()
    }
  }, [])

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
  const pushDownRules = getAvailableRules(doc.typeId)

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

    saveDocument(doc)
  }

  const handleImpactConfirm = () => {
    if (pendingSaveRef.current) {
      saveDocument(pendingSaveRef.current)
    }
    setImpactOpen(false)
    pendingSaveRef.current = null
  }

  const handleImpactCancel = () => {
    setImpactOpen(false)
    pendingSaveRef.current = null
  }

  const handleSubmit = () => {
    updateStatus(docId, "submitted")
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
      <div className="flex items-center justify-between px-1 pb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">{schema.typeName}</h2>
            <p className="text-sm text-muted-foreground">{doc.docNumber}</p>
          </div>
          <Badge variant={statusColors[doc.status] ?? "outline"}>
            {statusLabels[doc.status] ?? doc.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isEditable && (
            <>
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                保存
              </Button>
              <Button size="sm" onClick={handleSubmit}>
                <Send className="h-4 w-4 mr-1" />
                提交
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
        </div>
      </div>

      {/* 可拖拽面板布局 */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1 mt-4">
        {/* 左侧主内容区 */}
        <ResizablePanel defaultSize={75} minSize={50}>
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
      </ResizablePanelGroup>

      {/* 影响评估对话框 */}
      <ImpactDialog
        open={impactOpen}
        onOpenChange={setImpactOpen}
        assessment={assessment}
        onConfirm={handleImpactConfirm}
        onCancel={handleImpactCancel}
      />
    </div>
  )
}
