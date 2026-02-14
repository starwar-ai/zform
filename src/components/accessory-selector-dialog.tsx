/**
 * Accessory Selector Dialog
 *
 * 辅料选择对话框，仅显示产品分类为「辅料」的标准产品。
 * 支持搜索、分类/品牌筛选、分页、单选/多选。
 */

import { useState, useEffect, useCallback } from "react"
import type { ColumnFilter } from "@/components/list-table/types"
import { fetchDocumentListApi } from "@/apis/document-api"
import { fetchCategoryListApi } from "@/apis/category-api"
import { fetchBrandsApi } from "@/apis/business-config-api"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { FilterSelect } from "@/components/ui/filter-select"
import { productStatusLabels } from "@/lib/product-status"
import { Search, Box, ChevronLeft, ChevronRight } from "lucide-react"

/** 辅料产品（标准产品中 skuType=AUXILIARY_MATERIALS） */
export interface AccessoryProduct {
  _id: string
  _docNumber: string
  name: string
  nameEn?: string
  barcode?: string
  unit: string
  categoryName?: string
  brandName?: string
  salePrice?: number
  companyPrice?: number
  status: string
}

interface AccessorySelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (accessories: AccessoryProduct[]) => void
  /** 是否多选，默认单选 */
  multiple?: boolean
  /** 已选辅料 ID 列表（用于回显） */
  selectedIds?: string[]
}

/** 辅料类型筛选值（固定，仅显示辅料） */
const SKU_TYPE_AUXILIARY = "AUXILIARY_MATERIALS"

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ACTIVE", label: "活跃" },
  { value: "INACTIVE", label: "停用" },
  { value: "DRAFT", label: "草稿" },
  { value: "DISCONTINUED", label: "停产" },
]

// ============================================================
// 子组件：产品卡片
// ============================================================

