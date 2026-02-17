/**
 * SupplierSelectorDialog
 *
 * 供应商选择对话框。
 * 支持搜索、阶段/等级筛选、分页、单选/多选。
 * 查询三种供应商类型（生产商 manufacturer 为默认）。
 * 用于产品表单中「供应商报价列表」的添加行选择器。
 */

import { useState, useEffect, useCallback, useRef } from "react"
import type { ColumnFilter } from "@/components/list-table/types"
import { fetchDocumentListApi } from "@/apis/document-api"
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
import { Search, Building2, ChevronLeft, ChevronRight } from "lucide-react"
import type { RowSelectorDialogProps } from "@/core/row-selector-registry"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ============================================================
// 常量
// ============================================================

const STAGE_OPTIONS = [
  { value: "POTENTIAL", label: "潜在供应商" },
  { value: "FORMAL", label: "正式供应商" },
  { value: "RETIRED", label: "退休供应商" },
]

const LEVEL_OPTIONS = [
  { value: "A", label: "A级" },
  { value: "B", label: "B级" },
  { value: "C", label: "C级" },
  { value: "D", label: "D级" },
]

const SUPPLIER_TYPE_OPTIONS = [
  { value: "manufacturer", label: "生产商" },
  { value: "service_provider", label: "服务商" },
  { value: "logistics", label: "物流商" },
]

const PAGE_SIZE = 20

// ============================================================
// 内部类型
// ============================================================

interface SupplierItem {
  _id: string
  _code: string
  name: string
  nameEn?: string
  shortName?: string
  stage: string
  supplierLevel?: string
  companyCity?: string
  mainBusiness?: string
  currency?: string
  isEnabled?: boolean
}

const stageLabelMap: Record<string, string> = {
  POTENTIAL: "潜在",
  FORMAL: "正式",
  RETIRED: "退休",
}

// ============================================================
// 子组件：供应商表格行
// ============================================================

