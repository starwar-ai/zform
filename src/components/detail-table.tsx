/**
 * DetailTable
 *
 * 可编辑的明细表组件，基于 TanStack Table + dnd-kit。
 * 支持：
 * - 行级编辑模式（双击行进入，新增行自动进入，Escape 退出）
 * - 列宽拖拽调整（自动保存到 localStorage）
 * - 列顺序拖拽（表头拖拽手柄，自动保存到 localStorage）
 * - 行顺序拖拽（行左侧拖拽手柄）
 * - 来源追溯标识
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type ColumnSizingState,
  type Header,
  type Row,
} from "@tanstack/react-table"
import type { DetailTableDef, DetailRow, FieldDef } from "@/core/types"
import { FieldRenderer } from "./field-renderer"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, Trash2, Link, GripVertical, Check } from "lucide-react"

// ============================================================
// 常量
// ============================================================

/** 系统列 ID */
const COL_DRAG = "_drag"
const COL_INDEX = "_index"
const COL_SOURCE = "_source"
const COL_ACTIONS = "_actions"

/** 系统列固定宽度 */
const DRAG_COL_SIZE = 40
const INDEX_COL_SIZE = 50
const SOURCE_COL_SIZE = 40
const ACTION_COL_SIZE = 80
const DEFAULT_FIELD_SIZE = 150

/** 系统列 ID 集合（不参与列拖拽重排） */
const SYSTEM_COL_IDS = new Set([COL_DRAG, COL_INDEX, COL_SOURCE, COL_ACTIONS])

/** localStorage 前缀 */
const STORAGE_PREFIX = "detail-table"

// ============================================================
// 固定列（sticky）样式
// ============================================================

/** 计算固定列的 inline style（position: sticky + left/right 偏移） */
function getStickyStyle(
  columnId: string,
  hasDragCol: boolean
): React.CSSProperties | undefined {
  switch (columnId) {
    case COL_DRAG:
      return { position: "sticky", left: 0, zIndex: 10 }
    case COL_INDEX:
      return {
        position: "sticky",
        left: hasDragCol ? DRAG_COL_SIZE : 0,
        zIndex: 10,
        boxShadow: "2px 0 5px -2px rgba(0,0,0,0.06)",
      }
    case COL_ACTIONS:
      return {
        position: "sticky",
        right: 0,
        zIndex: 10,
        boxShadow: "-2px 0 5px -2px rgba(0,0,0,0.06)",
      }
    default:
      return undefined
  }
}

// ============================================================
// localStorage 工具
// ============================================================

function loadStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function saveStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 忽略存储异常 */
  }
}

function storageKey(tableId: string, suffix: string) {
  return `${STORAGE_PREFIX}-${tableId}-${suffix}`
}

// ============================================================
// 字段值解析与格式化（消除硬编码）
// ============================================================

/** 从行数据中提取字段值（统一处理 computed / price / ratio / 普通字段） */
function resolveFieldValue(field: FieldDef, data: Record<string, unknown>): unknown {
  if (field.type === "computed" && field.compute) return field.compute(data)
  if (field.type === "price" && field.priceConfig) {
    return {
      amount: data[field.priceConfig.amountField],
      currency: data[field.priceConfig.currencyField],
    }
  }
  if (field.type === "ratio" && field.ratioConfig) {
    return {
      productRatio: data[field.ratioConfig.productRatioField],
      accessoryRatio: data[field.ratioConfig.accessoryRatioField],
    }
  }
  return data[field.id]
}

/** 判断是否为复合字段（需要传递 data + onBatchChange） */
function isCompoundField(field: FieldDef): boolean {
  return (
    (field.type === "price" && !!field.priceConfig) ||
    (field.type === "ratio" && !!field.ratioConfig)
  )
}

