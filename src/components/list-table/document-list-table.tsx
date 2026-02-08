/**
 * DocumentListTable
 *
 * 单据列表适配组件。将 DocumentSchema + 服务端 API 适配为 ListTable。
 * 分页/筛选/排序均由服务端处理。
 */

import { useCallback, useMemo, useState } from "react"
import { registry } from "@/core/registry"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText } from "lucide-react"
import type { DocumentTypeId } from "@/core/types"
import type { FetchParams, FetchResult, ListTableColumn } from "./types"
import { ListTable } from "./list-table"
import { fetchDocumentListApi, createDocumentApi } from "@/lib/document-api"
import type { FlatDocumentRow, ListMode } from "@/lib/document-api"

interface DocumentListTableProps {
  typeId: DocumentTypeId
  onOpenDocument: (docId: string) => void
  /** 默认列表模式: document=单据模式(默认), detail=明细模式 */
  defaultMode?: ListMode
  /** 明细模式下需要指定展示哪个明细表 */
  detailTableId?: string
}

/** 单据状态配色 */
const statusLabels: Record<string, string> = {
  draft: "草稿",
  submitted: "已提交",
  approved: "已审批",
  closed: "已关闭",
  cancelled: "已取消",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "default",
  approved: "default",
  closed: "outline",
  cancelled: "destructive",
}

export function DocumentListTable({
  typeId,
  onOpenDocument,
  defaultMode = "document",
  detailTableId,
}: DocumentListTableProps) {
  const schema = registry.getSchema(typeId)
  
  // 内部管理模式状态
  const [mode, setMode] = useState<ListMode>(defaultMode)
  const isDetailMode = mode === "detail"

  // 构建列定义
  const columns = useMemo<ListTableColumn<FlatDocumentRow>[]>(() => {
    if (!schema) return []

    const cols: ListTableColumn<FlatDocumentRow>[] = [
      {
        id: "_docNumber",
        label: "单据编号",
        type: "text",
        width: 160,
        render: (value) => (
          <span className="font-medium">{String(value)}</span>
        ),
      },
      {
        id: "_status",
        label: "状态",
        type: "select",
        width: 100,
        options: [
          { label: "草稿", value: "draft" },
          { label: "已提交", value: "submitted" },
          { label: "已审批", value: "approved" },
          { label: "已关闭", value: "closed" },
          { label: "已取消", value: "cancelled" },
        ],
        render: (value) => {
          const status = String(value)
          return (
            <Badge variant={statusVariants[status] ?? "outline"}>
              {statusLabels[status] ?? status}
            </Badge>
          )
        },
      },
    ]

    // 从 schema.masterFields 中取前几个关键字段作为列表列
    // 过滤掉 textarea 和 computed 类型 (不适合列表显示)
    const listableFields = schema.masterFields.filter(
      (f) => f.type !== "textarea" && f.type !== "computed"
    )
    // 最多显示 6 个字段，避免列太多
    const displayFields = listableFields.slice(0, 6)

    for (const field of displayFields) {
      cols.push({
        id: field.id,
        label: field.label,
        type: field.type,
        options: field.options,
        minWidth: 80,
        // 超过 4 个字段的默认隐藏
        defaultHidden: displayFields.indexOf(field) >= 4,
      })
    }

    // 明细模式: 追加指定明细表的字段列
    if (isDetailMode && detailTableId) {
      const detailTableDef = schema.detailTables.find(
        (t) => t.id === detailTableId
      )
      if (detailTableDef) {
        const detailFields = detailTableDef.fields.filter(
          (f) => f.type !== "textarea" && f.type !== "computed"
        )
        for (const field of detailFields) {
          cols.push({
            id: field.id,
            label: field.label,
            type: field.type,
            options: field.options,
            minWidth: 80,
          })
        }
      }
    }

    // 追加固定列
    cols.push({
      id: "_createdAt",
      label: "创建时间",
      type: "date",
      width: 160,
      render: (value) => (
        <span className="text-muted-foreground text-sm">
          {value ? new Date(String(value)).toLocaleString("zh-CN") : "-"}
        </span>
      ),
    })

    cols.push({
      id: "_sourceTypeId",
      label: "来源",
      type: "text",
      width: 100,
      render: (value) => {
        if (!value) return "-"
        const sourceSchema = registry.getSchema(String(value))
        return (
          <Badge variant="outline" className="text-xs">
            {sourceSchema?.typeName ?? String(value)}
          </Badge>
        )
      },
    })

    return cols
  }, [schema, isDetailMode, detailTableId])

  // queryFn: 从服务端 API 获取数据 (分页/筛选/排序均由服务端处理)
  const queryFn = useCallback(
    async (params: FetchParams): Promise<FetchResult<FlatDocumentRow>> => {
      return fetchDocumentListApi(typeId, params, mode, detailTableId)
    },
    [typeId, mode, detailTableId]
  )

  // 新建单据 (调用服务端 API)
  const handleCreate = useCallback(async () => {
    const result = await createDocumentApi(typeId)
    onOpenDocument(result.id)
  }, [typeId, onOpenDocument])

  // 模式变更回调
  const handleModeChange = useCallback((newMode: ListMode) => {
    setMode(newMode)
  }, [])

  // 行点击
  const handleRowClick = useCallback(
    (row: FlatDocumentRow) => {
      onOpenDocument(row._id as string)
    },
    [onOpenDocument]
  )

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">未找到单据类型: {typeId}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-6">
      <ListTable<FlatDocumentRow>
        columns={columns}
        queryKey={["documents", typeId, mode, detailTableId ?? ""]}
        queryFn={queryFn}
        title={schema.typeName}
        titleIcon={<FileText className="h-5 w-5" />}
        toolbarActions={
          <Button variant="outline" size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            新建
          </Button>
        }
        onRowClick={handleRowClick}
        defaultPageSize={20}
        rowKey={(row) =>
          isDetailMode
            ? (row._detailRowId as string)
            : (row._id as string)
        }
        exportFilename={schema.typeName}
        enableStandardMode={schema.detailTables.length > 0}
        onStandardModeChange={handleModeChange}
        defaultStandardMode={mode}
      />
    </div>
  )
}

