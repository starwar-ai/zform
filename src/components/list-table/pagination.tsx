/**
 * TablePagination
 *
 * 分页组件。显示总记录数、当前页、每页条数选择、翻页按钮。
 */

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

interface TablePaginationProps {
  /** 当前页索引 (从 0 开始) */
  pageIndex: number
  /** 每页条数 */
  pageSize: number
  /** 总记录数 */
  total: number
  /** 页码变更回调 */
  onPageChange: (pageIndex: number) => void
  /** 每页条数变更回调 */
  onPageSizeChange: (pageSize: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function TablePagination({
  pageIndex,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrevious = pageIndex > 0
  const canNext = pageIndex < totalPages - 1

  // 显示的起止记录号
  const startRecord = total === 0 ? 0 : pageIndex * pageSize + 1
  const endRecord = Math.min((pageIndex + 1) * pageSize, total)

  return (
    <div className="flex items-center justify-between gap-4 pt-3">
      {/* 左侧：记录信息 */}
      <div className="text-sm text-muted-foreground">
        共 <span className="font-medium text-foreground">{total}</span> 条
        {total > 0 && (
          <span>
            ，显示 {startRecord}-{endRecord}
          </span>
        )}
      </div>

      {/* 右侧：分页控制 */}
      <div className="flex items-center gap-2">
        {/* 每页条数选择 */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">每页</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              onPageSizeChange(Number(v))
              onPageChange(0) // 切换每页条数时回到第一页
            }}
          >
            <SelectTrigger className="h-8 w-[70px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size} 条
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 页码信息 */}
        <span className="text-sm text-muted-foreground min-w-[80px] text-center">
          {pageIndex + 1} / {totalPages} 页
        </span>

        {/* 翻页按钮 */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(0)}
            disabled={!canPrevious}
            title="首页"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canPrevious}
            title="上一页"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canNext}
            title="下一页"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={!canNext}
            title="末页"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
