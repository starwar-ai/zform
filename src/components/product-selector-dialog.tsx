/**
 * Product Selector Dialog
 * 
 * 产品选择对话框，支持：
 * - 搜索产品（编码、名称、条形码）
 * - 产品类型筛选（标准/客户/自营）
 * - 产品分类筛选
 * - 品牌筛选
 * - 分页加载
 * - 多选/单选模式
 */

import { useState, useEffect, useMemo } from "react"
import { fetchDocumentListApi } from "@/apis/document-api"
import { fetchCategoryListApi } from "@/apis/category-api"
import { fetchBrandsApi } from "@/apis/business-config-api"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Package, ChevronLeft, ChevronRight, X } from "lucide-react"

interface Product {
  _id: string
  _docNumber: string // code
  name: string
  nameEn?: string
  barcode?: string
  productType: "STANDARD" | "CUSTOMER" | "SELF_OWNED"
  unit: string
  categoryName?: string
  brandName?: string
  salePrice?: number
  companyPrice?: number
  status: string
  thumbnail?: string
}

interface ProductSelectorDialogProps {
  /** 是否打开对话框 */
  open: boolean
  /** 关闭对话框回调 */
  onOpenChange: (open: boolean) => void
  /** 确认选择回调 */
  onConfirm: (products: Product[]) => void
  /** 是否多选模式 */
  multiple?: boolean
  /** 产品类型过滤 */
  productType?: "STANDARD" | "CUSTOMER" | "SELF_OWNED"
  /** 已选产品ID列表（用于回显选中状态） */
  selectedIds?: string[]
}

const productTypeLabels = {
  STANDARD: "标准产品",
  CUSTOMER: "客户产品",
  SELF_OWNED: "自营产品",
}

const statusLabels = {
  ACTIVE: "活跃",
  INACTIVE: "停用",
  DRAFT: "草稿",
  DISCONTINUED: "停产",
}

