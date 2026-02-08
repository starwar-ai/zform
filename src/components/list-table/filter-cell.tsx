/**
 * FilterCell
 *
 * 单个筛选单元格组件。操作符作为输入框的内联前缀显示，
 * 点击前缀弹出操作符选择列表。
 */

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { FieldType } from "@/core/types"
import type { ColumnFilter, FilterOperator } from "./types"
import {
  getOperatorsByFieldType,
  getOperatorMeta,
  getDefaultOperator,
} from "./operators"

interface FilterCellProps {
  /** 列 ID */
  columnId: string
  /** 字段类型 */
  fieldType: FieldType
  /** 下拉选项 (type=select 时) */
  options?: { label: string; value: string }[]
  /** 当前筛选状态 */
  filter?: ColumnFilter
  /** 筛选变更回调 */
  onFilterChange: (filter: ColumnFilter | undefined) => void
}

export function FilterCell({
  columnId,
  fieldType,
  options,
  filter,
  onFilterChange,
}: FilterCellProps) {
  const [operatorOpen, setOperatorOpen] = useState(false)
  // 本地维护选中的操作符，即使还没有输入值
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator | null>(null)

  const availableOperators = getOperatorsByFieldType(fieldType)
  // 优先使用 filter 中的 operator，其次是本地选择的，最后是默认值
  const currentOperator = filter?.operator ?? selectedOperator ?? getDefaultOperator(fieldType)
  const currentMeta = getOperatorMeta(currentOperator)

  const handleOperatorChange = useCallback(
    (op: FilterOperator) => {
      const meta = getOperatorMeta(op)
      // 更新本地选择的操作符
      setSelectedOperator(op)
      
      if (!meta.needsValue) {
        // 无需值的操作符 (如 isEmpty)，直接生效
        onFilterChange({ columnId, operator: op, value: null })
      } else if (filter?.value !== undefined && filter?.value !== null && filter?.value !== "") {
        // 保留已有值，切换操作符
        onFilterChange({
          columnId,
          operator: op,
          value: filter.value,
          secondValue: meta.needsSecondValue ? filter.secondValue : undefined,
        })
      }
      // 如果没有值，只更新本地状态，等待用户输入值后再触发筛选
      
      setOperatorOpen(false)
    },
    [columnId, filter, onFilterChange]
  )

  const handleValueChange = useCallback(
    (value: unknown) => {
      if (value === "" || value === null || value === undefined) {
        onFilterChange(undefined)
        // 清空筛选时也重置本地操作符选择
        setSelectedOperator(null)
      } else {
        onFilterChange({
          columnId,
          operator: currentOperator,
          value,
          secondValue: filter?.secondValue,
        })
      }
    },
    [columnId, currentOperator, filter?.secondValue, onFilterChange]
  )

  const handleSecondValueChange = useCallback(
    (secondValue: unknown) => {
      if (filter) {
        onFilterChange({
          ...filter,
          secondValue: secondValue === "" ? undefined : secondValue,
        })
      }
    },
    [filter, onFilterChange]
  )

  // 操作符前缀 (点击弹出选择列表)
  const operatorPrefix = (
    <Popover open={operatorOpen} onOpenChange={setOperatorOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "shrink-0 flex items-center justify-center h-full px-1.5 text-xs font-mono cursor-pointer",
            "border-r border-input bg-muted/50 hover:bg-muted transition-colors",
            "rounded-l-md select-none",
            filter && "text-primary font-semibold"
          )}
          title={currentMeta.label}
        >
          {currentMeta.symbol}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1" align="start">
        <div className="flex flex-col">
          {availableOperators.map((op) => (
            <Button
              key={op.id}
              variant={op.id === currentOperator ? "secondary" : "ghost"}
              size="sm"
              className="justify-start h-7 text-xs"
              onClick={() => handleOperatorChange(op.id)}
            >
              <span className="w-5 font-mono text-center mr-1">
                {op.symbol}
              </span>
              {op.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )

  // between 操作符: 两个输入框，各自带前缀
  if (currentMeta.needsSecondValue) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        <FilterInputWrapper prefix={operatorPrefix} hasFilter={!!filter}>
          <InlineInput
            fieldType={fieldType}
            options={options}
            value={filter?.value ?? ""}
            onChange={handleValueChange}
            placeholder="从"
          />
        </FilterInputWrapper>
        <span className="text-xs text-muted-foreground shrink-0">~</span>
        <FilterInputWrapper hasFilter={!!filter}>
          <InlineInput
            fieldType={fieldType}
            options={options}
            value={filter?.secondValue ?? ""}
            onChange={handleSecondValueChange}
            placeholder="至"
          />
        </FilterInputWrapper>
      </div>
    )
  }

  // 无需值的操作符 (isEmpty / isNotEmpty): 只显示前缀 + 标签
  if (!currentMeta.needsValue) {
    return (
      <FilterInputWrapper prefix={operatorPrefix} hasFilter={!!filter}>
        <span className="text-xs text-muted-foreground px-1.5 truncate">
          {filter ? currentMeta.label : ""}
        </span>
      </FilterInputWrapper>
    )
  }

  // 常规: 前缀 + 单个输入
  return (
    <FilterInputWrapper prefix={operatorPrefix} hasFilter={!!filter}>
      <InlineInput
        fieldType={fieldType}
        options={options}
        value={filter?.value ?? ""}
        onChange={handleValueChange}
      />
    </FilterInputWrapper>
  )
}

// ============================================================
// 输入框外壳 (模拟 input 边框，前缀嵌入其中)
// ============================================================

function FilterInputWrapper({
  prefix,
  hasFilter,
  children,
}: {
  prefix?: React.ReactNode
  hasFilter?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex items-center h-7 min-w-0 flex-1 rounded-md border border-input bg-transparent text-xs",
        "transition-colors focus-within:ring-1 focus-within:ring-ring",
        hasFilter && "border-primary/40"
      )}
    >
      {prefix}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

// ============================================================
// 内联输入 (无边框，嵌入 FilterInputWrapper 内部)
// ============================================================

interface InlineInputProps {
  fieldType: FieldType
  options?: { label: string; value: string }[]
  value: unknown
  onChange: (value: unknown) => void
  placeholder?: string
}

function InlineInput({
  fieldType,
  options,
  value,
  onChange,
  placeholder,
}: InlineInputProps) {
  const baseClass = "h-full w-full bg-transparent border-0 shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus:outline-none text-xs px-1.5"

  // 复选框类型
  if (fieldType === "checkbox") {
    return (
      <div className="flex items-center h-full px-1.5 gap-1.5">
        <Checkbox
          checked={value === true}
          onCheckedChange={(checked) =>
            onChange(checked === true ? true : undefined)
          }
        />
        <span className="text-xs text-muted-foreground">
          {value === true ? "是" : "否"}
        </span>
      </div>
    )
  }

  // 下拉选择类型
  if (fieldType === "select" && options && options.length > 0) {
    return (
      <Select
        value={(value as string) ?? ""}
        onValueChange={(v) => onChange(v || undefined)}
      >
        <SelectTrigger className="h-full border-0 shadow-none ring-0 focus:ring-0 text-xs px-1.5 min-w-0">
          <SelectValue placeholder={placeholder ?? "选择..."} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // 日期类型
  if (fieldType === "date") {
    return (
      <input
        type="date"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={baseClass}
        placeholder={placeholder}
      />
    )
  }

  // 数值类型
  if (fieldType === "number") {
    return (
      <input
        type="number"
        value={(value as string) ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
        className={baseClass}
        placeholder={placeholder ?? "数值..."}
      />
    )
  }

  // 默认文本类型
  return (
    <input
      type="text"
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      className={baseClass}
      placeholder={placeholder ?? "筛选..."}
    />
  )
}
