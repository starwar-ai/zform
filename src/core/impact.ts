/**
 * Change Impact Assessment Engine (变更影响评估引擎)
 *
 * 当单据字段发生变更时, 评估对下游单据的影响。
 * 只有通过影响评估, 才允许保存变更。
 */

import type {
  DocumentData,
  ImpactAssessment,
  ImpactItem,
  DocumentTypeId,
} from "./types"
import { registry } from "./registry"
import type { TraceableStore } from "./traceability"
import { getAllDownstreamDocs } from "./traceability"

/** 评估单据变更的影响 */
export function assessImpact(
  store: TraceableStore,
  oldDoc: DocumentData,
  newDoc: DocumentData
): ImpactAssessment {
  const impacts: ImpactItem[] = []

  // 1. 获取适用的变更规则
  const rules = registry.getChangeRules(oldDoc.typeId)

  // 2. 获取所有下游单据
  const downstreamDocs = getAllDownstreamDocs(store, oldDoc.id)

  // 3. 执行每条变更规则
  for (const rule of rules) {
    // 检查监控字段是否有变化
    const hasChange = rule.watchFields.some((fieldPath) => {
      const oldVal = getNestedValue(oldDoc, fieldPath)
      const newVal = getNestedValue(newDoc, fieldPath)
      return JSON.stringify(oldVal) !== JSON.stringify(newVal)
    })

    if (hasChange) {
      const ruleImpacts = rule.evaluate(oldDoc, newDoc, downstreamDocs)
      impacts.push(...ruleImpacts)
    }
  }

  // 4. 自动检测: 如果有下游单据且状态非草稿, 发出警告
  if (downstreamDocs.length > 0) {
    const nonDraftDownstream = downstreamDocs.filter((d) => d.status !== "DRAFT")

    // 检查主数据变更
    const changedMasterFields = findChangedFields(
      oldDoc.masterData,
      newDoc.masterData
    )

    for (const field of changedMasterFields) {
      for (const downstream of nonDraftDownstream) {
        // 检查该字段是否有下推映射到下游
        if (isFieldMapped(oldDoc.typeId, downstream.typeId, `master.${field}`)) {
          const existingImpact = impacts.find(
            (i) => i.affectedDocId === downstream.id && i.affectedField === field
          )
          if (!existingImpact) {
            impacts.push({
              level: "warning",
              affectedDocId: downstream.id,
              affectedTypeId: downstream.typeId,
              affectedDocNumber: downstream.docNumber,
              affectedField: field,
              description: `字段「${field}」的变更可能影响下游单据 ${downstream.docNumber}`,
            })
          }
        }
      }
    }

    // 检查明细行删除
    for (const oldTable of oldDoc.detailTables) {
      const newTable = newDoc.detailTables.find((t) => t.tableId === oldTable.tableId)
      if (!newTable) continue

      const deletedRowIds = oldTable.rows
        .filter((r) => !newTable.rows.find((nr) => nr.id === r.id))
        .map((r) => r.id)

      for (const rowId of deletedRowIds) {
        // 查找引用了该行的下游
        for (const downstream of downstreamDocs) {
          for (const dt of downstream.detailTables) {
            const affectedRows = dt.rows.filter(
              (r) =>
                r.sourceRef?.sourceDocId === oldDoc.id &&
                r.sourceRef?.sourceDetailRowId === rowId
            )
            for (const affectedRow of affectedRows) {
              impacts.push({
                level: "critical",
                affectedDocId: downstream.id,
                affectedTypeId: downstream.typeId,
                affectedDocNumber: downstream.docNumber,
                affectedField: `${dt.tableId}.row[${affectedRow.id}]`,
                description: `删除明细行将导致下游单据 ${downstream.docNumber} 中的关联明细行失去来源`,
              })
            }
          }
        }
      }
    }
  }

  // 5. 判断是否允许继续
  const hasCritical = impacts.some((i) => i.level === "critical")
  const summary = generateSummary(impacts, downstreamDocs.length)

  return {
    canProceed: !hasCritical,
    impacts,
    summary,
  }
}

/** 从嵌套路径获取值 */
function getNestedValue(doc: DocumentData, fieldPath: string): unknown {
  if (fieldPath.startsWith("master.")) {
    return doc.masterData[fieldPath.slice(7)]
  }
  if (fieldPath.startsWith("detail.")) {
    const parts = fieldPath.split(".")
    const tableId = parts[1]
    const fieldId = parts[2]
    const table = doc.detailTables.find((t) => t.tableId === tableId)
    return table?.rows.map((r) => r.data[fieldId])
  }
  return undefined
}

/** 找出两个对象之间变更的字段 */
function findChangedFields(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): string[] {
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
  const changed: string[] = []
  for (const key of allKeys) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changed.push(key)
    }
  }
  return changed
}

/** 检查某个字段是否有下推映射 */
function isFieldMapped(
  sourceTypeId: DocumentTypeId,
  targetTypeId: DocumentTypeId,
  fieldPath: string
): boolean {
  const rules = registry.getPushDownRules(sourceTypeId)
  for (const rule of rules) {
    if (rule.targetTypeId !== targetTypeId) continue
    // 检查主数据映射
    for (const mapping of rule.masterFieldMappings) {
      if (mapping.sourceField === fieldPath) return true
    }
    // 检查明细映射
    for (const dm of rule.detailMappings) {
      for (const fm of dm.fieldMappings) {
        if (fm.sourceField === fieldPath.replace("detail.", "")) return true
      }
    }
  }
  return false
}

/** 生成影响评估汇总 */
function generateSummary(impacts: ImpactItem[], downstreamCount: number): string {
  if (impacts.length === 0) {
    return downstreamCount > 0
      ? `有 ${downstreamCount} 个下游单据, 但本次变更不影响它们。`
      : "无下游单据, 可以安全变更。"
  }

  const critical = impacts.filter((i) => i.level === "critical").length
  const warning = impacts.filter((i) => i.level === "warning").length
  const info = impacts.filter((i) => i.level === "info").length

  const parts: string[] = []
  if (critical > 0) parts.push(`${critical} 个严重影响`)
  if (warning > 0) parts.push(`${warning} 个警告`)
  if (info > 0) parts.push(`${info} 个提示`)

  const prefix = critical > 0 ? "变更被阻止: " : "请注意: "
  return `${prefix}${parts.join(", ")}。`
}
