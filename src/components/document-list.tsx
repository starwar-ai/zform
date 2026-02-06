/**
 * DocumentList
 *
 * 单据列表组件。显示所有单据, 按类型分组。
 */

import { registry } from "@/core/registry"
import { useAllDocuments } from "@/hooks/use-document"
import { useDocumentStore } from "@/stores/document-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, FileText, ArrowRight } from "lucide-react"
import type { DocumentTypeId } from "@/core/types"

interface DocumentListProps {
  onOpenDocument: (docId: string) => void
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

export function DocumentList({ onOpenDocument }: DocumentListProps) {
  const documents = useAllDocuments()
  const createDocument = useDocumentStore((s) => s.createDocument)
  const schemas = registry.getAllSchemas()

  const handleCreate = (typeId: DocumentTypeId) => {
    const doc = createDocument(typeId)
    onOpenDocument(doc.id)
  }

  // 按类型分组
  const grouped = new Map<DocumentTypeId, typeof documents>()
  for (const doc of documents) {
    const list = grouped.get(doc.typeId) ?? []
    list.push(doc)
    grouped.set(doc.typeId, list)
  }

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">单据管理</h1>
        <div className="flex items-center gap-2">
          {schemas.map((schema) => (
            <Button
              key={schema.typeId}
              variant="outline"
              size="sm"
              onClick={() => handleCreate(schema.typeId)}
            >
              <Plus className="h-4 w-4 mr-1" />
              新建{schema.typeName}
            </Button>
          ))}
        </div>
      </div>

      {/* 流程概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">业务流程</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {schemas.map((schema, index) => (
              <div key={schema.typeId} className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1">
                  {schema.typeName}
                </Badge>
                {index < schemas.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 单据列表 */}
      {schemas.map((schema) => {
        const docs = grouped.get(schema.typeId) ?? []
        return (
          <Card key={schema.typeId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {schema.typeName}
                  <Badge variant="secondary" className="text-xs">
                    {docs.length}
                  </Badge>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCreate(schema.typeId)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  新建
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {docs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>单据编号</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>来源</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.docNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusColors[doc.status] ?? "outline"}
                          >
                            {statusLabels[doc.status] ?? doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(doc.createdAt).toLocaleString("zh-CN")}
                        </TableCell>
                        <TableCell>
                          {doc.sourceRef ? (
                            <Badge variant="outline" className="text-xs">
                              来源: {doc.sourceRef.sourceTypeId}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenDocument(doc.id)}
                          >
                            打开
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无 {schema.typeName}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
