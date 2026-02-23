/**
 * DimensionsField
 *
 * 规格尺寸输入框（长/宽/高），录入时保持光标位置不跳到末尾。
 */

import { useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"

const formatPart = (v: unknown) =>
  v === null || v === undefined || v === "" ? "" : String(v)

const toNumberOrUndefined = (raw: string | undefined) => {
  const trimmed = (raw ?? "").trim()
  if (trimmed === "") return undefined
  const num = Number(trimmed)
  return Number.isNaN(num) ? undefined : num
}

interface DimensionsFieldProps {
  value: { length?: unknown; width?: unknown; height?: unknown }
  onChange: (value: { length?: number; width?: number; height?: number }) => void
  placeholder?: string
  disabled?: boolean
}

export function DimensionsField({
  value,
  onChange,
  placeholder,
  disabled,
}: DimensionsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cursorRef = useRef<number | null>(null)

  const parts = [
    formatPart(value.length),
    formatPart(value.width),
    formatPart(value.height),
  ]
  const displayValue = parts.every((p) => !p) ? "" : parts.join("/")

  useEffect(() => {
    if (inputRef.current && cursorRef.current !== null) {
      const pos = Math.min(cursorRef.current, inputRef.current.value.length)
      inputRef.current.setSelectionRange(pos, pos)
      cursorRef.current = null
    }
  })

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={displayValue}
        onChange={(e) => {
          const newParts = e.target.value.split("/")
          const next = {
            length: toNumberOrUndefined(newParts[0]),
            width: toNumberOrUndefined(newParts[1]),
            height: toNumberOrUndefined(newParts[2]),
          }
          cursorRef.current = e.target.selectionStart
          onChange(next)
        }}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="规格尺寸"
      />
    </div>
  )
}
