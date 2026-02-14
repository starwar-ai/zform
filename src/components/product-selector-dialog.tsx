/**
 * ProductSelectorDialog
 *
 * 通用产品选择对话框。
 * 通过 ProductSelectorConfig 配置驱动，支持搜索、分类/品牌/状态筛选、分页、单选/多选。
 * 各业务场景（辅料、配件、标准产品等）只需传入不同 config 即可复用全部 UI 和交互逻辑。
 *
 * 注意：config 应为模块级常量，避免每次渲染创建新引用导致不必要的重渲染。
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
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
import type { LucideIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ============================================================
// 配置接口
// ============================================================

/** 产品选择器对话框的通用配置（应为模块级常量） */
export interface ProductSelectorConfig {
  /** 对话框标题（如 "选择辅料"、"选择产品"） */
  title: string
  /** 自定义描述文案：(已选数量, 是否多选) → 文案 */
  description?: (selectedCount: number, multiple: boolean) => string
  /** 固定筛选条件（如 skuType 过滤），会追加到每次查询中 */
  fixedFilters?: ColumnFilter[]
  /** 搜索框 placeholder */
  searchPlaceholder?: string
  /** 无数据主提示 */
  emptyMessage?: string
  /** 无数据次级提示 */
  emptyHint?: string
  /** 卡片上的类型 Badge 文案（如 "辅料"、"配件"），不设则不显示 */
  typeBadgeLabel?: string
  /** 标题栏图标，默认 Box */
  icon?: LucideIcon
  /** 每页数量，默认 20 */
  pageSize?: number
  /** 默认状态筛选值，默认 "ACTIVE" */
  defaultStatusFilter?: string
  /** 查询的单据类型，默认 "standard_product" */
  documentType?: string
  /** 分页信息 / 描述中的名词（如 "辅料"、"产品"），默认 "产品" */
  itemLabel?: string
}

// ============================================================
// Props
// ============================================================

export interface ProductSelectorDialogProps {
  /** 选择器配置 */
  config: ProductSelectorConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (items: Record<string, unknown>[]) => void
  /** 是否多选，默认单选 */
  multiple?: boolean
  /** 已选 ID 列表（用于回显） */
  selectedIds?: string[]
}

// ============================================================
// 常量
// ============================================================

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ACTIVE", label: "活跃" },
  { value: "INACTIVE", label: "停用" },
  { value: "DRAFT", label: "草稿" },
  { value: "DISCONTINUED", label: "停产" },
]

// ============================================================
// 内部类型：产品卡片数据
// ============================================================

interface ProductItem {
  _id: string
  _docNumber: string
  name: string
  nameEn?: string
  barcode?: string
  unit: string
  categoryName?: string
  brandName?: string
  salePrice?: number
  status: string
}

// ============================================================
// 子组件：产品表格行
// ============================================================