/** 格式化字段展示值 */
function formatDisplay(field: FieldDef, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-"

  switch (field.type) {
    case "checkbox":
      return value ? "是" : "否"

    case "price": {
      if (!value || typeof value !== "object" || !("amount" in value)) return "-"
      const v = value as { amount?: unknown; currency?: string }
      if (v.amount == null || v.amount === "") return "-"
      const num = Number(v.amount)
      if (Number.isNaN(num)) return "-"
      return v.currency ? `${num.toLocaleString()} ${v.currency}` : num.toLocaleString()
    }

    case "ratio": {
      if (!value || typeof value !== "object" || !("productRatio" in value)) return "-"
      const v = value as { productRatio?: unknown; accessoryRatio?: unknown }
      const pStr = v.productRatio == null || v.productRatio === "" ? "-" : String(v.productRatio)
      const aStr = v.accessoryRatio == null || v.accessoryRatio === "" ? "-" : String(v.accessoryRatio)
      return `${pStr} : ${aStr}`
    }

    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value)

    case "select": {
      const opt = field.options?.find((o) => o.value === value)
      return opt?.label ?? String(value)
    }

    default:
      return String(value)
  }
}

/** 解析 CSS 宽度字符串 ("300px" → 300) */
function parseWidth(width?: string): number {
  if (!width) return DEFAULT_FIELD_SIZE
  const num = parseInt(width, 10)
  return isNaN(num) ? DEFAULT_FIELD_SIZE : num
}

/** FieldDef 可能携带 width 属性（schema 中定义，类型系统未声明） */
type FieldDefWithWidth = FieldDef & { width?: string }

// ============================================================
// Props
// ============================================================

/** 选择器对话框渲染回调的参数 */
interface AddSelectorRenderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 选择确认：传入已转换好的行数据列表 */
  onConfirm: (rowDataList: Record<string, unknown>[]) => void
}

interface DetailTableProps {
  tableDef: DetailTableDef
  rows: DetailRow[]
  /** 添加行（可携带预填数据） */
  onAddRow: (rowData?: Record<string, unknown>) => void
  onDeleteRow: (rowId: string) => void
  onUpdateCell: (rowId: string, fieldId: string, value: unknown) => void
  /** 行排序回调；不提供则不显示行拖拽手柄 */
  onReorderRows?: (orderedRowIds: string[]) => void
  disabled?: boolean
  onTraceRow?: (row: DetailRow) => void
  /**
   * 渲染"添加行"选择器对话框。
   * 提供时，点击"添加行"按钮改为打开选择器，选择确认后批量添加行。
   */
  renderAddSelector?: (props: AddSelectorRenderProps) => React.ReactNode
}

// ============================================================
// 子组件：可拖拽列头
// ============================================================

function DraggableColumnHeader({
  header,
  isDraggable,
}: {
  header: Header<DetailRow, unknown>
  isDraggable: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: header.column.id, disabled: !isDraggable })

  return (
    <TableHead
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        width: header.getSize(),
        minWidth: header.getSize(),
        position: "relative",
        opacity: isDragging ? 0.5 : 1,
      }}
      className={cn(isDragging && "bg-accent")}
    >
      <div className="flex items-center gap-1">
        {isDraggable && (
          <button
            type="button"
            className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3" />
          </button>
        )}
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header, header.getContext())}
      </div>
      {/* 列宽拖拽手柄 */}
      {header.column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onDoubleClick={() => header.column.resetSize()}
          className={cn(
            "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none",
            "opacity-0 hover:opacity-100 bg-primary/40 hover:bg-primary/60",
            header.column.getIsResizing() && "opacity-100 bg-primary"
          )}
        />
      )}
    </TableHead>
  )
}

// ============================================================
// 子组件：可排序行（整合拖拽手柄 + 单元格渲染）
// ============================================================

