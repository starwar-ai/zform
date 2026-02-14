/**
 * FilterSelect
 *
 * 筛选用 Select，支持「全部」占位项。
 * Radix Select 不允许 value=""，使用 SELECT_VALUE_ALL 表示「全部」。
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SELECT_VALUE_ALL } from "@/lib/select-constants"

export interface FilterSelectOption {
  value: string
  label: string
}

interface FilterSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: FilterSelectOption[]
  placeholder: string
  allLabel?: string
}

export function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder,
  allLabel = "全部",
}: FilterSelectProps) {
  return (
    <Select
      value={value || SELECT_VALUE_ALL}
      onValueChange={(v) => onValueChange(v === SELECT_VALUE_ALL ? "" : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SELECT_VALUE_ALL}>{allLabel}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
