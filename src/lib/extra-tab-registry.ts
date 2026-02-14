/**
 * Extra Tab Registry
 *
 * 表单额外 Tab 的渲染器注册中心。
 * Schema 中 extraTabKeys 与此处注册的 key 对应，
 * 新增 Tab 类型时在此注册即可，无需修改 DocumentForm。
 */

import type { ReactNode } from "react"
import type { DocumentData } from "@/core/types"

export interface ExtraTabRenderProps {
  docId: string
  doc: DocumentData
  isEditable: boolean
  isNew: boolean
}

export type ExtraTabRenderer = (props: ExtraTabRenderProps) => ReactNode

const registry = new Map<string, { label: string; render: ExtraTabRenderer }>()

/** 注册额外 Tab */
export function registerExtraTab(
  key: string,
  label: string,
  render: ExtraTabRenderer
): void {
  if (registry.has(key)) {
    console.warn(`[ExtraTabRegistry] "${key}" already registered, overwriting.`)
  }
  registry.set(key, { label, render })
}

/** 获取额外 Tab 的配置 */
export function getExtraTab(key: string): { label: string; render: ExtraTabRenderer } | undefined {
  return registry.get(key)
}
