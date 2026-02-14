/**
 * Accessory Selector Dialog
 *
 * 辅料选择对话框 — 基于通用 ProductSelectorDialog，
 * 仅配置 skuType=AUXILIARY_MATERIALS 固定筛选条件。
 */

import {
  ProductSelectorDialog,
  type ProductSelectorConfig,
} from "./product-selector-dialog"
import type { RowSelectorDialogProps } from "@/core/row-selector-registry"

/** 辅料选择器配置 */
const accessoryConfig: ProductSelectorConfig = {
  title: "选择辅料",
  fixedFilters: [
    { columnId: "skuType", operator: "eq", value: "AUXILIARY_MATERIALS" },
  ],
  searchPlaceholder: "搜索辅料编码、名称、条形码...",
  emptyMessage: "未找到辅料产品",
  emptyHint: "请确保已创建 skuType 为辅料的标准产品",
  typeBadgeLabel: "辅料",
  itemLabel: "辅料",
}

/**
 * 辅料选择对话框
 *
 * 基于通用产品选择器，仅显示产品分类为「辅料」的标准产品。
 * 支持搜索、分类/品牌筛选、分页、单选/多选。
 */
export function AccessorySelectorDialog(props: RowSelectorDialogProps) {
  return <ProductSelectorDialog config={accessoryConfig} {...props} />
}
