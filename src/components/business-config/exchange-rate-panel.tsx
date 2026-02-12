/**
 * ExchangeRatePanel
 *
 * 汇率配置面板
 */

import { useState, useEffect, useCallback } from "react"
import type { CurrencyRate } from "@/types/business-config"
import {
  fetchExchangeRatesApi,
  fetchTodayRatesApi,
  createExchangeRateApi,
  updateExchangeRateApi,
  deleteExchangeRateApi,
  fetchRatesFromExternalApi,
} from "@/apis/business-config-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  Download,
  Calendar,
  DollarSign,
} from "lucide-react"

export function ExchangeRatePanel() {
  const [data, setData] = useState<CurrencyRate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // 今日汇率
  const [todayRates, setTodayRates] = useState<Record<string, number>>({})
  const [todayDate, setTodayDate] = useState<string>("")

  // 搜索条件
  const [searchDate, setSearchDate] = useState<string>("")

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CurrencyRate | null>(null)
  const [deletingItem, setDeletingItem] = useState<CurrencyRate | null>(null)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState<Partial<CurrencyRate>>({
    rateDate: new Date().toISOString().split('T')[0],
    currencyName: '',
    rate: 0,
    midRate: null,
    remark: '',
  })

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchExchangeRatesApi({
        page,
        pageSize,
        rateDate: searchDate || undefined,
      })
      setData(result.records)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchDate])

  // 加载今日汇率
  const loadTodayRates = useCallback(async () => {
    try {
      const result = await fetchTodayRatesApi()
      setTodayRates(result.rates)
      setTodayDate(result.date)
    } catch (err) {
      console.error('加载今日汇率失败:', err)
    }
  }, [])

  useEffect(() => {
    loadData()
    loadTodayRates()
  }, [loadData, loadTodayRates])

  // 从外部API获取汇率
  const handleFetchFromApi = async () => {
    setFetching(true)
    try {
      const result = await fetchRatesFromExternalApi()
      if (result.success) {
        await loadData()
        await loadTodayRates()
        alert(`成功获取 ${result.results.filter(r => r.rate).length} 个币种汇率`)
      }
    } catch (err) {
      console.error('获取汇率失败:', err)
      alert(err instanceof Error ? err.message : '获取汇率失败')
    } finally {
      setFetching(false)
    }
  }

  // 新建
  const handleCreate = () => {
    setEditingItem(null)
    setFormData({
      rateDate: new Date().toISOString().split('T')[0],
      currencyName: '',
      rate: 0,
      midRate: null,
      remark: '',
    })
    setDialogOpen(true)
  }

  // 编辑
  const handleEdit = (item: CurrencyRate) => {
    setEditingItem(item)
    setFormData({
      rateDate: item.rateDate,
      currencyName: item.currencyName,
      rate: typeof item.rate === 'string' ? parseFloat(item.rate) : item.rate,
      midRate: item.midRate ? (typeof item.midRate === 'string' ? parseFloat(item.midRate) : item.midRate) : null,
      remark: item.remark || '',
    })
    setDialogOpen(true)
  }

  // 删除
  const handleDelete = (item: CurrencyRate) => {
    setDeletingItem(item)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setSaving(true)
    try {
      await deleteExchangeRateApi(deletingItem.rateDate, deletingItem.currencyName)
      await loadData()
      await loadTodayRates()
    } catch (err) {
      console.error('删除失败:', err)
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setSaving(false)
      setDeleteDialogOpen(false)
      setDeletingItem(null)
    }
  }

  // 提交
  const handleSubmit = async () => {
    if (!formData.rateDate || !formData.currencyName || formData.rate === undefined) {
      alert('请填写必填字段')
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        await updateExchangeRateApi(editingItem.rateDate, editingItem.currencyName, formData)
      } else {
        await createExchangeRateApi(formData)
      }
      setDialogOpen(false)
      await loadData()
      await loadTodayRates()
    } catch (err) {
      console.error('保存失败:', err)
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 格式化汇率
  const formatRate = (rate: number | string | undefined | null) => {
    if (rate === undefined || rate === null) return '-'
    const num = typeof rate === 'string' ? parseFloat(rate) : rate
    return num.toFixed(6)
  }

  return (
    <div className="space-y-4">
      {/* 今日汇率卡片 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">今日汇率 ({todayDate})</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleFetchFromApi} 
              disabled={fetching}
            >
              {fetching ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              从API获取
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(todayRates)
              .filter(([currency]) => todayRates[currency] > 0)
              .map(([currency, rate]) => (
                <div 
                  key={currency} 
                  className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-md"
                >
                  <span className="font-medium text-sm">{currency}</span>
                  <span className="text-sm text-muted-foreground">
                    {typeof rate === 'number' ? rate.toFixed(4) : rate}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            共 {total} 条
          </Badge>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={searchDate}
              onChange={(e) => {
                setSearchDate(e.target.value)
                setPage(1)
              }}
              className="w-40 h-8"
              placeholder="选择日期"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            新建汇率
          </Button>
        </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>币种</TableHead>
                  <TableHead className="text-right">汇率</TableHead>
                  <TableHead className="text-right">中间汇率</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[160px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.rateDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.currencyName}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatRate(item.rate)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatRate(item.midRate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.source === 1 ? "default" : "secondary"}>
                        {item.source === 1 ? '自动' : '手动'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {item.remark || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
                          <Trash2 className="h-3 w-3 mr-1" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              暂无数据，请点击"新建汇率"创建，或点击"从API获取"自动获取汇率。
            </p>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} / {Math.ceil(total / pageSize)} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 创建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑汇率' : '新建汇率'}</DialogTitle>
            <DialogDescription>
              {editingItem ? '修改汇率信息' : '创建新汇率记录'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                日期<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                type="date"
                value={formData.rateDate || ''}
                onChange={(e) => setFormData({ ...formData, rateDate: e.target.value })}
                disabled={!!editingItem}
              />
            </div>
            <div className="space-y-2">
              <Label>
                币种<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                value={formData.currencyName || ''}
                onChange={(e) => setFormData({ ...formData, currencyName: e.target.value.toUpperCase() })}
                placeholder="例如: USD, EUR, JPY"
                disabled={!!editingItem}
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label>
                汇率<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                type="number"
                step="0.000001"
                value={formData.rate || ''}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                placeholder="对人民币汇率"
              />
            </div>
            <div className="space-y-2">
              <Label>中间汇率</Label>
              <Input
                type="number"
                step="0.000001"
                value={formData.midRate || ''}
                onChange={(e) => setFormData({ ...formData, midRate: parseFloat(e.target.value) || null })}
                placeholder="中间汇率（可选）"
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                value={formData.remark || ''}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="备注信息"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !formData.rateDate || !formData.currencyName || !formData.rate}
            >
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingItem ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 {deletingItem?.rateDate} 的 {deletingItem?.currencyName} 汇率吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
