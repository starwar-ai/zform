/**
 * ColumnSettings
 *
 * 列设置面板。支持列显隐切换、拖拽排序、固定列、显示字段来源。
 */

import { useState, useCallback, useMemo } from "react"
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
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import {
  Settings2,
  GripVertical,
  Pin,
  PinOff,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ListTableColumn, ColumnSource } from "./types"

// ============================================================
// 列固定状态类型
// ============================================================

export interface ColumnPinningState {
  left: string[]
  right: string[]
}

type PinPosition = "left" | "right" | false

// ============================================================
// Props
// ============================================================

interface ColumnSettingsProps<T> {
  /** 列定义 */
  columns: ListTableColumn<T>[]
  /** 列可见性状态 */
  columnVisibility: Record<string, boolean>
  /** 列可见性变更回调 */
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void
  /** 列顺序 (列 ID 数组) */
  columnOrder: string[]
  /** 列顺序变更回调 */
  onColumnOrderChange: (order: string[]) => void
  /** 列固定状态 */
  columnPinning: ColumnPinningState
  /** 列固定变更回调 */
  onColumnPinningChange: (pinning: ColumnPinningState) => void
}

// ============================================================
// 来源标签配置
// ============================================================

const sourceConfig: Record<ColumnSource, { label: string; className: string }> = {
  master: {
    label: "主数据",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  detail: {
    label: "明细",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  system: {
    label: "系统",
    className: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700",
  },
}

// ============================================================
// 来源标签组件
// ============================================================

function SourceBadge({ source }: { source: ColumnSource }) {
  const config = sourceConfig[source]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0 text-[10px] leading-4 font-medium border shrink-0",
        config.className
      )}
    >
      {config.label}
    </span>
  )
}

// ============================================================
// 固定列按钮组件
// ============================================================

function PinButton({
  pinPosition,
  onCyclePinState,
}: {
  pinPosition: PinPosition
  onCyclePinState: () => void
}) {
  const isPinned = pinPosition !== false

  const label = pinPosition === "left"
    ? "已固定左侧"
    : pinPosition === "right"
      ? "已固定右侧"
      : "固定列"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center h-5 w-5 rounded shrink-0 transition-colors",
            isPinned
              ? "text-primary hover:text-primary/80"
              : "text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onCyclePinState()
          }}
        >
          {isPinned ? (
            <Pin
              className={cn(
                "h-3.5 w-3.5",
                pinPosition === "left" && "-rotate-45",
                pinPosition === "right" && "rotate-45"
              )}
            />
          ) : (
            <PinOff className="h-3.5 w-3.5" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        {label}
        {!isPinned && " (点击固定到左侧)"}
      </TooltipContent>
    </Tooltip>
  )
}

// ============================================================
// 可排序列项组件
// ============================================================

interface SortableColumnItemProps {
  column: { id: string; label: string; source?: ColumnSource }
  isVisible: boolean
  pinPosition: PinPosition
  onToggleVisibility: (checked: boolean) => void
  onCyclePinState: () => void
}

function SortableColumnItem({
  column,
  isVisible,
  pinPosition,
  onToggleVisibility,
  onCyclePinState,
}: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1.5 px-1 py-1 rounded transition-colors",
        isDragging ? "opacity-50 bg-accent" : "hover:bg-accent/50"
      )}
    >
      {/* 拖拽手柄 */}
      <button
        type="button"
        className="flex items-center justify-center h-5 w-5 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* 可见性复选框 */}
      <Checkbox
        checked={isVisible}
        onCheckedChange={(checked) => onToggleVisibility(!!checked)}
        className="shrink-0"
      />

      {/* 列名 */}
      <span
        className={cn(
          "text-sm truncate flex-1 min-w-0",
          !isVisible && "text-muted-foreground line-through"
        )}
      >
        {column.label}
      </span>

      {/* 来源标签 */}
      {column.source && <SourceBadge source={column.source} />}

      {/* 固定列按钮 */}
      <PinButton pinPosition={pinPosition} onCyclePinState={onCyclePinState} />
    </div>
  )
}

// ============================================================
// 主组件
// ============================================================

