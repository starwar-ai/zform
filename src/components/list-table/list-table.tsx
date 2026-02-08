/**
 * ListTable
 *
 * 通用数据表格组件，基于 TanStack Table + TanStack Query。
 * 支持服务端分页/筛选/排序、操作工具栏、列设置、CSV 导出。
 */

import { useMemo, useState, useCallback, useEffect } from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnSizingState,
} from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, List, Table2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  ListTableProps,
  ListTableColumn,
  ColumnFilter,
  PaginationState,
  FetchParams,
  StandardMode,
} from "./types"
import { TableToolbar } from "./toolbar"
import { FilterRow } from "./filter-row"
import { TablePagination } from "./pagination"
import { exportToCsv } from "./export-utils"

export function ListTable<T>({
  columns,
  queryKey,
  queryFn,
  title,
  titleIcon,
  toolbarActions,
  onRowClick,
  defaultPageSize = 20,
  rowKey,
  exportFilename,
  modeConfig,
  enableStandardMode = false,
  onStandardModeChange,
  defaultStandardMode = "document",
}: ListTableProps<T>) {
  // ============================================================
  // 状态管理
  // ============================================================

  // 生成存储键
  const storageKey = useMemo(() => {
    return `list-table-column-sizing-${queryKey.join('-')}`
  }, [queryKey])

  // 从 localStorage 加载列宽
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // 保存列宽到 localStorage
  useEffect(() => {
    if (Object.keys(columnSizing).length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(columnSizing))
      } catch (error) {
        console.error('Failed to save column sizing:', error)
      }
    }
  }, [columnSizing, storageKey])

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  const [filters, setFilters] = useState<ColumnFilter[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const initial: VisibilityState = {}
      for (const col of columns) {
        if (col.defaultHidden) {
          initial[col.id] = false
        }
      }
      return initial
    }
  )

  // ============================================================
  // 数据查询 (TanStack Query)
  // ============================================================

  const fetchParams: FetchParams = useMemo(
    () => ({
      pagination,
      filters,
      sorting: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    }),
    [pagination, filters, sorting]
  )

  const { data: queryResult, isLoading, isFetching, refetch } = useQuery({
    queryKey: [...queryKey, fetchParams],
    queryFn: () => queryFn(fetchParams),
    placeholderData: (prev) => prev,
  })

  const tableData = useMemo(
    () => queryResult?.data ?? [],
    [queryResult?.data]
  )
  const total = queryResult?.total ?? 0

  // ============================================================
  // 列定义映射 (用于 FilterRow)
  // ============================================================

  const columnDefsMap = useMemo(() => {
    const map = new Map<string, ListTableColumn<T>>()
    for (const col of columns) {
      map.set(col.id, col)
    }
    return map
  }, [columns])

  // ============================================================
  // TanStack Table 列定义
  // ============================================================

  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    return columns.map((col) => ({
      id: col.id,
      accessorFn: (row: T) => (row as Record<string, unknown>)[col.id],
      header: ({ column }) => {
        const isSortable = col.sortable !== false
        if (!isSortable) {
          return <span>{col.label}</span>
        }

        const sorted = column.getIsSorted()
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground -ml-1 px-1 py-0.5 rounded transition-colors"
            onClick={() => column.toggleSorting()}
          >
            {col.label}
            {sorted === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : sorted === "desc" ? (
              <ArrowDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
            )}
          </button>
        )
      },
      cell: ({ getValue, row }) => {
        const value = getValue()

        // 自定义渲染
        if (col.render) {
          return col.render(value, row.original)
        }

        return formatDisplayValue(value, col)
      },
      size: col.width,
      minSize: col.minWidth,
      enableSorting: col.sortable !== false,
    }))
  }, [columns])

  // ============================================================
  // TanStack Table 实例
  // ============================================================

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getRowId: rowKey
      ? (row) => rowKey(row)
      : (_, index) => String(index),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.ceil(total / pagination.pageSize),
  })

  // ============================================================
  // 事件处理
  // ============================================================

  const handleFiltersChange = useCallback((newFilters: ColumnFilter[]) => {
    setFilters(newFilters)
    // 筛选变更时回到第一页
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const handleExport = useCallback(() => {
    // 导出当前可见列的当前页数据
    const visibleColumns = columns.filter(
      (col) => columnVisibility[col.id] !== false
    )
    exportToCsv(visibleColumns, tableData, exportFilename ?? "export")
  }, [columns, columnVisibility, tableData, exportFilename])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // ============================================================
  // 标准模式配置 (单据/明细)
  // ============================================================

  const finalModeConfig = useMemo(() => {
    // 如果已经提供了 modeConfig，优先使用
    if (modeConfig) return modeConfig

    // 如果启用标准模式，生成标准配置
    if (enableStandardMode && onStandardModeChange) {
      return {
        modes: [
          {
            value: "document",
            label: "",
            icon: <List className="h-4 w-4" />,
          },
          {
            value: "detail",
            label: "",
            icon: <Table2 className="h-4 w-4" />,
          },
        ],
        defaultMode: defaultStandardMode,
        onModeChange: (mode: string) => {
          onStandardModeChange(mode as StandardMode)
        },
      }
    }

    return undefined
  }, [modeConfig, enableStandardMode, onStandardModeChange, defaultStandardMode])

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <TableToolbar
        title={title}
        titleIcon={titleIcon}
        columns={columns}
        columnVisibility={columnVisibility as Record<string, boolean>}
        onColumnVisibilityChange={setColumnVisibility}
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={isFetching}
        extraActions={toolbarActions}
        modeConfig={finalModeConfig}
      />

      {/* 表格 */}
      <div className="border rounded-md relative flex-1 overflow-auto">
        {/* 加载遮罩 */}
        {isFetching && !isLoading && (
          <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <Table>
          <TableHeader>
            {/* 表头行 */}
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      width: header.getSize(),
                      minWidth: header.column.columnDef.minSize,
                      position: 'relative',
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {/* Resize Handle */}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={cn(
                        "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary/50",
                        header.column.getIsResizing() && "bg-primary"
                      )}
                    />
                  </TableHead>
                ))}
              </TableRow>
            ))}

            {/* 筛选行 */}
            <FilterRow
              headerGroups={table.getHeaderGroups()}
              columnDefs={columnDefsMap}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-32 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
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
                  colSpan={tableColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      <TablePagination
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        total={total}
        onPageChange={(pageIndex) =>
          setPagination((prev) => ({ ...prev, pageIndex }))
        }
        onPageSizeChange={(pageSize) =>
          setPagination({ pageIndex: 0, pageSize })
        }
      />
    </div>
  )
}

// ============================================================
// 工具函数
// ============================================================

/** 格式化单元格显示值 */
function formatDisplayValue<T>(
  value: unknown,
  column: ListTableColumn<T>
): React.ReactNode {
  if (value === null || value === undefined || value === "") return "-"

  // 选择型：显示 label
  if (column.type === "select" && column.options) {
    const option = column.options.find((opt) => opt.value === value)
    return option ? option.label : String(value)
  }

  // 复选框
  if (column.type === "checkbox") {
    return value ? "是" : "否"
  }

  // 数值
  if (column.type === "number" && typeof value === "number") {
    return value.toLocaleString()
  }

  return String(value)
}
