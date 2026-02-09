/**
 * MasterForm
 *
 * 渲染单据的主数据表单, 根据 Schema 动态生成字段。
 * 支持字段分组、栅格布局，列数根据容器宽度自适应。
 */

import { useState, useEffect, useRef } from "react"
import type { FieldDef } from "@/core/types"
import { FieldRenderer } from "./field-renderer"

/** 每列最小宽度（px），用于计算列数 */
const COL_MIN_WIDTH = 240

interface MasterFormProps {
  fields: FieldDef[]
  data: Record<string, unknown>
  onChange: (fieldId: string, value: unknown) => void
  disabled?: boolean
}

export function MasterForm({
  fields,
  data,
  onChange,
  disabled,
}: MasterFormProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(4)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]!.contentRect.width
      setCols(Math.max(2, Math.min(6, Math.floor(width / COL_MIN_WIDTH))))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 按 group 分组
  const groups = groupFields(fields)

  return (
    <div ref={containerRef} className="space-y-6">
      {groups.map((group) => (
        <div key={group.title ?? "__default"}>
          {group.title && (
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 border-b pb-2">
              {group.title}
            </h3>
          )}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {group.fields.map((field) => {
              // 计算值 (computed 字段)
              const isDimensions = field.type === "dimensions" && field.dimensionConfig
              const value = isDimensions
                ? {
                    length: data[field.dimensionConfig.lengthId],
                    width: data[field.dimensionConfig.widthId],
                    height: data[field.dimensionConfig.heightId],
                  }
                : field.type === "computed" && field.compute
                  ? field.compute(data)
                  : data[field.id]

              const span = Math.min(field.span ?? 1, cols)

              return (
                <div
                  key={field.id}
                  style={{ gridColumn: `span ${span}` }}
                >
                  <FieldRenderer
                    field={field}
                    value={value}
                    onChange={(v) => {
                      if (isDimensions && field.dimensionConfig) {
                        const next = v as {
                          length?: unknown
                          width?: unknown
                          height?: unknown
                        }
                        onChange(field.dimensionConfig.lengthId, next.length)
                        onChange(field.dimensionConfig.widthId, next.width)
                        onChange(field.dimensionConfig.heightId, next.height)
                        return
                      }
                      onChange(field.id, v)
                    }}
                    disabled={disabled}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/** 按 group 属性分组字段 */
function groupFields(
  fields: FieldDef[]
): { title?: string; fields: FieldDef[] }[] {
  const groups: { title?: string; fields: FieldDef[] }[] = []
  let currentGroup: { title?: string; fields: FieldDef[] } | undefined

  for (const field of fields) {
    const groupTitle = field.group
    if (!currentGroup || currentGroup.title !== groupTitle) {
      currentGroup = { title: groupTitle, fields: [] }
      groups.push(currentGroup)
    }
    currentGroup.fields.push(field)
  }

  return groups
}
