/**
 * Push-Down Engine (下推引擎)
 *
 * 根据下推规则, 从上游单据生成下游单据。
 * 自动建立追溯关系 (SourceRef)。
 */

import { nanoid } from "nanoid"
import type {
  DocumentData,
  PushDownRule,
  DetailRow,
  DetailTableData,
  SourceRef,
} from "./types"
import { registry } from "./registry"

/** 从源字段路径获取值 */
function getFieldValue(
  doc: DocumentData,
  fieldPath: string
): unknown {
  // "master.fieldName" -> masterData[fieldName]
  if (fieldPath.startsWith("master.")) {
    const fieldId = fieldPath.slice(7)
    return doc.masterData[fieldId]
  }
  // "detail.tableId.fieldName" -> 不适用于主数据映射
  return undefined
}

/** 执行下推, 生成新单据 */
export function pushDown(
  sourceDoc: DocumentData,
  rule: PushDownRule
): DocumentData {
  const targetSchema = registry.getSchema(rule.targetTypeId)
  if (!targetSchema) {
    throw new Error(`Target schema "${rule.targetTypeId}" not found in registry.`)
  }

  const now = new Date().toISOString()
  const docId = nanoid()

  // 1. 映射主数据
  const masterData: Record<string, unknown> = {}

  // 先填充默认值
  for (const field of targetSchema.masterFields) {
    if (field.defaultValue !== undefined) {
      masterData[field.id] = field.defaultValue
    }
  }

  // 然后应用映射
  for (const mapping of rule.masterFieldMappings) {
    const value = getFieldValue(sourceDoc, mapping.sourceField)
    const finalValue = mapping.transform
      ? mapping.transform(value, sourceDoc)
      : value
    masterData[mapping.targetField] = finalValue
  }

  // 2. 映射明细数据
  const detailTables: DetailTableData[] = []

  for (const detailMapping of rule.detailMappings) {
    const sourceTable = sourceDoc.detailTables.find(
      (t) => t.tableId === detailMapping.sourceTableId
    )
    if (!sourceTable) continue

    const rows: DetailRow[] = []
    const sourceRows = detailMapping.rowFilter
      ? sourceTable.rows.filter(detailMapping.rowFilter)
      : sourceTable.rows

    for (const sourceRow of sourceRows) {
      const rowData: Record<string, unknown> = {}

      for (const fm of detailMapping.fieldMappings) {
        const value = sourceRow.data[fm.sourceField]
        rowData[fm.targetField] = fm.transform
          ? fm.transform(value, sourceDoc)
          : value
      }

      // 建立行级追溯
      const sourceRef: SourceRef = {
        sourceTypeId: sourceDoc.typeId,
        sourceDocId: sourceDoc.id,
        sourceDetailRowId: sourceRow.id,
        sourceDetailTableId: detailMapping.sourceTableId,
      }

      rows.push({
        id: nanoid(),
        data: rowData,
        sourceRef,
      })
    }

    detailTables.push({
      tableId: detailMapping.targetTableId,
      rows,
    })
  }

  // 确保目标 schema 中定义的所有明细表都有对应数据
  for (const tableDef of targetSchema.detailTables) {
    if (!detailTables.find((t) => t.tableId === tableDef.id)) {
      detailTables.push({ tableId: tableDef.id, rows: [] })
    }
  }

  // 3. 组装新单据
  const newDoc: DocumentData = {
    id: docId,
    typeId: rule.targetTypeId,
    docNumber: "", // 由业务层生成编号
    masterData,
    detailTables,
    status: "draft",
    sourceRef: {
      sourceTypeId: sourceDoc.typeId,
      sourceDocId: sourceDoc.id,
    },
    createdAt: now,
    updatedAt: now,
  }

  return newDoc
}

/** 批量下推: 一个源单据按照所有可用规则生成多个下游单据 */
export function pushDownAll(
  sourceDoc: DocumentData
): { rule: PushDownRule; document: DocumentData }[] {
  const rules = registry.getPushDownRules(sourceDoc.typeId)
  return rules.map((rule) => ({
    rule,
    document: pushDown(sourceDoc, rule),
  }))
}
