/**
 * DocumentListTable
 *
 * 单据列表适配组件。将 DocumentSchema + Zustand Store 适配为 ListTable。
 * 模拟服务端分页/筛选/排序 (实际从 Zustand 内存数据中查询)。
 */

import { useCallback, useMemo } from "react"
import { registry } from "@/core/registry"
import { useDocumentStore } from "@/stores/document-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText } from "lucide-react"
import type { DocumentTypeId, DocumentData } from "@/core/types"
import type { FetchParams, FetchResult, ListTableColumn, ColumnFilter, FilterOperator } from "./types"
import { ListTable } from "./list-table"

interface DocumentListTableProps {
  typeId: DocumentTypeId
  onOpenDocument: (docId: string) => void
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

/** 扁平化的单据行数据 (masterData 字段展开到顶层) */
type FlatDocumentRow = Record<string, unknown> & {
  _id: string
  _docNumber: string
  _status: string
  _createdAt: string
  _sourceTypeId?: string
}

export function DocumentListTable({
  typeId,
  onOpenDocument,
}: DocumentListTableProps) {
  const schema = registry.getSchema(typeId)
  const createDocument = useDocumentStore((s) => s.createDocument)

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
  }, [schema])

  // 扁平化单据数据
  const flattenDoc = useCallback((doc: DocumentData): FlatDocumentRow => {
    return {
      _id: doc.id,
      _docNumber: doc.docNumber,
      _status: doc.status,
      _createdAt: doc.createdAt,
      _sourceTypeId: doc.sourceRef?.sourceTypeId,
      ...doc.masterData,
    }
  }, [])

  // queryFn: 从 Zustand store 中读取并模拟服务端查询
  const queryFn = useCallback(
    async (params: FetchParams): Promise<FetchResult<FlatDocumentRow>> => {
      // 从 store 获取数据 (直接读 getState 而非 hook)
      const allDocs = Object.values(useDocumentStore.getState().documents)
      let filtered = allDocs.filter((doc) => doc.typeId === typeId)

      // 扁平化
      let rows = filtered.map(flattenDoc)

      // 应用筛选
      if (params.filters.length > 0) {
        rows = rows.filter((row) =>
          params.filters.every((filter) => matchFilter(row, filter))
        )
      }

      // 应用排序
      if (params.sorting.length > 0) {
        rows.sort((a, b) => {
          for (const sort of params.sorting) {
            const aVal = a[sort.id]
            const bVal = b[sort.id]
            const cmp = compareValues(aVal, bVal)
            if (cmp !== 0) return sort.desc ? -cmp : cmp
          }
          return 0
        })
      } else {
        // 默认按创建时间倒序
        rows.sort((a, b) =>
          String(b._createdAt).localeCompare(String(a._createdAt))
        )
      }

      const total = rows.length

      // 应用分页
      const { pageIndex, pageSize } = params.pagination
      const paged = rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

      return { data: paged, total }
    },
    [typeId, flattenDoc]
  )

  // 新建单据
  const handleCreate = useCallback(() => {
    const doc = createDocument(typeId)
    onOpenDocument(doc.id)
  }, [createDocument, typeId, onOpenDocument])

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
    <div className="space-y-6 p-6">
      <ListTable<FlatDocumentRow>
        columns={columns}
        queryKey={["documents", typeId]}
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
        rowKey={(row) => row._id as string}
        exportFilename={schema.typeName}
      />
    </div>
  )
}

// ============================================================
// 内存筛选工具函数
// ============================================================

/** 在内存中匹配单个筛选条件 */
function matchFilter(row: Record<string, unknown>, filter: ColumnFilter): boolean {
  const value = row[filter.columnId]
  const filterVal = filter.value

  return applyOperator(filter.operator, value, filterVal, filter.secondValue)
}

/** 应用操作符进行比较 */
function applyOperator(
  operator: FilterOperator,
  cellValue: unknown,
  filterValue: unknown,
  secondValue?: unknown
): boolean {
  const strCell = cellValue != null ? String(cellValue).toLowerCase() : ""
  const strFilter = filterValue != null ? String(filterValue).toLowerCase() : ""

  switch (operator) {
    case "eq":
      return strCell === strFilter
    case "neq":
      return strCell !== strFilter
    case "contains":
      return strCell.includes(strFilter)
    case "startsWith":
      return strCell.startsWith(strFilter)
    case "endsWith":
      return strCell.endsWith(strFilter)
    case "gt":
      return Number(cellValue) > Number(filterValue)
    case "gte":
      return Number(cellValue) >= Number(filterValue)
    case "lt":
      return Number(cellValue) < Number(filterValue)
    case "lte":
      return Number(cellValue) <= Number(filterValue)
    case "between":
      return (
        Number(cellValue) >= Number(filterValue) &&
        Number(cellValue) <= Number(secondValue)
      )
    case "before":
      return String(cellValue) < String(filterValue)
    case "after":
      return String(cellValue) > String(filterValue)
    case "in":
      return strFilter.split(",").map((s) => s.trim()).includes(strCell)
    case "isEmpty":
      return cellValue == null || cellValue === ""
    case "isNotEmpty":
      return cellValue != null && cellValue !== ""
    default:
      return true
  }
}

/** 比较两个值 (用于排序) */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1

  if (typeof a === "number" && typeof b === "number") {
    return a - b
  }

  return String(a).localeCompare(String(b))
}
