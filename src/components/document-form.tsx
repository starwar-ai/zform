/**
 * DocumentForm
 *
 * 完整的单据表单组件。
 * 组合 MasterForm + DetailTable + TracePanel + ImpactDialog。
 */

import { useState, useRef, useEffect } from "react"
import type {
  DocumentData,
  ImpactAssessment,
} from "@/core/types"
import { useDocumentStore, getTraceableStore } from "@/stores/document-store"
import { useTraceability, usePushDown, useImpactAssessment } from "@/hooks/use-document"
import { registry } from "@/core/registry"
import { useTabStore } from "@/stores/tab-store"
import { MasterForm } from "./master-form"
import { DetailTable } from "./detail-table"
import { TracePanel } from "./trace-panel"
import { ImpactDialog } from "./impact-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Save, Send, ArrowDownToLine, FileText } from "lucide-react"

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
  const pendingSaveRef = useRef<DocumentData | null>(null)

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
    <div className="space-y-4">
      {/* 头部: 单据类型 + 编号 + 状态 + 操作 */}
      <div className="flex items-center justify-between">
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
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-4 gap-4">
        {/* 主内容区 */}
        <div className="col-span-3 space-y-4">
          <Tabs defaultValue="master">
            <TabsList>
              <TabsTrigger value="master">主信息</TabsTrigger>
              {schema.detailTables.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="master">
              <Card>
                <CardContent className="pt-6">
                  <MasterForm
                    fields={schema.masterFields}
                    data={doc.masterData}
                    onChange={(fieldId, value) =>
                      updateMasterField(docId, fieldId, value)
                    }
                    disabled={!isEditable}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {schema.detailTables.map((tableDef) => {
              const tableData = doc.detailTables.find(
                (t) => t.tableId === tableDef.id
              )
              return (
                <TabsContent key={tableDef.id} value={tableDef.id}>
                  <Card>
                    <CardContent className="pt-6">
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
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            })}
          </Tabs>
        </div>

        {/* 右侧追溯面板 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">关联单据</CardTitle>
            </CardHeader>
            <CardContent>
              <TracePanel
                upstream={upstream}
                downstream={downstream}
                onNavigate={(id) => onNavigate?.(id)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

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
