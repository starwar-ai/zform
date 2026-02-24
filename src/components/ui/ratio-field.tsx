/**
 * RatioField
 *
 * 产品:辅料 配比输入组件，两个数字输入框用冒号分隔。
 * 左侧为产品数，右侧为辅料数。
 *
 * 注意：Label 由上层 FieldRenderer 统一渲染，本组件不包含 Label。
 */

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface RatioValue {
  productRatio?: number
  accessoryRatio?: number
}

interface RatioFieldProps {
  value?: RatioValue | null
  onChange?: (value: RatioValue) => void
  /** 产品数占位符 */
  productPlaceholder?: string
  /** 辅料数占位符 */
  accessoryPlaceholder?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

function toInputValue(v: number | undefined | null): string {
  if (v == null || Number.isNaN(v)) return ""
  return String(v)
}

export function RatioField({
  value,
  onChange,
  productPlaceholder = "产品数",
  accessoryPlaceholder = "辅料数",
  disabled,
  readOnly,
  className,
}: RatioFieldProps) {
  const productRatio = value?.productRatio
  const accessoryRatio = value?.accessoryRatio

  const [productInput, setProductInput] = React.useState(() =>
    toInputValue(productRatio)
  )
  const [accessoryInput, setAccessoryInput] = React.useState(() =>
    toInputValue(accessoryRatio)
  )

  React.useEffect(() => {
    setProductInput(toInputValue(productRatio))
  }, [productRatio])
  React.useEffect(() => {
    setAccessoryInput(toInputValue(accessoryRatio))
  }, [accessoryRatio])

  const parseNum = (raw: string): number | undefined => {
    const trimmed = raw.trim()
    if (trimmed === "" || trimmed === "-") return undefined
    const num = Number(trimmed)
    return Number.isNaN(num) ? undefined : num
  }

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setProductInput(raw)
    const num = parseNum(raw)
    onChange?.({
      productRatio: num,
      accessoryRatio: accessoryRatio,
    })
  }

  const handleAccessoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setAccessoryInput(raw)
    const num = parseNum(raw)
    onChange?.({
      productRatio: productRatio,
      accessoryRatio: num,
    })
  }

  if (readOnly) {
    const display =
      productInput || accessoryInput
        ? `${productInput || "-"} : ${accessoryInput || "-"}`
        : "-"
    return (
      <div
        className={cn(
          "flex h-8 items-center rounded-md border border-input bg-muted px-2 py-1 text-xs",
          className
        )}
      >
        {display}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex h-8 items-center gap-1 overflow-hidden rounded-md border border-input bg-background shadow-none transition-colors focus-within:ring-1 focus-within:ring-ring",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <Input
        type="text"
        inputMode="numeric"
        value={productInput}
        onChange={handleProductChange}
        placeholder={productPlaceholder}
        disabled={disabled}
        className="h-full flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
        aria-label="产品数"
      />
      <span className="shrink-0 text-muted-foreground px-0.5 text-xs">:</span>
      <Input
        type="text"
        inputMode="numeric"
        value={accessoryInput}
        onChange={handleAccessoryChange}
        placeholder={accessoryPlaceholder}
        disabled={disabled}
        className="h-full flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
        aria-label="辅料数"
      />
    </div>
  )
}