function ProductCard({
  product,
  selected,
  onToggle,
}: {
  product: AccessoryProduct
  selected: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`
        border rounded-lg p-3 cursor-pointer transition-colors
        ${selected ? "bg-primary/5 border-primary" : "hover:bg-muted/50"}
      `}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{product.name}</span>
                {product.nameEn && (
                  <span className="text-sm text-muted-foreground">
                    {product.nameEn}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>编码: {product._docNumber}</span>
                <span>•</span>
                <span>单位: {product.unit}</span>
                {product.barcode && (
                  <>
                    <span>•</span>
                    <span>条形码: {product.barcode}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              {product.salePrice != null && (
                <span className="text-sm font-medium">
                  ¥{product.salePrice}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              辅料
            </Badge>
            {product.categoryName && (
              <Badge variant="outline" className="text-xs">
                {product.categoryName}
              </Badge>
            )}
            {product.brandName && (
              <Badge variant="outline" className="text-xs">
                {product.brandName}
              </Badge>
            )}
            <Badge
              variant={product.status === "ACTIVE" ? "default" : "outline"}
              className="text-xs"
            >
              {productStatusLabels[product.status] ?? product.status}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 主组件
// ============================================================

export function AccessorySelectorDialog({
  open,
  onOpenChange,
  onConfirm,
  multiple = false,
  selectedIds = [],
}: AccessorySelectorDialogProps) {
  const [products, setProducts] = useState<AccessoryProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const debouncedSearch = useDebouncedValue(searchKeyword, 300)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(selectedIds)
  )
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])

  const [filterCategory, setFilterCategory] = useState<string>("")
  const [filterBrand, setFilterBrand] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("ACTIVE")

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)

  // 弹窗打开时同步 selectedIds
  useEffect(() => {
    if (open) {
      setSelectedProducts(new Set(selectedIds))
    }
  }, [open, selectedIds])

  useEffect(() => {
    if (open) {
      Promise.all([
        fetchCategoryListApi<{ id: string; name: string }>("product"),
        fetchBrandsApi(),
      ])
        .then(([categoriesData, brandsData]) => {
          setCategories(categoriesData)
          setBrands(brandsData)
        })
        .catch((err) => {
          console.error("加载分类和品牌失败:", err)
        })
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    setLoading(true)

    const filters: ColumnFilter[] = [
      { columnId: "skuType", operator: "eq", value: SKU_TYPE_AUXILIARY },
    ]

    if (filterCategory) {
      filters.push({ columnId: "categoryId", operator: "eq", value: filterCategory })
    }
    if (filterBrand) {
      filters.push({ columnId: "brandId", operator: "eq", value: filterBrand })
    }
    if (filterStatus) {
      filters.push({ columnId: "status", operator: "eq", value: filterStatus })
    }

    fetchDocumentListApi(
      "standard_product",
      {
        pagination: { pageIndex, pageSize },
        filters,
        sorting: [{ id: "createdAt", desc: true }],
      },
      "document",
      undefined,
      debouncedSearch
    )
      .then((result) => {
        setProducts(result.data as unknown as AccessoryProduct[])
        setTotal(result.total)
      })
      .catch((err) => {
        console.error("加载辅料列表失败:", err)
        setProducts([])
        setTotal(0)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [
    open,
    pageIndex,
    pageSize,
    debouncedSearch,
    filterCategory,
    filterBrand,
    filterStatus,
  ])

  const handleToggleProduct = useCallback(
    (productId: string) => {
      setSelectedProducts((prev) => {
        const next = new Set(prev)
        if (multiple) {
          if (next.has(productId)) next.delete(productId)
          else next.add(productId)
        } else {
          next.clear()
          next.add(productId)
        }
        return next
      })
    },
    [multiple]
  )

  const handleConfirm = useCallback(() => {
    const selected = products.filter((p) => selectedProducts.has(p._id))
    onConfirm(selected)
    onOpenChange(false)
  }, [products, selectedProducts, onConfirm, onOpenChange])

  const handleClearSelection = useCallback(() => {
    setSelectedProducts(new Set())
  }, [])

  const handleResetFilters = useCallback(() => {
    setSearchKeyword("")
    setFilterCategory("")
    setFilterBrand("")
    setFilterStatus("ACTIVE")
    setPageIndex(0)
  }, [])

  const resetPage = useCallback(() => setPageIndex(0), [])

  const totalPages = Math.ceil(total / pageSize)

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))
  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            选择辅料
          </DialogTitle>
          <DialogDescription>
            {multiple
              ? `已选择 ${selectedProducts.size} 个辅料`
              : "请选择一个辅料产品"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-b pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索辅料编码、名称、条形码..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                setPageIndex(0)
              }}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <FilterSelect
              value={filterCategory}
              onValueChange={(v) => {
                setFilterCategory(v)
                resetPage()
              }}
              options={categoryOptions}
              placeholder="产品分类"
              allLabel="全部分类"
            />
            <FilterSelect
              value={filterBrand}
              onValueChange={(v) => {
                setFilterBrand(v)
                resetPage()
              }}
              options={brandOptions}
              placeholder="品牌"
              allLabel="全部品牌"
            />
            <FilterSelect
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v)
                resetPage()
              }}
              options={STATUS_OPTIONS}
              placeholder="状态"
              allLabel="全部状态"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              重置筛选
            </Button>
            {multiple && selectedProducts.size > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearSelection}>
                清空选择 ({selectedProducts.size})
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <Box className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>未找到辅料产品</p>
                <p className="text-xs mt-1">请确保已创建 skuType 为辅料的标准产品</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  selected={selectedProducts.has(product._id)}
                  onToggle={() => handleToggleProduct(product._id)}
                />
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              共 {total} 个辅料，第 {pageIndex + 1} / {totalPages} 页
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPageIndex((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={pageIndex >= totalPages - 1}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedProducts.size > 0 && (
                <span>已选择 {selectedProducts.size} 个辅料</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedProducts.size === 0}
              >
                确定选择
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
