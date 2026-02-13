/**
 * 报价单产品选择器使用示例
 * 
 * 演示如何在报价单表单中集成产品选择对话框
 */

import { useState } from "react"
import { ProductSelectorDialog } from "./product-selector-dialog"
import { Button } from "./ui/button"
import { Plus, X } from "lucide-react"
import { Badge } from "./ui/badge"

interface QuotationItem {
  id: string
  lineNumber: number
  productCode: string
  productNameCn: string
  productNameEn?: string
  unitPrice: number
  quantity: number
  amount: number
  // ... 其他字段
}

/**
 * 报价单明细表组件示例
 */
export function QuotationItemsTable() {
  const [items, setItems] = useState<QuotationItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  // 处理产品选择
  const handleSelectProducts = (products: any[]) => {
    const newItems: QuotationItem[] = products.map((product, index) => ({
      id: `temp-${Date.now()}-${index}`,
      lineNumber: items.length + index + 1,
      productCode: product._docNumber,
      productNameCn: product.name,
      productNameEn: product.nameEn,
      unitPrice: product.salePrice || 0,
      quantity: 1,
      amount: product.salePrice || 0,
    }))

    setItems([...items, ...newItems])
  }

  // 删除明细行
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId))
  }

  // 更新数量
  const handleQuantityChange = (itemId: string, quantity: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          amount: item.unitPrice * quantity,
        }
      }
      return item
    }))
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">报价明细</h3>
        <Button
          onClick={() => setDialogOpen(true)}
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-1" />
          选择产品
        </Button>
      </div>

      {/* 明细表 */}
      {items.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          暂无产品，请点击"选择产品"按钮添加
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-left text-sm font-medium">行号</th>
                <th className="p-3 text-left text-sm font-medium">产品编码</th>
                <th className="p-3 text-left text-sm font-medium">产品名称</th>
                <th className="p-3 text-right text-sm font-medium">单价</th>
                <th className="p-3 text-right text-sm font-medium">数量</th>
                <th className="p-3 text-right text-sm font-medium">金额</th>
                <th className="p-3 text-center text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 text-sm">{item.lineNumber}</td>
                  <td className="p-3 text-sm font-mono">{item.productCode}</td>
                  <td className="p-3 text-sm">
                    <div>
                      <div>{item.productNameCn}</div>
                      {item.productNameEn && (
                        <div className="text-xs text-muted-foreground">
                          {item.productNameEn}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-right">
                    ¥{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="p-3 text-sm text-right">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                      }
                      className="w-20 px-2 py-1 border rounded text-right"
                    />
                  </td>
                  <td className="p-3 text-sm text-right font-medium">
                    ¥{item.amount.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/50 border-t">
              <tr>
                <td colSpan={5} className="p-3 text-sm text-right font-medium">
                  合计：
                </td>
                <td className="p-3 text-sm text-right font-bold">
                  ¥{items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* 产品选择对话框 */}
      <ProductSelectorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleSelectProducts}
        multiple={true}
        productType="STANDARD"
      />
    </div>
  )
}

/**
 * 在 document-form.tsx 中集成示例
 * 
 * ```tsx
 * // 在报价单表单的明细表部分
 * {detailTable.id === "items" && (
 *   <div className="mt-4">
 *     <ProductSelectorButton 
 *       onSelect={(products) => {
 *         products.forEach(product => {
 *           addDetailRow(detailTable.id, {
 *             productCode: product._docNumber,
 *             productNameCn: product.name,
 *             productNameEn: product.nameEn,
 *             unitPrice: product.salePrice,
 *             // ... 其他字段映射
 *           })
 *         })
 *       }}
 *     />
 *   </div>
 * )}
 * ```
 */

/**
 * 简化版：只有按钮的组件
 */
interface ProductSelectorButtonProps {
  onSelect: (products: any[]) => void
  multiple?: boolean
  productType?: "STANDARD" | "CUSTOMER" | "SELF_OWNED"
  buttonText?: string
}

export function ProductSelectorButton({
  onSelect,
  multiple = true,
  productType,
  buttonText = "选择产品",
}: ProductSelectorButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4 mr-1" />
        {buttonText}
      </Button>

      <ProductSelectorDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={(products) => {
          onSelect(products)
          setOpen(false)
        }}
        multiple={multiple}
        productType={productType}
      />
    </>
  )
}
