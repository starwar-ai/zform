/**
 * AddRowSelectorAdapter
 *
 * 根据 DetailTableDef.addRowSelector 配置，从注册中心获取选择器组件并渲染。
 * 将选择器返回的原始数据通过 mapToRowData 转换为行数据后交给 onConfirm。
 */

import type { DetailTableDef } from "@/core/types"
import { getRowSelector } from "@/core/row-selector-registry"

export interface AddSelectorRenderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (rowDataList: Record<string, unknown>[]) => void
}

interface AddRowSelectorAdapterProps extends AddSelectorRenderProps {
  tableDef: DetailTableDef
}

/**
 * 根据 tableDef.addRowSelector 渲染对应的选择器对话框。
 * 无配置或未注册对应类型时返回 null。
 */
export function AddRowSelectorAdapter({
  tableDef,
  open,
  onOpenChange,
  onConfirm,
}: AddRowSelectorAdapterProps) {
  const config = tableDef.addRowSelector
  if (!config) return null

  const SelectorComp = getRowSelector(config.type)
  if (!SelectorComp) return null

  return (
    <SelectorComp
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={(items) => onConfirm(items.map(config.mapToRowData))}
      multiple={config.multiple ?? true}
    />
  )
}
