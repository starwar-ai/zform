/**
 * TableToolbar
 *
 * 表格操作工具栏。提供刷新、导出、列设置功能。
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  RefreshCw,
  Download,
  Settings2,
} from "lucide-react"
import type { ListTableColumn } from "./types"

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
  /** 刷新回调 */
  onRefresh: () => void
  /** 导出回调 */
  onExport: () => void
  /** 是否正在加载 */
  isLoading?: boolean
  /** 额外的操作按钮 */
  extraActions?: React.ReactNode
}

export function TableToolbar<T>({
  title,
  titleIcon,
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  onRefresh,
  onExport,
  isLoading,
  extraActions,
}: TableToolbarProps<T>) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    onColumnVisibilityChange({
      ...columnVisibility,
      [columnId]: visible,
    })
  }

  return (
    <div className="flex items-center justify-between gap-2 pb-3">
      {/* 左侧：标题 */}
      <div className="flex items-center gap-2">
        {title && (
          <h3 className="text-base font-medium flex items-center gap-2">
            {titleIcon}
            {title}
          </h3>
        )}
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-1">
        {/* 额外操作 */}
        {extraActions}

        <TooltipProvider delayDuration={300}>
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
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>列设置</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-52 p-2" align="end">
              <div className="text-sm font-medium mb-2 px-1">显示列</div>
              <div className="flex flex-col gap-1">
                {columns.map((col) => {
                  const isVisible = columnVisibility[col.id] !== false
                  return (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-accent cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={isVisible}
                        onCheckedChange={(checked) =>
                          handleToggleColumn(col.id, !!checked)
                        }
                      />
                      <span className="truncate">{col.label}</span>
                    </label>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        </TooltipProvider>
      </div>
    </div>
  )
}
