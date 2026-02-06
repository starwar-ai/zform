/**
 * DetailTable
 *
 * 可编辑的明细表组件, 基于 TanStack Table。
 * 支持增删行、单元格编辑、来源追溯标识。
 */

import { useMemo, useState, useCallback } from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import type { DetailTableDef, DetailRow } from "@/core/types"
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
import { Plus, Trash2, Link } from "lucide-react"

interface DetailTableProps {
  tableDef: DetailTableDef
  rows: DetailRow[]
  onAddRow: () => void
  onDeleteRow: (rowId: string) => void
  onUpdateCell: (rowId: string, fieldId: string, value: unknown) => void
  disabled?: boolean
  onTraceRow?: (row: DetailRow) => void
}

export function DetailTable({
  tableDef,
  rows,
  onAddRow,
  onDeleteRow,
  onUpdateCell,
  disabled,
  onTraceRow,
}: DetailTableProps) {
  const [editingCell, setEditingCell] = useState<{
    rowId: string
    fieldId: string
  } | null>(null)

  const handleCellClick = useCallback(
    (rowId: string, fieldId: string) => {
      if (!disabled) {
        setEditingCell({ rowId, fieldId })
      }
    },
    [disabled]
  )

  const handleCellBlur = useCallback(() => {
    setEditingCell(null)
  }, [])

  const columns = useMemo<ColumnDef<DetailRow>[]>(() => {
    const cols: ColumnDef<DetailRow>[] = []

    // 序号列
    cols.push({
      id: "_index",
      header: "#",
      size: 50,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.index + 1}</span>
      ),
    })

    // 字段列
    for (const field of tableDef.fields) {
      cols.push({
        id: field.id,
        header: () => (
          <span>
            {field.label}
            {field.required && (
              <span className="text-destructive ml-0.5">*</span>
            )}
          </span>
        ),
        cell: ({ row }) => {
          const isEditing =
            editingCell?.rowId === row.original.id &&
            editingCell?.fieldId === field.id
          const value =
            field.type === "computed" && field.compute
              ? field.compute(row.original.data)
              : row.original.data[field.id]

          if (isEditing && field.type !== "computed" && !field.readOnly) {
            return (
              <div onBlur={handleCellBlur}>
                <FieldRenderer
                  field={field}
                  value={value}
                  onChange={(v) => onUpdateCell(row.original.id, field.id, v)}
                />
              </div>
            )
          }

          return (
            <div
              className="cursor-pointer min-h-[28px] flex items-center px-1"
              onClick={() => handleCellClick(row.original.id, field.id)}
            >
              {formatDisplayValue(value, field.type)}
            </div>
          )
        },
      })
    }

    // 来源追溯列
    cols.push({
      id: "_source",
      header: "",
      size: 40,
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
    if (!disabled && tableDef.editable !== false) {
      cols.push({
        id: "_actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => onDeleteRow(row.original.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        ),
      })
    }

    return cols
  }, [
    tableDef,
    editingCell,
    disabled,
    handleCellClick,
    handleCellBlur,
    onUpdateCell,
    onDeleteRow,
    onTraceRow,
  ])

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{tableDef.label}</h4>
        {!disabled && tableDef.editable !== false && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddRow}
            disabled={
              tableDef.maxRows !== undefined && rows.length >= tableDef.maxRows
            }
          >
            <Plus className="h-3 w-3 mr-1" />
            添加行
          </Button>
        )}
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
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
        </Table>
      </div>
    </div>
  )
}

function formatDisplayValue(value: unknown, fieldType: string): string {
  if (value === null || value === undefined || value === "") return "-"
  if (fieldType === "checkbox") return value ? "是" : "否"
  if (fieldType === "number" && typeof value === "number") {
    return value.toLocaleString()
  }
  return String(value)
}
