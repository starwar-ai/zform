/**
 * MasterForm
 *
 * 渲染单据的主数据表单, 根据 Schema 动态生成字段。
 * 支持字段分组、栅格布局。
 */

import type { FieldDef } from "@/core/types"
import { FieldRenderer } from "./field-renderer"

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
  // 按 group 分组
  const groups = groupFields(fields)

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.title ?? "__default"}>
          {group.title && (
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 border-b pb-2">
              {group.title}
            </h3>
          )}
          <div className="grid grid-cols-4 gap-4">
            {group.fields.map((field) => {
              // 计算值 (computed 字段)
              const value =
                field.type === "computed" && field.compute
                  ? field.compute(data)
                  : data[field.id]

              return (
                <div
                  key={field.id}
                  className={`col-span-${field.span ?? 1}`}
                  style={{ gridColumn: `span ${field.span ?? 1}` }}
                >
                  <FieldRenderer
                    field={field}
                    value={value}
                    onChange={(v) => onChange(field.id, v)}
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