function ProductTableRow({
  product,
  selected,
  onToggle,
  typeBadgeLabel,
}: {
  product: ProductItem
  selected: boolean
  onToggle: () => void
  typeBadgeLabel?: string
}) {
  return (
    <TableRow 
      className={selected ? "bg-primary/5" : "hover:bg-muted/50"}
      onClick={onToggle}
    >
      <TableCell className="w-12">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span>{product.name}</span>
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
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          {typeBadgeLabel && (
            <Badge variant="secondary" className="text-xs w-fit">
              {typeBadgeLabel}
            </Badge>
          )}
          {product.categoryName && (
            <Badge variant="outline" className="text-xs w-fit">
              {product.categoryName}
            </Badge>
          )}
          {product.brandName && (
            <Badge variant="outline" className="text-xs w-fit">
              {product.brandName}
            </Badge>
          )}
          <Badge
            variant={product.status === "ACTIVE" ? "default" : "outline"}
            className="text-xs w-fit"
          >
            {productStatusLabels[product.status] ?? product.status}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {product.salePrice != null && (
          <span className="font-medium">
            ¥{product.salePrice}
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}

// ============================================================
// 主组件
// ============================================================

export function ProductSelectorDialog({
  config,
  open,
  onOpenChange,
  onConfirm,
  multiple = false,
  selectedIds = [],
}: ProductSelectorDialogProps) {
  const {
    title,
    description,
    fixedFilters = [],
    searchPlaceholder = "搜索编码、名称、条形码...",
    emptyMessage = "未找到产品",
    emptyHint,
    typeBadgeLabel,
    icon: Icon = Box,
    pageSize: configPageSize = 20,
    defaultStatusFilter = "ACTIVE",
    documentType = "standard_product",
    itemLabel = "产品",
  } = config

  const [products, setProducts] = useState<ProductItem[]>([])
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
  const [filterStatus, setFilterStatus] = useState<string>(defaultStatusFilter)

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(configPageSize)
  const [total, setTotal] = useState(0)

  // 稳定化 fixedFilters 引用：序列化对比，仅在内容变化时更新
  const fixedFiltersJson = JSON.stringify(fixedFilters)
  const stableFixedFilters = useMemo<ColumnFilter[]>(
    () => fixedFilters,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fixedFiltersJson]
  )

  // 弹窗打开时同步 selectedIds（仅 open 时同步，避免 selectedIds 默认 [] 导致依赖变化引发无限循环）
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds
  useEffect(() => {
    if (open) {
      setSelectedProducts(new Set(selectedIdsRef.current))
    }
  }, [open])

  // 加载分类和品牌
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

  // 加载产品列表
  useEffect(() => {
    if (!open) return

    setLoading(true)

    const filters: ColumnFilter[] = [...stableFixedFilters]

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
      documentType,
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
        setProducts(result.data as unknown as ProductItem[])
        setTotal(result.total)
      })
      .catch((err) => {
        console.error(`加载${itemLabel}列表失败:`, err)
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
    stableFixedFilters,
    documentType,
    itemLabel,
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
    onConfirm(selected as unknown as Record<string, unknown>[])
    onOpenChange(false)
  }, [products, selectedProducts, onConfirm, onOpenChange])

  const handleClearSelection = useCallback(() => {
    setSelectedProducts(new Set())
  }, [])

  const handleResetFilters = useCallback(() => {
    setSearchKeyword("")
    setFilterCategory("")
    setFilterBrand("")
    setFilterStatus(defaultStatusFilter)
    setPageIndex(0)
  }, [defaultStatusFilter])

  const resetPage = useCallback(() => setPageIndex(0), [])

  const totalPages = Math.ceil(total / pageSize)

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))
  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }))

  const descriptionText = description
    ? description(selectedProducts.size, multiple)
    : multiple
      ? `已选择 ${selectedProducts.size} 个${itemLabel}`
      : `请选择一个${itemLabel}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-b pb-4">
          {/* 筛选行：搜索 + 分类 / 品牌 / 状态 */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setPageIndex(0)
                }}
                className="pl-10"
              />
            </div>

            <div className="w-40 shrink-0">
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
            </div>

            <div className="w-40 shrink-0">
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
            </div>

            <div className="w-32 shrink-0">
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
          </div>

          {/* 操作按钮行 */}
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
                <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{emptyMessage}</p>
                {emptyHint && <p className="text-xs mt-1">{emptyHint}</p>}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>产品信息</TableHead>
                  <TableHead>分类/品牌/状态</TableHead>
                  <TableHead className="text-right">售价</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <ProductTableRow
                    key={product._id}
                    product={product}
                    selected={selectedProducts.has(product._id)}
                    onToggle={() => handleToggleProduct(product._id)}
                    typeBadgeLabel={typeBadgeLabel}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              共 {total} 个{itemLabel}，第 {pageIndex + 1} / {totalPages} 页
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
                <span>已选择 {selectedProducts.size} 个{itemLabel}</span>
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
