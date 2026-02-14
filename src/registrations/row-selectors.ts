/**
 * Row Selector Registrations
 *
 * 注册明细表「添加行」选择器组件。
 * 在应用启动时执行，新增选择器时在此添加注册即可。
 */

import { AccessorySelectorDialog } from "@/components/accessory-selector-dialog"
import { SupplierSelectorDialog } from "@/components/supplier-selector-dialog"
import { registerRowSelector } from "@/core/row-selector-registry"

export function registerRowSelectors(): void {
  registerRowSelector("accessory", AccessorySelectorDialog)
  registerRowSelector("supplier", SupplierSelectorDialog)
}
