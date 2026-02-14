/**
 * StandardProductSelectorDialog
 *
 * 标准产品选择器包装组件，用于供应商报价明细表中选择产品。
 * 基于通用 ProductSelectorDialog，传入标准产品配置。
 */

import { ProductSelectorDialog, type ProductSelectorConfig } from "./product-selector-dialog"
import type { RowSelectorDialogProps } from "@/core/row-selector-registry"
import { Package } from "lucide-react"

/** 标准产品选择器配置（模块级常量） */
const STANDARD_PRODUCT_CONFIG: ProductSelectorConfig = {
  title: "选择产品",
  searchPlaceholder: "搜索产品编码、名称、条形码...",
  emptyMessage: "未找到产品",
  emptyHint: "请调整筛选条件或确保已创建产品数据",
  icon: Package,
  documentType: "standard_product",
  itemLabel: "产品",
  defaultStatusFilter: "ACTIVE",
}

export function StandardProductSelectorDialog({
  open,
  onOpenChange,
  onConfirm,
  multiple = false,
}: RowSelectorDialogProps) {
  return (
    <ProductSelectorDialog
      config={STANDARD_PRODUCT_CONFIG}
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      multiple={multiple}
    />
  )
}
