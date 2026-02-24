/**
 * ChangeDiffPanel
 *
 * 变更前后差异对比面板。遍历 schema.masterFields 比较 originalData 和 currentData，
 * 只显示有变化的字段。
 */

import { useMemo } from "react"
import type { DocumentSchema, FieldDef } from "@/core/types"
import { cn } from "@/lib/utils"

interface ChangeDiffPanelProps {
  originalData: Record<string, unknown>
  currentData: Record<string, unknown>
  schema: DocumentSchema
}

/** 解析 select/combobox 的 label */
function resolveLabel(field: FieldDef, value: unknown): string {
  if (value === null || value === undefined) return "-"
  if (field.type === "select" && field.options) {
    const opt = field.options.find((o) => o.value === value)
    return opt ? opt.label : String(value)
  }
  if (field.type === "checkbox") {
    return value ? "是" : "否"
  }
  if (field.type === "number") {
    return value === "" ? "-" : String(value)
  }
  return String(value)
}

/** 比较两个值是否相同 */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null && b === undefined) return true
  if (a === undefined && b === null) return true
  if (a === "" && (b === null || b === undefined)) return true
  if (b === "" && (a === null || a === undefined)) return true
  // JSON 比较用于对象/数组
  if (typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  return false
}

export function ChangeDiffPanel({
  originalData,
  currentData,
  schema,
}: ChangeDiffPanelProps) {
  const diffs = useMemo(() => {
    const result: {
      fieldId: string
      label: string
      oldValue: string
      newValue: string
    }[] = []

    for (const field of schema.masterFields) {
      // 跳过隐藏字段和不可编辑的纯展示字段
      if (field.hidden) continue

      const oldVal = originalData[field.id]
      const newVal = currentData[field.id]

      if (!isEqual(oldVal, newVal)) {
        result.push({
          fieldId: field.id,
          label: field.label,
          oldValue: resolveLabel(field, oldVal),
          newValue: resolveLabel(field, newVal),
        })
      }
    }

    return result
  }, [originalData, currentData, schema.masterFields])

  if (diffs.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-6">
        无变更内容
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        共 {diffs.length} 项变更
      </div>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-2 py-1.5 font-medium">字段</th>
              <th className="text-left px-2 py-1.5 font-medium">变更前</th>
              <th className="text-left px-2 py-1.5 font-medium">变更后</th>
            </tr>
          </thead>
          <tbody>
            {diffs.map((diff) => (
              <tr key={diff.fieldId} className="border-b last:border-b-0">
                <td className="px-2 py-1.5 font-medium text-muted-foreground whitespace-nowrap">
                  {diff.label}
                </td>
                <td className={cn(
                  "px-2 py-1.5 break-all",
                  diff.oldValue !== "-" && "text-red-600 line-through"
                )}>
                  {diff.oldValue}
                </td>
                <td className={cn(
                  "px-2 py-1.5 break-all",
                  diff.newValue !== "-" && "text-green-600"
                )}>
                  {diff.newValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
