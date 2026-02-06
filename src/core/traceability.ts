/**
 * Traceability Engine (追溯引擎)
 *
 * 查询单据之间的追溯关系, 构建追溯链。
 */

import type {
  DocumentData,
  DocumentId,
  DocumentTypeId,
  TraceNode,
  SourceRef,
  DetailRowId,
} from "./types"

/** 追溯查询接口 —— 由 Store 实现 */
export interface TraceableStore {
  getDocument(docId: DocumentId): DocumentData | undefined
  getDocumentsBySourceDoc(sourceDocId: DocumentId): DocumentData[]
  getDocumentsByType(typeId: DocumentTypeId): DocumentData[]
}

/** 构建向下追溯树 (从源到下游) */
export function buildDownstreamTree(
  store: TraceableStore,
  docId: DocumentId
): TraceNode | undefined {
  const doc = store.getDocument(docId)
  if (!doc) return undefined

  const children = store.getDocumentsBySourceDoc(docId)
  const childNodes: TraceNode[] = children
    .map((child) => buildDownstreamTree(store, child.id))
    .filter((n): n is TraceNode => n !== undefined)

  return { document: doc, children: childNodes }
}

/** 构建向上追溯链 (从下游到源头) */
export function buildUpstreamChain(
  store: TraceableStore,
  docId: DocumentId
): DocumentData[] {
  const chain: DocumentData[] = []
  let currentId: DocumentId | undefined = docId

  while (currentId) {
    const doc = store.getDocument(currentId)
    if (!doc) break
    chain.push(doc)
    currentId = doc.sourceRef?.sourceDocId
  }

  return chain
}

/** 查找某个明细行的来源行 */
export function traceDetailRow(
  store: TraceableStore,
  sourceRef: SourceRef
): { document: DocumentData; row?: { tableId: string; rowId: DetailRowId; data: Record<string, unknown> } } | undefined {
  const doc = store.getDocument(sourceRef.sourceDocId)
  if (!doc) return undefined

  if (sourceRef.sourceDetailRowId && sourceRef.sourceDetailTableId) {
    const table = doc.detailTables.find(
      (t) => t.tableId === sourceRef.sourceDetailTableId
    )
    const row = table?.rows.find((r) => r.id === sourceRef.sourceDetailRowId)
    if (row) {
      return {
        document: doc,
        row: {
          tableId: sourceRef.sourceDetailTableId,
          rowId: row.id,
          data: row.data,
        },
      }
    }
  }

  return { document: doc }
}

/** 获取某个单据的所有下游单据 (扁平列表, 含间接下游) */
export function getAllDownstreamDocs(
  store: TraceableStore,
  docId: DocumentId
): DocumentData[] {
  const result: DocumentData[] = []
  const visited = new Set<DocumentId>()

  function collect(id: DocumentId) {
    if (visited.has(id)) return
    visited.add(id)
    const children = store.getDocumentsBySourceDoc(id)
    for (const child of children) {
      result.push(child)
      collect(child.id)
    }
  }

  collect(docId)
  return result
}
