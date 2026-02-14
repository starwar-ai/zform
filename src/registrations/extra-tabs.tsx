/**
 * Extra Tab Registrations
 *
 * 注册表单额外 Tab 的渲染器。
 * 在应用启动时执行，新增 Tab 时在此添加注册即可。
 */

import { ProductImageUpload } from "@/components/product-image-upload"
import { registerExtraTab } from "@/lib/extra-tab-registry"

export function registerExtraTabs(): void {
  registerExtraTab("product_images", "产品图片", ({ docId, isEditable, isNew }) => (
    <ProductImageUpload
      productId={isNew ? null : docId}
      disabled={!isEditable}
    />
  ))
}
