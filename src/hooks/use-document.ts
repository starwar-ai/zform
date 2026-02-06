/**
 * Document Hooks
 *
 * React hooks for working with documents.
 */

import { useCallback, useMemo } from "react"
import { useDocumentStore, getTraceableStore } from "@/stores/document-store"
import { registry } from "@/core/registry"
import { pushDown } from "@/core/push-down"
import { assessImpact } from "@/core/impact"
import {
  buildUpstreamChain,
  getAllDownstreamDocs,
} from "@/core/traceability"
import type {
  DocumentData,
  DocumentId,
  DocumentTypeId,
  ImpactAssessment,
  PushDownRule,
} from "@/core/types"

/** 使用单据数据 */
export function useDocument(docId: DocumentId) {
  const doc = useDocumentStore((s) => s.documents[docId])
  const schema = doc ? registry.getSchema(doc.typeId) : undefined
  return { doc, schema }
}

/** 使用某类型的所有单据 */
export function useDocumentsByType(typeId: DocumentTypeId) {
  const documents = useDocumentStore((s) =>
    Object.values(s.documents).filter((d) => d.typeId === typeId)
  )
  return documents
}

/** 使用所有单据 */
export function useAllDocuments() {
  const documents = useDocumentStore((s) => Object.values(s.documents))
  return documents
}

/** 使用下推功能 */
export function usePushDown() {
  const addDocument = useDocumentStore((s) => s.addDocument)

  const getAvailableRules = useCallback(
    (sourceTypeId: DocumentTypeId): PushDownRule[] => {
      return registry.getPushDownRules(sourceTypeId)
    },
    []
  )

  const executePushDown = useCallback(
    (sourceDoc: DocumentData, rule: PushDownRule): DocumentData => {
      const newDoc = pushDown(sourceDoc, rule)
      addDocument(newDoc)
      return newDoc
    },
    [addDocument]
  )

  return { getAvailableRules, executePushDown }
}

/** 使用变更影响评估 */
export function useImpactAssessment() {
  const evaluate = useCallback(
    (oldDoc: DocumentData, newDoc: DocumentData): ImpactAssessment => {
      const store = getTraceableStore()
      return assessImpact(store, oldDoc, newDoc)
    },
    []
  )

  return { evaluate }
}

/** 使用追溯 */
export function useTraceability(docId: DocumentId) {
  const doc = useDocumentStore((s) => s.documents[docId])
  const allDocs = useDocumentStore((s) => s.documents)

  const upstream = useMemo(() => {
    if (!doc) return []
    const store = getTraceableStore()
    return buildUpstreamChain(store, docId).slice(1) // 排除自身
  }, [doc, docId, allDocs])

  const downstream = useMemo(() => {
    if (!doc) return []
    const store = getTraceableStore()
    return getAllDownstreamDocs(store, docId)
  }, [doc, docId, allDocs])

  return { upstream, downstream }
}