export function ProductSelectorDialog({
  open,
  onOpenChange,
  onConfirm,
  multiple = true,
  productType,
  selectedIds = [],
}: ProductSelectorDialogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(selectedIds)
  )
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  
  // 筛选条件
  const [filterProductType, setFilterProductType] = useState<string>(productType || "")
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [filterBrand, setFilterBrand] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("ACTIVE")
  
  // 分页
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)

  // 加载产品分类和品牌
  useEffect(() => {
    if (open) {
      Promise.all([
        fetchCategoryListApi("product"),
        fetchBrandsApi(),
      ]).then(([categoriesData, brandsData]) => {
        setCategories(categoriesData)
        setBrands(brandsData)
      }).catch(err => {
        console.error("加载分类和品牌失败:", err)
      })
    }
  }, [open])

  // 加载产品列表
  useEffect(() => {
    if (!open) return

    setLoading(true)
    
    // 构建筛选条件
    const filters: any[] = []
    
    if (filterProductType) {
      filters.push({
        columnId: "productType",
        operator: "eq",
        value: filterProductType,
      })
    }
    
    if (filterCategory) {
      filters.push({
        columnId: "categoryId",
        operator: "eq",
        value: filterCategory,
      })
    }
    
    if (filterBrand) {
      filters.push({
        columnId: "brandId",
        operator: "eq",
        value: filterBrand,
      })
    }
    
    if (filterStatus) {
      filters.push({
        columnId: "status",
        operator: "eq",
        value: filterStatus,
      })
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
      searchKeyword
    )
      .then((result) => {
        setProducts(result.data as unknown as Product[])
        setTotal(result.total)
      })
      .catch((err) => {
        console.error("加载产品失败:", err)
        setProducts([])
        setTotal(0)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [open, pageIndex, pageSize, searchKeyword, filterProductType, filterCategory, filterBrand, filterStatus])

  // 处理产品选择
  const handleToggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    
    if (multiple) {
      if (newSelected.has(productId)) {
        newSelected.delete(productId)
      } else {
        newSelected.add(productId)
      }
    } else {
      newSelected.clear()
      newSelected.add(productId)
    }
    
    setSelectedProducts(newSelected)
  }

  // 确认选择
  const handleConfirm = () => {
    const selected = products.filter(p => selectedProducts.has(p._id))
    onConfirm(selected)
    onOpenChange(false)
  }

  // 清空选择
  const handleClearSelection = () => {
    setSelectedProducts(new Set())
  }

  // 重置筛选
  const handleResetFilters = () => {
    setSearchKeyword("")
    setFilterProductType(productType || "")
    setFilterCategory("")
    setFilterBrand("")
    setFilterStatus("ACTIVE")
    setPageIndex(0)
  }

  // 总页数
  const totalPages = Math.ceil(total / pageSize)

  // 选中的产品信息
  const selectedProductsList = useMemo(() => {
    return products.filter(p => selectedProducts.has(p._id))
  }, [products, selectedProducts])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            选择产品
          </DialogTitle>
          <DialogDescription>
            {multiple 
              ? `已选择 ${selectedProducts.size} 个产品` 
              : "请选择一个产品"}
          </DialogDescription>
        </DialogHeader>

        {/* 搜索和筛选 */}
        <div className="space-y-3 border-b pb-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索产品编码、名称、条形码..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                setPageIndex(0)
              }}
              className="pl-10"
            />
          </div>

          {/* 筛选条件 */}
          <div className="grid grid-cols-4 gap-2">
            {!productType && (
              <Select
                value={filterProductType}
                onValueChange={(value) => {
                  setFilterProductType(value)
                  setPageIndex(0)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="产品类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部类型</SelectItem>
                  <SelectItem value="STANDARD">标准产品</SelectItem>
                  <SelectItem value="CUSTOMER">客户产品</SelectItem>
                  <SelectItem value="SELF_OWNED">自营产品</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select
              value={filterCategory}
              onValueChange={(value) => {
                setFilterCategory(value)
                setPageIndex(0)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="产品分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部分类</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterBrand}
              onValueChange={(value) => {
                setFilterBrand(value)
                setPageIndex(0)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="品牌" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部品牌</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={(value) => {
                setFilterStatus(value)
                setPageIndex(0)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部状态</SelectItem>
                <SelectItem value="ACTIVE">活跃</SelectItem>
                <SelectItem value="INACTIVE">停用</SelectItem>
                <SelectItem value="DRAFT">草稿</SelectItem>
                <SelectItem value="DISCONTINUED">停产</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
            >
              重置筛选
            </Button>
            {multiple && selectedProducts.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                清空选择 ({selectedProducts.size})
              </Button>
            )}
          </div>
        </div>

        {/* 产品列表 */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>未找到产品</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product._id}
                  className={`
                    border rounded-lg p-3 cursor-pointer transition-colors
                    ${selectedProducts.has(product._id) 
                      ? "bg-primary/5 border-primary" 
                      : "hover:bg-muted/50"}
                  `}
                  onClick={() => handleToggleProduct(product._id)}
                >
                  <div className="flex items-start gap-3">
                    {/* 复选框/单选框 */}
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedProducts.has(product._id)}
                        onCheckedChange={() => handleToggleProduct(product._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* 产品信息 */}
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
                            {product.barcode && (
                              <>
                                <span>•</span>
                                <span>条形码: {product.barcode}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {product.salePrice && (
                            <span className="text-sm font-medium">
                              ¥{product.salePrice}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 标签 */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {productTypeLabels[product.productType]}
                        </Badge>
                        {product.categoryName && (
                          <Badge variant="secondary" className="text-xs">
                            {product.categoryName}
                          </Badge>
                        )}
                        {product.brandName && (
                          <Badge variant="secondary" className="text-xs">
                            {product.brandName}
                          </Badge>
                        )}
                        <Badge
                          variant={product.status === "ACTIVE" ? "default" : "outline"}
                          className="text-xs"
                        >
                          {statusLabels[product.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              共 {total} 个产品，第 {pageIndex + 1} / {totalPages} 页
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
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageIndex >= totalPages - 1}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* 底部操作 */}
        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedProducts.size > 0 && (
                <span>已选择 {selectedProducts.size} 个产品</span>
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

/**
 * 使用示例：
 * 
 * ```tsx
 * import { ProductSelectorDialog } from "@/components/product-selector-dialog"
 * 
 * function QuotationForm() {
 *   const [dialogOpen, setDialogOpen] = useState(false)
 * 
 *   const handleSelectProducts = (products: Product[]) => {
 *     console.log("选中的产品:", products)
 *     // 将产品添加到报价单明细
 *     products.forEach(product => {
 *       addDetailRow("items", {
 *         productCode: product._docNumber,
 *         productNameCn: product.name,
 *         productNameEn: product.nameEn,
 *         unitPrice: product.salePrice,
 *         // ... 其他字段
 *       })
 *     })
 *   }
 * 
 *   return (
 *     <>
 *       <Button onClick={() => setDialogOpen(true)}>
 *         选择产品
 *       </Button>
 * 
 *       <ProductSelectorDialog
 *         open={dialogOpen}
 *         onOpenChange={setDialogOpen}
 *         onConfirm={handleSelectProducts}
 *         multiple={true}
 *         productType="STANDARD"
 *       />
 *     </>
 *   )
 * }
 * ```
 */
