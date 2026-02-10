/**
 * WarehouseInventory
 *
 * 库存查询页面 - 独立查询页面，不使用DocumentListTable
 */

import { useState, useEffect, useCallback } from "react"
import { fetchInventoryListApi, type InventoryDetail, type InventoryQueryParams } from "@/apis/inventory-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, RefreshCw, Search, Package } from "lucide-react"

export function WarehouseInventory() {
  const [data, setData] = useState<InventoryDetail[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 筛选条件
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: InventoryQueryParams = {
        page,
        pageSize,
        search: search || undefined,
      }
      const result = await fetchInventoryListApi(params)
      setData(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 搜索
  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  // 重置搜索
  const handleReset = () => {
    setSearchInput("")
    setSearch("")
    setPage(1)
  }

  // 分页
  const totalPages = Math.ceil(total / pageSize)
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1)
  }
  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1)
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5" />
        <h1 className="text-xl font-bold">库存查询</h1>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="搜索 SKU编码/名称/自营货号/批次号/仓库名称..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
          className="max-w-md"
        />
        <Button variant="outline" size="sm" onClick={handleSearch}>
          <Search className="h-4 w-4 mr-1" />
          搜索
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          重置
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
          {error}
        </div>
      )}

      {/* 数据表格 */}
      <Card>
        <CardContent className="p-0">
          {loading && data.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU编码</TableHead>
                    <TableHead>SKU名称</TableHead>
                    <TableHead>自营货号</TableHead>
                    <TableHead>仓库</TableHead>
                    <TableHead>批次号</TableHead>
                    <TableHead className="text-right">初始数量</TableHead>
                    <TableHead className="text-right">已用数量</TableHead>
                    <TableHead className="text-right">锁定数量</TableHead>
                    <TableHead className="text-right">可用数量</TableHead>
                    <TableHead>供应商</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>入库时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.skuCode || '-'}</TableCell>
                      <TableCell>{item.skuName || '-'}</TableCell>
                      <TableCell>{item.selfOwnedProductNo || '-'}</TableCell>
                      <TableCell>{item.warehouseName || '-'}</TableCell>
                      <TableCell>{item.batchNumber || '-'}</TableCell>
                      <TableCell className="text-right">{item.initialQuantity}</TableCell>
                      <TableCell className="text-right">{item.usedQuantity}</TableCell>
                      <TableCell className="text-right">{item.lockedQuantity}</TableCell>
                      <TableCell className="text-right font-medium">{item.availableQuantity}</TableCell>
                      <TableCell>{item.supplierName || '-'}</TableCell>
                      <TableCell>{item.customerName || '-'}</TableCell>
                      <TableCell>
                        {item.inboundTime
                          ? new Date(item.inboundTime).toLocaleDateString('zh-CN')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* 分页 */}
              <div className="flex items-center justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  共 {total} 条记录，第 {page} / {totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={page <= 1}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= totalPages}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              暂无库存数据
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
