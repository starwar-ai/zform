/**
 * SkuCodeField
 *
 * 产品编号复合控件：前缀 + 序号 + 后缀 = 完整编号
 * 前缀取自 ProductCategory.code_prefix，序号长度取自 serial_length。
 * 前缀只读，序号和后缀可编辑；编辑时自动重算完整编号。
 *
 * 注意：Label 由上层 FieldRenderer 统一渲染，本组件不包含 Label。
 */

import * as React from "react"
import { Input } from "@/components/ui/input"
import { formatSkuCode } from "@/apis/sku-api"
import { cn } from "@/lib/utils"

export interface SkuCodeValue {
  preCode: string
  xhCode: string
  afterCode: string
}

interface SkuCodeFieldProps {
  value: SkuCodeValue
  onChange: (fieldId: string, value: unknown) => void
  xhCodeFieldId: string
  afterCodeFieldId: string
  codeFieldId: string
  /** 序号长度（取自 ProductCategory.serial_length，默认 3） */
  serialLength?: number
  disabled?: boolean
  /** 编辑模式下编号锁定，仅展示 */
  readOnly?: boolean
  className?: string
}

const DEFAULT_SERIAL_LENGTH = 3

export function SkuCodeField({
  value,
  onChange,
  xhCodeFieldId,
  afterCodeFieldId,
  codeFieldId,
  serialLength = DEFAULT_SERIAL_LENGTH,
  disabled,
  readOnly,
  className,
}: SkuCodeFieldProps) {
  const { preCode = "", xhCode = "", afterCode = "" } = value
  const fullCode = formatSkuCode(preCode, xhCode, afterCode)
  const xhLen = Math.max(1, Math.min(10, serialLength))

  // 输入中暂存原始值，blur 时补 0
  const [xhDraft, setXhDraft] = React.useState<string | null>(null)
  const isEditingXh = xhDraft !== null

  const handleXhChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, xhLen)
    setXhDraft(raw)
  }

  const handleXhBlur = () => {
    if (xhDraft === null) return
    const padded = xhDraft.padStart(xhLen, "0")
    setXhDraft(null)
    onChange(xhCodeFieldId, padded)
    onChange(codeFieldId, formatSkuCode(preCode, padded, afterCode))
  }

  const handleAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(afterCodeFieldId, v)
    onChange(codeFieldId, formatSkuCode(preCode, xhCode, v))
  }

  if (readOnly) {
    return (
      <Input value={fullCode} disabled className={cn("bg-muted", className)} />
    )
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Input
        value={preCode}
        disabled
        placeholder="前缀"
        className="w-28 bg-muted font-mono text-center rounded-r-none border-r-0 px-2"
        aria-label="前缀"
      />
      <Input
        value={isEditingXh ? xhDraft : xhCode}
        onChange={handleXhChange}
        onBlur={handleXhBlur}
        disabled={disabled}
        placeholder={"0".repeat(xhLen)}
        maxLength={xhLen}
        className="w-16 font-mono text-center rounded-none border-r-0 px-2"
        aria-label="序号"
      />
      <Input
        value={afterCode}
        onChange={handleAfterChange}
        disabled={disabled}
        placeholder="后缀"
        className="w-16 flex-1 rounded-l-none px-2"
        aria-label="后缀"
      />
    </div>
  )
}
