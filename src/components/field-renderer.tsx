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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"

interface FieldRendererProps {
  field: FieldDef
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
}

export function FieldRenderer({
  field,
  value,
  onChange,
  disabled,
}: FieldRendererProps) {
  const isDisabled = disabled || field.readOnly

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
          <Checkbox
            checked={(value as boolean) ?? false}
            onCheckedChange={onChange}
            disabled={isDisabled}
          />
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

      case "computed":
        return (
          <Input
            value={String(value ?? "")}
            disabled
            className="bg-muted"
          />
        )

      case "dimensions": {
        const config = field.dimensionConfig
        if (!config) return null
        const current = (value as { length?: unknown; width?: unknown; height?: unknown }) ?? {}
        const placeholders = config.placeholders ?? {}
        const placeholder =
          field.placeholder ??
          `${placeholders.length ?? "长"}/${placeholders.width ?? "宽"}/${placeholders.height ?? "高"}`
        const formatPart = (v: unknown) =>
          v === null || v === undefined || v === "" ? "" : String(v)
        const displayValue = [
          formatPart(current.length),
          formatPart(current.width),
          formatPart(current.height),
        ].join("/")
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
