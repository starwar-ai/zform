/**
 * PortConfigPanel
 *
 * 港口配置面板
 */

import { useState, useEffect, useCallback } from "react"
import type { Port, Country } from "@/types/business-config"
import { PortStatus, PortStatusLabels } from "@/types/business-config"
import {
  fetchPortsApi,
  createPortApi,
  updatePortApi,
  deletePortApi,
  fetchCountriesApi,
} from "@/lib/business-config-api"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Edit, Trash2, Loader2, RefreshCw } from "lucide-react"

export function PortConfigPanel() {
  const [data, setData] = useState<Port[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Port | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState<Partial<Port>>({
    code: '',
    name: '',
    nameEn: '',
    countryId: '',
    city: '',
    address: '',
    isCommon: false,
    status: PortStatus.NORMAL,
  })

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [portsResult, countriesResult] = await Promise.all([
        fetchPortsApi(),
        fetchCountriesApi(),
      ])
      setData(portsResult)
      setCountries(countriesResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 新建
  const handleCreate = () => {
    setEditingItem(null)
    setFormData({
      code: '',
      name: '',
      nameEn: '',
      countryId: '',
      city: '',
      address: '',
      isCommon: false,
      status: PortStatus.NORMAL,
    })
    setDialogOpen(true)
  }

  // 编辑
  const handleEdit = (item: Port) => {
    setEditingItem(item)
    setFormData({
      code: item.code,
      name: item.name,
      nameEn: item.nameEn || '',
      countryId: item.countryId,
      city: item.city || '',
      address: item.address || '',
      isCommon: item.isCommon,
      status: item.status,
    })
    setDialogOpen(true)
  }

  // 删除
  const handleDelete = (itemId: string) => {
    setDeletingItemId(itemId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingItemId) return
    setSaving(true)
    try {
      await deletePortApi(deletingItemId)
      await loadData()
    } catch (err) {
      console.error('删除失败:', err)
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setSaving(false)
      setDeleteDialogOpen(false)
      setDeletingItemId(null)
    }
  }

  // 提交
  const handleSubmit = async () => {
    if (!formData.code || !formData.name || !formData.countryId) {
      alert('请填写必填字段')
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        await updatePortApi(editingItem.id, formData)
      } else {
        await createPortApi(formData)
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error('保存失败:', err)
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            共 {data.length} 条
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            新建港口
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
                  <TableHead>港口编号</TableHead>
                  <TableHead>港口名称</TableHead>
                  <TableHead>英文名称</TableHead>
                  <TableHead>所属国家</TableHead>
                  <TableHead>城市</TableHead>
                  <TableHead>常用</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="w-[160px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.nameEn || '-'}</TableCell>
                    <TableCell>{item.country?.name || '-'}</TableCell>
                    <TableCell>{item.city || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.isCommon ? "default" : "secondary"} className="text-xs">
                        {item.isCommon ? "是" : "否"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === PortStatus.NORMAL ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {PortStatusLabels[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
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
              暂无数据，请点击"新建港口"创建。
            </p>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑港口' : '新建港口'}</DialogTitle>
            <DialogDescription>
              {editingItem ? '修改港口信息' : '创建新港口'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  港口编号<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="例如: CNSHA"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  港口名称<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: 上海港"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>英文名称</Label>
                <Input
                  value={formData.nameEn || ''}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="例如: Shanghai Port"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  所属国家<span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={formData.countryId || ''}
                  onValueChange={(v) => setFormData({ ...formData, countryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择国家" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>城市</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="例如: 上海"
                />
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={formData.status || PortStatus.NORMAL}
                  onValueChange={(v) => setFormData({ ...formData, status: v as PortStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PortStatus.NORMAL}>
                      {PortStatusLabels[PortStatus.NORMAL]}
                    </SelectItem>
                    <SelectItem value={PortStatus.SUSPENDED}>
                      {PortStatusLabels[PortStatus.SUSPENDED]}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>地址</Label>
              <Input
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="详细地址"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.isCommon || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isCommon: Boolean(checked) })
                }
              />
              <Label className="cursor-pointer">常用港口</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !formData.code || !formData.name || !formData.countryId}
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
              此操作无法撤销。确定要删除该港口吗？
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
