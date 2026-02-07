/**
 * TypeFilteredList
 *
 * 按类型筛选的单据列表组件。显示指定类型的所有单据。
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
import { Plus, FileText } from "lucide-react"
import type { DocumentTypeId } from "@/core/types"

interface TypeFilteredListProps {
  typeId: DocumentTypeId
  onOpenDocument: (docId: string) => void
}

const statusLabels: Record<string, string> = {
  draft: "草稿",
  submitted: "已提交",
  approved: "已审批",
  closed: "已关闭",
  cancelled: "已取消",
}

const statusColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  submitted: "default",
  approved: "default",
  closed: "outline",
  cancelled: "destructive",
}

export function TypeFilteredList({
  typeId,
  onOpenDocument,
}: TypeFilteredListProps) {
  const documents = useAllDocuments()
  const createDocument = useDocumentStore((s) => s.createDocument)
  const schema = registry.getSchema(typeId)

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">未找到单据类型: {typeId}</p>
      </div>
    )
  }

  const handleCreate = () => {
    const doc = createDocument(typeId)
    onOpenDocument(doc.id)
  }

  // 筛选指定类型的单据
  const filteredDocs = documents.filter((doc) => doc.typeId === typeId)

  return (
    <div className="space-y-6 p-6">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {schema.typeName}
        </h1>
        <Button variant="outline" size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          新建{schema.typeName}
        </Button>
      </div>

      {/* 单据列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              单据列表
              <Badge variant="secondary" className="text-xs">
                {filteredDocs.length}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocs.length > 0 ? (
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
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {doc.docNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[doc.status] ?? "outline"}>
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
    </div>
  )
}