function SortableRow({
  row,
  isEditing,
  canDrag,
}: {
  row: Row<DetailRow>
  isEditing: boolean
  canDrag: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.original.id, disabled: !canDrag || isEditing })

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        isDragging && "opacity-50 bg-accent",
        isEditing && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
    >
      {row.getVisibleCells().map((cell) => {
        const sticky = getStickyStyle(cell.column.id, canDrag)
        // 固定列需要不透明背景，且跟随编辑行高亮
        const stickyBg = sticky
          ? isEditing
            ? "bg-blue-50 dark:bg-blue-950/30"
            : "bg-background"
          : undefined

        // 行拖拽手柄列：由 SortableRow 自行渲染
        if (cell.column.id === COL_DRAG) {
          return (
            <TableCell
              key={cell.id}
              style={{ width: cell.column.getSize(), ...sticky }}
              className={stickyBg}
            >
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center h-6 w-6",
                  canDrag && !isEditing
                    ? "cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground"
                    : "text-muted-foreground/20"
                )}
                {...(canDrag && !isEditing ? { ...attributes, ...listeners } : {})}
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>
            </TableCell>
          )
        }
        // 常规单元格
        return (
          <TableCell
            key={cell.id}
            style={{ width: cell.column.getSize(), ...sticky }}
            className={stickyBg}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}

// ============================================================
// 主组件
// ============================================================

export function DetailTable({
  tableDef,
  rows,
  onAddRow,
  onDeleteRow,
  onUpdateCell,
  onReorderRows,
  disabled,
  onTraceRow,
  renderAddSelector,
}: DetailTableProps) {
  // ---- 选择器弹窗状态 ----
  const [selectorOpen, setSelectorOpen] = useState(false)

  const handleSelectorConfirm = useCallback(
    (rowDataList: Record<string, unknown>[]) => {
      for (const data of rowDataList) {
        onAddRow(data)
      }
      setSelectorOpen(false)
    },
    [onAddRow]
  )

  const handleAddClick = useCallback(() => {
    if (renderAddSelector) {
      setSelectorOpen(true)
    } else {
      onAddRow()
    }
  }, [renderAddSelector, onAddRow])
  // ---- 行级编辑状态 ----
  const [editingRowIds, setEditingRowIds] = useState<Set<string>>(new Set())
  const prevRowIdsRef = useRef(new Set(rows.map((r) => r.id)))

  // 自动检测新增行 → 进入编辑模式；清理已删除行
  useEffect(() => {
    const currentIds = new Set(rows.map((r) => r.id))

    if (!disabled) {
      const newIds = rows.map((r) => r.id).filter((id) => !prevRowIdsRef.current.has(id))
      if (newIds.length > 0) {
        setEditingRowIds((prev) => {
          const next = new Set(prev)
          for (const id of newIds) next.add(id)
          return next
        })
      }
    }

    // 清理已删除行的编辑状态
    setEditingRowIds((prev) => {
      let changed = false
      const next = new Set<string>()
      for (const id of prev) {
        if (currentIds.has(id)) {
          next.add(id)
        } else {
          changed = true
        }
      }
      return changed ? next : prev
    })

    prevRowIdsRef.current = currentIds
  }, [rows, disabled])

  // disabled 变为 true 时清空所有编辑状态
  useEffect(() => {
    if (disabled) setEditingRowIds(new Set())
  }, [disabled])

  const startEdit = useCallback(
    (rowId: string) => {
      if (!disabled) setEditingRowIds((prev) => new Set(prev).add(rowId))
    },
    [disabled]
  )

  const finishEdit = useCallback((rowId: string) => {
    setEditingRowIds((prev) => {
      const next = new Set(prev)
      next.delete(rowId)
      return next
    })
  }, [])

  // Escape 退出所有编辑
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingRowIds.size > 0) {
        setEditingRowIds(new Set())
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [editingRowIds.size])

  // ---- 列宽 & 列序（localStorage 持久化） ----
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
    () => loadStorage<ColumnSizingState>(storageKey(tableDef.id, "col-sizes")) ?? {}
  )
  const [fieldColumnOrder, setFieldColumnOrder] = useState<string[]>(
    () => loadStorage<string[]>(storageKey(tableDef.id, "col-order")) ?? []
  )

  useEffect(() => {
    if (Object.keys(columnSizing).length > 0) {
      saveStorage(storageKey(tableDef.id, "col-sizes"), columnSizing)
    }
  }, [columnSizing, tableDef.id])

  useEffect(() => {
    if (fieldColumnOrder.length > 0) {
      saveStorage(storageKey(tableDef.id, "col-order"), fieldColumnOrder)
    }
  }, [fieldColumnOrder, tableDef.id])

  // ---- 派生状态 ----
  const showDragCol = !!onReorderRows && !disabled
  const isEditable = !disabled && tableDef.editable !== false

  const fieldIds = useMemo(() => tableDef.fields.map((f) => f.id), [tableDef.fields])

  // 合并已保存列序与当前字段（自动处理新增/删除字段）
  const resolvedFieldOrder = useMemo(() => {
    if (fieldColumnOrder.length === 0) return fieldIds
    const existing = new Set(fieldIds)
    const ordered = fieldColumnOrder.filter((id) => existing.has(id))
    for (const id of fieldIds) {
      if (!ordered.includes(id)) ordered.push(id)
    }
    return ordered
  }, [fieldColumnOrder, fieldIds])

  // 完整列序（系统列 + 字段列）
  const fullColumnOrder = useMemo(() => {
    const order: string[] = []
    if (showDragCol) order.push(COL_DRAG)
    order.push(COL_INDEX, ...resolvedFieldOrder, COL_SOURCE)
    if (isEditable) order.push(COL_ACTIONS)
    return order
  }, [showDragCol, isEditable, resolvedFieldOrder])

  // ---- 列定义 ----
  const columns = useMemo<ColumnDef<DetailRow>[]>(() => {
    const cols: ColumnDef<DetailRow>[] = []

    // 行拖拽手柄列（由 SortableRow 渲染内容）
    if (showDragCol) {
      cols.push({
        id: COL_DRAG,
        header: "",
        size: DRAG_COL_SIZE,
        enableResizing: false,
        cell: () => null,
      })
    }

    // 序号列
    cols.push({
      id: COL_INDEX,
      header: "#",
      size: INDEX_COL_SIZE,
      enableResizing: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.index + 1}</span>
      ),
    })

    // 字段列
    for (const field of tableDef.fields) {
      const compound = isCompoundField(field)
      cols.push({
        id: field.id,
        header: () => (
          <span className="whitespace-nowrap">
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </span>
        ),
        size: parseWidth((field as FieldDefWithWidth).width),
        enableResizing: true,
        cell: ({ row }) => {
          const isRowEditing = editingRowIds.has(row.original.id)
          const value = resolveFieldValue(field, row.original.data)

          // 编辑模式：整行可编辑（computed / readOnly 字段除外）
          if (isRowEditing && !disabled && field.type !== "computed" && !field.readOnly) {
            return (
              <FieldRenderer
                field={field}
                value={value}
                onChange={(v) => onUpdateCell(row.original.id, field.id, v)}
                data={compound ? row.original.data : undefined}
                onBatchChange={
                  compound
                    ? (fid, v) => onUpdateCell(row.original.id, fid, v)
                    : undefined
                }
                hideLabel
              />
            )
          }

          // 展示模式：双击进入编辑
          return (
            <div
              className="min-h-[28px] flex items-center px-1 cursor-default select-none"
              onDoubleClick={() => startEdit(row.original.id)}
            >
              {formatDisplay(field, value)}
            </div>
          )
        },
      })
    }

    // 来源追溯列
    cols.push({
      id: COL_SOURCE,
      header: "",
      size: SOURCE_COL_SIZE,
      enableResizing: false,
      cell: ({ row }) => {
        if (!row.original.sourceRef) return null
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onTraceRow?.(row.original)}
                >
                  <Link className="h-3 w-3 text-blue-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  来源: {row.original.sourceRef.sourceTypeId} /{" "}
                  {row.original.sourceRef.sourceDocId.slice(0, 8)}...
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    })

    // 操作列
    if (isEditable) {
      cols.push({
        id: COL_ACTIONS,
        header: "",
        size: ACTION_COL_SIZE,
        enableResizing: false,
        cell: ({ row }) => {
          const isRowEditing = editingRowIds.has(row.original.id)
          return (
            <div className="flex items-center gap-0.5">
              {isRowEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-green-600 hover:text-green-700"
                  onClick={() => finishEdit(row.original.id)}
                  title="完成编辑"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => onDeleteRow(row.original.id)}
                title="删除行"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )
        },
      })
    }

    return cols
  }, [
    tableDef.fields,
    editingRowIds,
    showDragCol,
    isEditable,
    disabled,
    onUpdateCell,
    onDeleteRow,
    onTraceRow,
    startEdit,
    finishEdit,
  ])

  // ---- TanStack Table 实例 ----
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: {
      columnSizing,
      columnOrder: fullColumnOrder,
    },
    onColumnSizingChange: setColumnSizing,
  })

  // ---- DnD 传感器 ----
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const rowIds = useMemo(() => rows.map((r) => r.id), [rows])

  // ---- 统一拖拽结束（列/行） ----
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const activeStr = String(active.id)
      if (resolvedFieldOrder.includes(activeStr)) {
        // 列拖拽
        const oldIdx = resolvedFieldOrder.indexOf(activeStr)
        const newIdx = resolvedFieldOrder.indexOf(String(over.id))
        if (oldIdx === -1 || newIdx === -1) return
        const next = [...resolvedFieldOrder]
        const [moved] = next.splice(oldIdx, 1)
        next.splice(newIdx, 0, moved)
        setFieldColumnOrder(next)
      } else if (rowIds.includes(activeStr)) {
        // 行拖拽
        const ids = rows.map((r) => r.id)
        const oldIdx = ids.indexOf(activeStr)
        const newIdx = ids.indexOf(String(over.id))
        if (oldIdx === -1 || newIdx === -1) return
        const next = [...ids]
        const [moved] = next.splice(oldIdx, 1)
        next.splice(newIdx, 0, moved)
        onReorderRows?.(next)
      }
    },
    [resolvedFieldOrder, rowIds, rows, onReorderRows]
  )

  // ---- 渲染 ----
  return (
    <div className="space-y-2">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{tableDef.label}</h4>
        {isEditable && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddClick}
            disabled={tableDef.maxRows !== undefined && rows.length >= tableDef.maxRows}
          >
            <Plus className="h-3 w-3 mr-1" />
            {tableDef.addRowSelector?.buttonLabel ?? "添加行"}
          </Button>
        )}
      </div>

      {/* 表格区域：DndContext 必须包裹在 table 外部，避免其内部 div 成为 table 子节点导致 hydration 错误 */}
      <div className="border rounded-md overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table style={{ width: table.getTotalSize() }}>
              {/* 表头（列顺序拖拽 + 列宽拖拽） */}
              <SortableContext
                items={resolvedFieldOrder}
                strategy={horizontalListSortingStrategy}
              >
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((header) => {
                        const sticky = getStickyStyle(header.column.id, showDragCol)
                        return SYSTEM_COL_IDS.has(header.column.id) ? (
                          // 系统列：固定位置，不可拖拽排序
                          <TableHead
                            key={header.id}
                            style={{ width: header.getSize(), ...sticky }}
                            className={cn(sticky && "bg-background z-20")}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ) : (
                          // 字段列：可拖拽排序 + 可拖拽调宽
                          <DraggableColumnHeader
                            key={header.id}
                            header={header}
                            isDraggable
                          />
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
              </SortableContext>

              {/* 表体（行拖拽排序） */}
              <SortableContext
                items={rowIds}
                strategy={verticalListSortingStrategy}
              >
                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <SortableRow
                        key={row.id}
                        row={row}
                        isEditing={editingRowIds.has(row.original.id)}
                        canDrag={showDragCol}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-16 text-center text-muted-foreground"
                      >
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </SortableContext>
          </Table>
        </DndContext>
      </div>

      {/* 添加行选择器对话框 */}
      {renderAddSelector?.({
        open: selectorOpen,
        onOpenChange: setSelectorOpen,
        onConfirm: handleSelectorConfirm,
      })}
    </div>
  )
}
