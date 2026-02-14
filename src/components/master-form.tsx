/**
 * MasterForm
 *
 * 渲染单据的主数据表单, 根据 Schema 动态生成字段。
 * 支持字段分组、栅格布局，列数根据容器宽度自适应。
 *
 * 字段副作用（如编号生成）通过 FieldDef.effect 声明式驱动，
 * 本组件不包含任何特定业务逻辑。
 */

import { useState, useEffect, useRef, useMemo } from "react"
import type { FieldDef, FormMode } from "@/core/types"
import { FieldRenderer } from "./field-renderer"
import { useFieldEffects } from "@/hooks/use-field-effects"

/** 每列最小宽度（px），用于计算列数 */
const COL_MIN_WIDTH = 240

interface MasterFormProps {
  fields: FieldDef[]
  data: Record<string, unknown>
  onChange: (fieldId: string, value: unknown) => void
  disabled?: boolean
  /** 当前表单模式（控制 FieldEffect 是否生效） */
  mode?: FormMode
}

export function MasterForm({
  fields,
  data,
  onChange,
  disabled,
  mode,
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

  // 通用字段副作用：检测 fields 中声明了 effect 的字段，按需触发
  useFieldEffects({ fields, data, onChange, mode })

  // 按 group 分组，过滤隐藏字段及不满足 visibleWhen 的字段
  const groups = useMemo(() => {
    const visibleFields = fields.filter(
      (f) =>
        !f.hidden &&
        (!f.visibleWhen || f.visibleWhen(data))
    )
    return groupFields(visibleFields)
  }, [fields, data])

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
                    length: data[field.dimensionConfig!.lengthId],
                    width: data[field.dimensionConfig!.widthId],
                    height: data[field.dimensionConfig!.heightId],
                  }
                : field.type === "computed" && field.compute
                  ? field.compute(data)
                  : data[field.id]

              const span = Math.min(field.span ?? 1, cols)
              const isSkuCode = field.type === "skuCode" && field.skuCodeConfig
              const fieldReadOnly =
                field.readOnly ||
                (mode && field.readOnlyModes?.includes(mode)) ||
                false

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
                        onChange(field.dimensionConfig!.lengthId, next.length)
                        onChange(field.dimensionConfig!.widthId, next.width)
                        onChange(field.dimensionConfig!.heightId, next.height)
                        return
                      }
                      onChange(field.id, v)
                    }}
                    data={isSkuCode ? data : undefined}
                    onBatchChange={isSkuCode ? onChange : undefined}
                    disabled={disabled}
                    fieldReadOnly={fieldReadOnly}
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

/** 按 group 属性分组字段（同 group 的字段会合并到同一分组，与 schema 中顺序无关） */
function groupFields(
  fields: FieldDef[]
): { title?: string; fields: FieldDef[] }[] {
  const groupMap = new Map<string | undefined, FieldDef[]>()
  const groupOrder: (string | undefined)[] = []

  for (const field of fields) {
    const groupTitle = field.group
    if (!groupMap.has(groupTitle)) {
      groupMap.set(groupTitle, [])
      groupOrder.push(groupTitle)
    }
    groupMap.get(groupTitle)!.push(field)
  }

  return groupOrder.map((title) => ({
    title,
    fields: groupMap.get(title)!,
  }))
}
