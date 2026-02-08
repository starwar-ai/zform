/**
 * TableToolbar
 *
 * 表格操作工具栏。提供刷新、导出、列设置功能。
 */

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  RefreshCw,
  Download,
  FilterX,
} from "lucide-react"
import type { ListTableColumn, ColumnFilter } from "./types"
import { ColumnSettings, type ColumnPinningState } from "./column-settings"

interface TableToolbarProps<T> {
  /** 表格标题 */
  title?: string
  /** 标题图标 */
  titleIcon?: React.ReactNode
  /** 列定义 */
  columns: ListTableColumn<T>[]
  /** 列可见性状态 */
  columnVisibility: Record<string, boolean>
  /** 列可见性变更回调 */
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void
  /** 列顺序 */
  columnOrder: string[]
  /** 列顺序变更回调 */
  onColumnOrderChange: (order: string[]) => void
  /** 列固定状态 */
  columnPinning: ColumnPinningState
  /** 列固定变更回调 */
  onColumnPinningChange: (pinning: ColumnPinningState) => void
  /** 刷新回调 */
  onRefresh: () => void
  /** 导出回调 */
  onExport: () => void
  /** 是否正在加载 */
  isLoading?: boolean
  /** 额外的操作按钮 */
  extraActions?: React.ReactNode
  /** 当前筛选条件 */
  filters?: ColumnFilter[]
  /** 清除筛选回调 */
  onClearFilters?: () => void
  /** 选中行数量 (跨页总计) */
  selectedCount?: number
  /** 清空全部选择回调 */
  onClearSelection?: () => void
}

export function TableToolbar<T>({
  title,
  titleIcon,
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  columnPinning,
  onColumnPinningChange,
  onRefresh,
  onExport,
  isLoading,
  extraActions,
  filters = [],
  onClearFilters,
  selectedCount = 0,
  onClearSelection,
}: TableToolbarProps<T>) {
  // 是否有活动的筛选条件
  const hasActiveFilters = filters.length > 0

  return (
    <div className="flex items-center justify-between gap-2 pb-3">
      {/* 左侧：标题 + 选中提示 */}
      <div className="flex items-center gap-3">
        {title && (
          <h3 className="text-base font-medium flex items-center gap-2">
            {titleIcon}
            {title}
          </h3>
        )}
        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>已选 <span className="font-medium text-foreground">{selectedCount}</span> 项</span>
            {onClearSelection && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs"
                onClick={onClearSelection}
              >
                清空
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-1">
        {/* 额外操作 */}
        {extraActions}

        <TooltipProvider delayDuration={300}>
          {/* 清除筛选按钮 */}
          {onClearFilters && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  disabled={!hasActiveFilters}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                清除筛选 {hasActiveFilters && `(${filters.length})`}
              </TooltipContent>
            </Tooltip>
          )}

          {/* 刷新按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>刷新</TooltipContent>
          </Tooltip>

          {/* 导出按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>导出 CSV</TooltipContent>
          </Tooltip>

          {/* 列设置 */}
          <ColumnSettings
            columns={columns}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={onColumnVisibilityChange}
            columnOrder={columnOrder}
            onColumnOrderChange={onColumnOrderChange}
            columnPinning={columnPinning}
            onColumnPinningChange={onColumnPinningChange}
          />
        </TooltipProvider>
      </div>
    </div>
  )
}
