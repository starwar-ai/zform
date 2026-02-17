/**
 * Document Store (Zustand)
 *
 * 管理所有单据数据的全局 Store。
 * 实现 TraceableStore 接口供追溯引擎使用。
 */

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { nanoid } from "nanoid"
import type {
  DocumentData,
  DocumentId,
  DocumentTypeId,
  DocumentStatus,
  DetailRow,
  DetailTableData,
} from "@/core/types"
import type { TraceableStore } from "@/core/traceability"
import { registry } from "@/core/registry"

interface DocumentStoreState {
  /** 所有单据, 按 ID 索引 */
  documents: Record<DocumentId, DocumentData>

  /** 创建新单据 */
  createDocument: (typeId: DocumentTypeId) => DocumentData
  /** 保存/更新单据 */
  saveDocument: (doc: DocumentData) => void
  /** 添加已生成的单据 (下推时用) */
  addDocument: (doc: DocumentData) => void
  /** 删除单据 */
  deleteDocument: (docId: DocumentId) => void
  /** 更新单据状态 */
  updateStatus: (docId: DocumentId, status: DocumentStatus) => void
  /** 更新主数据字段 */
  updateMasterField: (docId: DocumentId, fieldId: string, value: unknown) => void
  /** 添加明细行 */
  addDetailRow: (docId: DocumentId, tableId: string, rowData?: Record<string, unknown>) => void
  /** 更新明细行 */
  updateDetailRow: (docId: DocumentId, tableId: string, rowId: string, fieldId: string, value: unknown) => void
  /** 删除明细行 */
  deleteDetailRow: (docId: DocumentId, tableId: string, rowId: string) => void
  /** 清空明细表所有行 */
  clearDetailTable: (docId: DocumentId, tableId: string) => void
  /** 重排明细行顺序 */
  reorderDetailRows: (docId: DocumentId, tableId: string, orderedRowIds: string[]) => void

  // TraceableStore 接口方法
  getDocument: (docId: DocumentId) => DocumentData | undefined
  getDocumentsBySourceDoc: (sourceDocId: DocumentId) => DocumentData[]
  getDocumentsByType: (typeId: DocumentTypeId) => DocumentData[]
}

/** 生成单据编号 */
function generateDocNumber(typeId: DocumentTypeId): string {
  const prefix = typeId.toUpperCase().slice(0, 3)
  const timestamp = Date.now().toString(36).toUpperCase()
  return `${prefix}-${timestamp}`
}

export const useDocumentStore = create<DocumentStoreState>()(
  immer((set, get) => ({
    documents: {},

    createDocument: (typeId) => {
      const schema = registry.getSchema(typeId)
      if (!schema) throw new Error(`Schema not found: ${typeId}`)

      const now = new Date().toISOString()
      const masterData: Record<string, unknown> = {}

      // 填充默认值
      for (const field of schema.masterFields) {
        if (field.defaultValue !== undefined) {
          masterData[field.id] = field.defaultValue
        }
      }

      const detailTables: DetailTableData[] = schema.detailTables.map((t) => ({
        tableId: t.id,
        rows: [],
      }))

      const doc: DocumentData = {
        id: nanoid(),
        typeId,
        docNumber: generateDocNumber(typeId),
        masterData,
        detailTables,
        status: "draft",
        createdAt: now,
        updatedAt: now,
        _isNew: true,
      }

      set((state) => {
        state.documents[doc.id] = doc
      })

      return doc
    },

    saveDocument: (doc) => {
      set((state) => {
        state.documents[doc.id] = { ...doc, updatedAt: new Date().toISOString() }
      })
    },

    addDocument: (doc) => {
      set((state) => {
        state.documents[doc.id] = doc
      })
    },

    deleteDocument: (docId) => {
      set((state) => {
        delete state.documents[docId]
      })
    },

    updateStatus: (docId, status) => {
      set((state) => {
        const doc = state.documents[docId]
        if (doc) {
          doc.status = status
          doc.updatedAt = new Date().toISOString()
        }
      })
    },

    updateMasterField: (docId, fieldId, value) => {
      set((state) => {
        const doc = state.documents[docId]
        if (doc) {
          doc.masterData[fieldId] = value
          doc.updatedAt = new Date().toISOString()
        }
      })
    },

    addDetailRow: (docId, tableId, rowData) => {
      set((state) => {
        const doc = state.documents[docId]
        if (!doc) return
        const table = doc.detailTables.find((t) => t.tableId === tableId)
        if (!table) return

        const row: DetailRow = {
          id: nanoid(),
          data: rowData ?? {},
        }
        table.rows.push(row)
        doc.updatedAt = new Date().toISOString()
      })
    },

    updateDetailRow: (docId, tableId, rowId, fieldId, value) => {
      set((state) => {
        const doc = state.documents[docId]
        if (!doc) return
        const table = doc.detailTables.find((t) => t.tableId === tableId)
        if (!table) return
        const row = table.rows.find((r) => r.id === rowId)
        if (!row) return
        row.data[fieldId] = value
        doc.updatedAt = new Date().toISOString()
      })
    },

    deleteDetailRow: (docId, tableId, rowId) => {
      set((state) => {
        const doc = state.documents[docId]
        if (!doc) return
        const table = doc.detailTables.find((t) => t.tableId === tableId)
        if (!table) return
        table.rows = table.rows.filter((r) => r.id !== rowId)
        doc.updatedAt = new Date().toISOString()
      })
    },

    clearDetailTable: (docId, tableId) => {
      set((state) => {
        const doc = state.documents[docId]
        if (!doc) return
        const table = doc.detailTables.find((t) => t.tableId === tableId)
        if (table) {
          table.rows = []
          doc.updatedAt = new Date().toISOString()
        }
      })
    },

    reorderDetailRows: (docId, tableId, orderedRowIds) => {
      set((state) => {
        const doc = state.documents[docId]
        if (!doc) return
        const table = doc.detailTables.find((t) => t.tableId === tableId)
        if (!table) return
        const rowMap = new Map(table.rows.map((r) => [r.id, r]))
        table.rows = orderedRowIds
          .map((id) => rowMap.get(id))
          .filter((r): r is DetailRow => r !== undefined)
        doc.updatedAt = new Date().toISOString()
      })
    },

    getDocument: (docId) => {
      return get().documents[docId]
    },

    getDocumentsBySourceDoc: (sourceDocId) => {
      return Object.values(get().documents).filter(
        (d) => d.sourceRef?.sourceDocId === sourceDocId
      )
    },

    getDocumentsByType: (typeId) => {
      return Object.values(get().documents).filter((d) => d.typeId === typeId)
    },
  }))
)

/** 获取 TraceableStore 适配器 */
export function getTraceableStore(): TraceableStore {
  const store = useDocumentStore.getState()
  return {
    getDocument: store.getDocument,
    getDocumentsBySourceDoc: store.getDocumentsBySourceDoc,
    getDocumentsByType: store.getDocumentsByType,
  }
}