function SupplierTableRow({
  supplier,
  selected,
  onToggle,
}: {
  supplier: SupplierItem
  selected: boolean
  onToggle: () => void
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
            <span>{supplier.name}</span>
            {supplier.shortName && (
              <span className="text-sm text-muted-foreground">
                ({supplier.shortName})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>编码: {supplier._code}</span>
            {supplier.companyCity && (
              <>
                <span>•</span>
                <span>{supplier.companyCity}</span>
              </>
            )}
            {supplier.currency && (
              <>
                <span>•</span>
                <span>币种: {supplier.currency}</span>
              </>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge
            variant={supplier.stage === "FORMAL" ? "default" : "outline"}
            className="text-xs w-fit"
          >
            {stageLabelMap[supplier.stage] ?? supplier.stage}
          </Badge>
          {supplier.supplierLevel && (
            <Badge variant="secondary" className="text-xs w-fit">
              {supplier.supplierLevel}级
            </Badge>
          )}
          {supplier.isEnabled === false && (
            <Badge variant="destructive" className="text-xs w-fit">
              已停用
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        {supplier.mainBusiness && (
          <div className="text-sm text-muted-foreground line-clamp-1">
            {supplier.mainBusiness}
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

// ============================================================
// 主组件
// ============================================================

export function SupplierSelectorDialog({
  open,
  onOpenChange,
  onConfirm,
  multiple = false,
}: RowSelectorDialogProps) {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const debouncedSearch = useDebouncedValue(searchKeyword, 300)
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(
    new Set()
  )

  const [filterStage, setFilterStage] = useState<string>("FORMAL")
  const [filterLevel, setFilterLevel] = useState<string>("")
  const [supplierType, setSupplierType] = useState<string>("manufacturer")

  const [pageIndex, setPageIndex] = useState(0)
  const [total, setTotal] = useState(0)

  // 弹窗打开时重置选择
  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setSelectedSuppliers(new Set())
    }
    prevOpenRef.current = open
  }, [open])

  // 加载供应商列表
  useEffect(() => {
    if (!open) return

    setLoading(true)

    const filters: ColumnFilter[] = []

    if (filterStage) {
      filters.push({ columnId: "stage", operator: "eq", value: filterStage })
    }
    if (filterLevel) {
      filters.push({ columnId: "supplierLevel", operator: "eq", value: filterLevel })
    }

    fetchDocumentListApi(
      supplierType,
      {
        pagination: { pageIndex, pageSize: PAGE_SIZE },
        filters,
        sorting: [{ id: "createdAt", desc: true }],
      },
      "document",
      undefined,
      debouncedSearch
    )
      .then((result) => {
        setSuppliers(result.data as unknown as SupplierItem[])
        setTotal(result.total)
      })
      .catch((err) => {
        console.error("加载供应商列表失败:", err)
        setSuppliers([])
        setTotal(0)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [
    open,
    pageIndex,
    debouncedSearch,
    filterStage,
    filterLevel,
    supplierType,
  ])

  const handleToggleSupplier = useCallback(
    (supplierId: string) => {
      setSelectedSuppliers((prev) => {
        const next = new Set(prev)
        if (multiple) {
          if (next.has(supplierId)) next.delete(supplierId)
          else next.add(supplierId)
        } else {
          next.clear()
          next.add(supplierId)
        }
        return next
      })
    },
    [multiple]
  )

  const handleConfirm = useCallback(() => {
    const selected = suppliers.filter((s) => selectedSuppliers.has(s._id))
    onConfirm(selected as unknown as Record<string, unknown>[])
    onOpenChange(false)
  }, [suppliers, selectedSuppliers, onConfirm, onOpenChange])

  const handleClearSelection = useCallback(() => {
    setSelectedSuppliers(new Set())
  }, [])

  const handleResetFilters = useCallback(() => {
    setSearchKeyword("")
    setFilterStage("FORMAL")
    setFilterLevel("")
    setSupplierType("manufacturer")
    setPageIndex(0)
  }, [])

  const resetPage = useCallback(() => setPageIndex(0), [])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            选择供应商
          </DialogTitle>
          <DialogDescription>
            {multiple
              ? `已选择 ${selectedSuppliers.size} 个供应商`
              : "请选择一个供应商"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-b pb-4">
          {/* 筛选行 */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索供应商编码、名称..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setPageIndex(0)
                }}
                className="pl-10"
              />
            </div>

            <div className="w-32 shrink-0">
              <FilterSelect
                value={supplierType}
                onValueChange={(v) => {
                  setSupplierType(v)
                  resetPage()
                }}
                options={SUPPLIER_TYPE_OPTIONS}
                placeholder="供应商类型"
                allLabel="全部类型"
              />
            </div>

            <div className="w-32 shrink-0">
              <FilterSelect
                value={filterStage}
                onValueChange={(v) => {
                  setFilterStage(v)
                  resetPage()
                }}
                options={STAGE_OPTIONS}
                placeholder="阶段"
                allLabel="全部阶段"
              />
            </div>

            <div className="w-28 shrink-0">
              <FilterSelect
                value={filterLevel}
                onValueChange={(v) => {
                  setFilterLevel(v)
                  resetPage()
                }}
                options={LEVEL_OPTIONS}
                placeholder="等级"
                allLabel="全部等级"
              />
            </div>
          </div>

          {/* 操作按钮行 */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              重置筛选
            </Button>
            {multiple && selectedSuppliers.size > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearSelection}>
                清空选择 ({selectedSuppliers.size})
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>未找到供应商</p>
                <p className="text-xs mt-1">请调整筛选条件或确保已创建供应商数据</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>供应商信息</TableHead>
                  <TableHead>状态/等级</TableHead>
                  <TableHead>主营业务</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <SupplierTableRow
                    key={supplier._id}
                    supplier={supplier}
                    selected={selectedSuppliers.has(supplier._id)}
                    onToggle={() => handleToggleSupplier(supplier._id)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              共 {total} 个供应商，第 {pageIndex + 1} / {totalPages} 页
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
              {selectedSuppliers.size > 0 && (
                <span>已选择 {selectedSuppliers.size} 个供应商</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedSuppliers.size === 0}
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
