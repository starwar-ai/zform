/**
 * FieldRenderer
 *
 * 根据 FieldDef 动态渲染表单字段。
 */

import type { FieldDef } from "@/core/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { SkuCodeField } from "@/components/ui/sku-code-field"
import { PriceField } from "@/components/ui/price-field"
import { RatioField } from "@/components/ui/ratio-field"
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "@/lib/currency"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { EmployeeSelectorField } from "@/components/employee-selector-field"
import type { Employee } from "@/types/employee"

interface FieldRendererProps {
  field: FieldDef
  value: unknown
  onChange: (value: unknown) => void
  /** 用于 skuCode 等需要访问其他字段的复合控件 */
  data?: Record<string, unknown>
  /** 用于 skuCode：支持 (fieldId, value) 批量更新 */
  onBatchChange?: (fieldId: string, value: unknown) => void
  disabled?: boolean
  /** 字段是否只读（由 MasterForm 根据 field.readOnly + field.readOnlyModes 计算） */
  fieldReadOnly?: boolean
  /** 隐藏标签（表格行内编辑时使用，列头已有字段名） */
  hideLabel?: boolean
}

export function FieldRenderer({
  field,
  value,
  onChange,
  data,
  onBatchChange,
  disabled,
  fieldReadOnly = false,
  hideLabel = false,
}: FieldRendererProps) {
  const isDisabled = disabled || field.readOnly || fieldReadOnly

  const renderField = () => {
    switch (field.type) {
      case "text":
        return (
          <Input
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={isDisabled}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={(value as number) ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? undefined : Number(e.target.value))
            }
            placeholder={field.placeholder}
            disabled={isDisabled}
          />
        )

      case "date":
        return (
          <Input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={isDisabled}
          />
        )

      case "textarea":
        return (
          <Textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={isDisabled}
            rows={field.rows}
            className={field.rows ? "min-h-0 resize-none" : undefined}
          />
        )

      case "select":
        return (
          <Select
            value={(value as string) ?? ""}
            onValueChange={onChange}
            disabled={isDisabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder ?? "请选择..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "checkbox":
        return (
          <div className="flex min-h-9 items-center">
            <Checkbox
              checked={(value as boolean) ?? false}
              onCheckedChange={onChange}
              disabled={isDisabled}
            />
          </div>
        )

      case "combobox":
        return field.comboboxConfig ? (
          <Combobox
            value={(value as string) ?? undefined}
            onChange={onChange}
            placeholder={field.placeholder}
            disabled={isDisabled}
            fetchOptions={field.comboboxConfig.fetchOptions}
            isTree={field.comboboxConfig.isTree}
          />
        ) : null

      case "employeeSelector":
        const config = field.employeeSelectorConfig
        return (
          <EmployeeSelectorField
            mode={config?.mode === "multiple" ? "multiple" : "single"}
            value={value as Employee | Employee[] | undefined}
            onChange={onChange}
            placeholder={field.placeholder}
            disabled={isDisabled}
            required={field.required}
            columns={config?.columns}
            statusFilter={config?.statusFilter}
          />
        )

      case "computed":
        return (
          <Input
            value={String(value ?? "")}
            disabled
            className="bg-muted"
          />
        )

      case "skuCode": {
        const config = field.skuCodeConfig
        if (!config || !onBatchChange || !data) return null
        const skuValue = {
          preCode: String(data[config.preCodeField] ?? ""),
          xhCode: String(data[config.xhCodeField] ?? ""),
          afterCode: String(data[config.afterCodeField] ?? ""),
        }
        const serialLength = config.serialLengthField
          ? Number(data[config.serialLengthField] ?? 3)
          : 3
        return (
          <SkuCodeField
            value={skuValue}
            onChange={onBatchChange}
            xhCodeFieldId={config.xhCodeField}
            afterCodeFieldId={config.afterCodeField}
            codeFieldId={config.codeField}
            serialLength={serialLength}
            disabled={isDisabled}
            readOnly={fieldReadOnly}
          />
        )
      }

      case "price": {
        const config = field.priceConfig
        if (!config || !onBatchChange || !data) return null
        const priceValue = {
          amount: data[config.amountField] as number | undefined,
          currency: (data[config.currencyField] as string) ?? DEFAULT_CURRENCY,
        }
        return (
          <PriceField
            value={priceValue}
            onChange={(v) => {
              onBatchChange(config.amountField, v.amount)
              onBatchChange(config.currencyField, v.currency)
            }}
            currencyOptions={field.options ?? CURRENCY_OPTIONS}
            placeholder={field.placeholder}
            disabled={isDisabled}
            readOnly={fieldReadOnly}
          />
        )
      }

      case "ratio": {
        const config = field.ratioConfig
        if (!config || !onBatchChange || !data) return null
        const ratioValue = {
          productRatio: data[config.productRatioField] as number | undefined,
          accessoryRatio: data[config.accessoryRatioField] as number | undefined,
        }
        return (
          <RatioField
            value={ratioValue}
            onChange={(v) => {
              onBatchChange(config.productRatioField, v.productRatio)
              onBatchChange(config.accessoryRatioField, v.accessoryRatio)
            }}
            productPlaceholder="产品数"
            accessoryPlaceholder="辅料数"
            disabled={isDisabled}
            readOnly={fieldReadOnly}
          />
        )
      }

      case "dimensions": {
        const config = field.dimensionConfig
        if (!config) return null
        const current = (value as { length?: unknown; width?: unknown; height?: unknown }) ?? {}
        const placeholders = config.placeholders ?? {}
        const placeholder =
          field.placeholder ||
          `${placeholders.length || "长"}/${placeholders.width || "宽"}/${placeholders.height || "高"}`
        const formatPart = (v: unknown) =>
          v === null || v === undefined || v === "" ? "" : String(v)
        const parts = [
          formatPart(current.length),
          formatPart(current.width),
          formatPart(current.height),
        ]
        const displayValue = parts.every((p) => !p)
          ? ""
          : parts.join("/")
        const toNumberOrUndefined = (raw: string | undefined) => {
          const trimmed = (raw ?? "").trim()
          if (trimmed === "") return undefined
          const num = Number(trimmed)
          return Number.isNaN(num) ? undefined : num
        }

        return (
          <div className="flex items-center gap-2">
            <Input
              value={displayValue}
              onChange={(e) => {
                const parts = e.target.value.split("/")
                const next = {
                  length: toNumberOrUndefined(parts[0]),
                  width: toNumberOrUndefined(parts[1]),
                  height: toNumberOrUndefined(parts[2]),
                }
                onChange(next)
              }}
              placeholder={placeholder}
              disabled={isDisabled}
              aria-label="规格尺寸"
            />
          </div>
        )
      }

      default:
        return (
          <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            disabled={isDisabled}
          />
        )
    }
  }

  if (hideLabel) {
    return <>{renderField()}</>
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderField()}
    </div>
  )
}
