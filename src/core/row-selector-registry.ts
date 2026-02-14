/**
 * Row Selector Registry
 *
 * 明细表「添加行」选择器组件注册中心。
 * Schema 中 addRowSelector.type 与此处注册的 key 对应，
 * 新增选择器类型时在此注册即可，无需修改 DocumentForm。
 */

import type { ComponentType } from "react"

/** 选择器对话框的通用 props（由各选择器组件实现） */
export interface RowSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (items: Record<string, unknown>[]) => void
  multiple?: boolean
}

const registry = new Map<string, ComponentType<RowSelectorDialogProps>>()

/** 注册选择器组件 */
export function registerRowSelector(
  type: string,
  component: ComponentType<RowSelectorDialogProps>
): void {
  if (registry.has(type)) {
    console.warn(`[RowSelectorRegistry] "${type}" already registered, overwriting.`)
  }
  registry.set(type, component)
}

/** 获取选择器组件 */
export function getRowSelector(type: string): ComponentType<RowSelectorDialogProps> | undefined {
  return registry.get(type)
}
