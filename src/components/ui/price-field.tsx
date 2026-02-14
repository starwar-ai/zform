/**
 * PriceField
 *
 * 价格录入与展示组件：金额输入框 + 币种下拉（后缀）
 * 支持录入和只读展示两种模式。
 *
 * 注意：Label 由上层 FieldRenderer 统一渲染，本组件不包含 Label。
 */

import * as React from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CurrencyOption } from "@/lib/currency"
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "@/lib/currency"

/** 默认币种选项（从统一常量引用，保持向后兼容） */
export const DEFAULT_CURRENCY_OPTIONS = CURRENCY_OPTIONS

export type { CurrencyOption }

export interface PriceValue {
  amount?: number
  currency?: string
}

interface PriceFieldProps {
  value?: PriceValue | null
  onChange?: (value: PriceValue) => void
  /** 币种选项，默认从统一常量获取 */
  currencyOptions?: CurrencyOption[]
  /** 默认币种 */
  defaultCurrency?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  /** 金额小数位数，默认 2 */
  decimalPlaces?: number
  className?: string
}

function formatAmount(
  amount: number | undefined | null,
  decimalPlaces: number
): string {
  if (amount == null || Number.isNaN(amount)) return ""
  return Number(amount).toFixed(decimalPlaces)
}

export function PriceField({
  value,
  onChange,
  currencyOptions = DEFAULT_CURRENCY_OPTIONS,
  defaultCurrency = DEFAULT_CURRENCY,
  placeholder = "0.00",
  disabled,
  readOnly,
  decimalPlaces = 2,
  className,
}: PriceFieldProps) {
  const amount = value?.amount
  const currency = value?.currency ?? defaultCurrency

  const [amountInput, setAmountInput] = React.useState(() =>
    formatAmount(amount, decimalPlaces)
  )
  const isControlled = value !== undefined && value !== null

  React.useEffect(() => {
    if (isControlled) {
      setAmountInput(formatAmount(amount, decimalPlaces))
    }
  }, [amount, decimalPlaces, isControlled])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setAmountInput(raw)
    const num = parseFloat(raw)
    if (!Number.isNaN(num)) {
      onChange?.({
        amount: num,
        currency: currency,
      })
    } else if (raw === "" || raw === "-") {
      onChange?.({
        amount: undefined,
        currency: currency,
      })
    }
  }

  const handleAmountBlur = () => {
    if (amountInput === "" || amountInput === "-") return
    const num = parseFloat(amountInput)
    if (!Number.isNaN(num)) {
      const formatted = formatAmount(num, decimalPlaces)
      setAmountInput(formatted)
      onChange?.({
        amount: num,
        currency: currency,
      })
    }
  }

  const handleCurrencyChange = (v: string) => {
    onChange?.({
      amount: amount,
      currency: v,
    })
  }

  if (readOnly) {
    const displayAmount = formatAmount(amount, decimalPlaces)
    const displayCurrency =
      currencyOptions.find((o) => o.value === currency)?.label ?? currency
    const displayText =
      displayAmount && displayCurrency
        ? `${displayAmount} ${displayCurrency}`
        : displayAmount || "-"
    return (
      <div
        className={cn(
          "flex h-9 items-center rounded-md border border-input bg-muted px-3 py-1 text-sm",
          className
        )}
      >
        {displayText}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex h-9 items-center overflow-hidden rounded-md border border-input bg-background shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <Input
        type="text"
        inputMode="decimal"
        value={amountInput}
        onChange={handleAmountChange}
        onBlur={handleAmountBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="h-full flex-1 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
        aria-label="金额"
      />
      <Select
        value={currency}
        onValueChange={handleCurrencyChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="h-full w-[90px] shrink-0 border-0 border-l border-input rounded-none bg-muted/50 focus:ring-0"
          aria-label="币种"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencyOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