export function ColumnSettings<T>({
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  columnPinning,
  onColumnPinningChange,
}: ColumnSettingsProps<T>) {
  const [open, setOpen] = useState(false)

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 列映射表 (快速查找)
  const columnMap = useMemo(() => {
    const map = new Map<string, ListTableColumn<T>>()
    for (const col of columns) {
      map.set(col.id, col)
    }
    return map
  }, [columns])

  // 按 columnOrder 排列的列列表
  const orderedColumns = useMemo(() => {
    // 如果 columnOrder 为空，用 columns 原始顺序
    if (columnOrder.length === 0) {
      return columns.map((c) => ({ id: c.id, label: c.label, source: c.source }))
    }
    // 按 columnOrder 排列，并补充不在 order 中的新列
    const ordered: { id: string; label: string; source?: ColumnSource }[] = []
    for (const id of columnOrder) {
      const col = columnMap.get(id)
      if (col) {
        ordered.push({ id: col.id, label: col.label, source: col.source })
      }
    }
    // 追加 columnOrder 中未包含的列
    for (const col of columns) {
      if (!columnOrder.includes(col.id)) {
        ordered.push({ id: col.id, label: col.label, source: col.source })
      }
    }
    return ordered
  }, [columns, columnOrder, columnMap])

  // 获取列的固定位置
  const getPinPosition = useCallback(
    (columnId: string): PinPosition => {
      if (columnPinning.left.includes(columnId)) return "left"
      if (columnPinning.right.includes(columnId)) return "right"
      return false
    },
    [columnPinning]
  )

  // 循环切换固定状态: none → left → right → none
  const handleCyclePinState = useCallback(
    (columnId: string) => {
      const current = getPinPosition(columnId)
      const newPinning = {
        left: columnPinning.left.filter((id) => id !== columnId),
        right: columnPinning.right.filter((id) => id !== columnId),
      }

      if (current === false) {
        newPinning.left.push(columnId)
      } else if (current === "left") {
        newPinning.right.push(columnId)
      }
      // current === "right" → none (已经从两个数组中移除)

      onColumnPinningChange(newPinning)
    },
    [columnPinning, getPinPosition, onColumnPinningChange]
  )

  // 切换列可见性
  const handleToggleColumn = useCallback(
    (columnId: string, visible: boolean) => {
      onColumnVisibilityChange({
        ...columnVisibility,
        [columnId]: visible,
      })
    },
    [columnVisibility, onColumnVisibilityChange]
  )

  // 拖拽结束，更新列顺序
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const currentOrder = orderedColumns.map((c) => c.id)
      const oldIndex = currentOrder.indexOf(String(active.id))
      const newIndex = currentOrder.indexOf(String(over.id))

      if (oldIndex === -1 || newIndex === -1) return

      const newOrder = [...currentOrder]
      const [moved] = newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, moved)

      onColumnOrderChange(newOrder)
    },
    [orderedColumns, onColumnOrderChange]
  )

  // 全选/全不选
  const allVisible = columns.every((c) => columnVisibility[c.id] !== false)
  const handleToggleAll = useCallback(() => {
    const newVisibility: Record<string, boolean> = {}
    const targetVisible = !allVisible
    for (const col of columns) {
      newVisibility[col.id] = targetVisible
    }
    onColumnVisibilityChange(newVisibility)
  }, [columns, allVisible, onColumnVisibilityChange])

  // 统计: 可见列数 / 总列数
  const visibleCount = columns.filter(
    (c) => columnVisibility[c.id] !== false
  ).length
  const pinnedCount =
    columnPinning.left.length + columnPinning.right.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Settings2 className="h-4 w-4" />
              {pinnedCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                  {pinnedCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>列设置</TooltipContent>
      </Tooltip>

      <PopoverContent className="w-72 p-0" align="end">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">
            列设置
            <span className="text-muted-foreground font-normal ml-1.5">
              {visibleCount}/{columns.length}
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleToggleAll}
          >
            {allVisible ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                全部隐藏
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                全部显示
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* 列列表 */}
        <div className="max-h-80 overflow-y-auto">
          <div className="p-1.5">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedColumns.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {orderedColumns.map((col) => (
                  <SortableColumnItem
                    key={col.id}
                    column={col}
                    isVisible={columnVisibility[col.id] !== false}
                    pinPosition={getPinPosition(col.id)}
                    onToggleVisibility={(checked) =>
                      handleToggleColumn(col.id, checked)
                    }
                    onCyclePinState={() => handleCyclePinState(col.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* 底部提示 */}
        <Separator />
        <div className="px-3 py-1.5 text-[11px] text-muted-foreground">
          拖拽调整顺序 · 点击图钉固定列
        </div>
      </PopoverContent>
    </Popover>
  )
}
