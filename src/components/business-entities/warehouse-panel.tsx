/**
 * WarehouseConfigPanel
 *
 * 仓库配置面板
 */

import { useState, useEffect, useCallback } from "react"
import type { Warehouse } from "@/types/business-config"
import { WarehouseType, WarehouseTypeLabels } from "@/types/business-config"
import {
  fetchWarehousesApi,
  createWarehouseApi,
  updateWarehouseApi,
  deleteWarehouseApi,
} from "@/apis/business-parameter-api"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Edit, Trash2, Loader2, RefreshCw } from "lucide-react"

const warehouseTypeOptions = [WarehouseType.COMPANY, WarehouseType.SUPPLIER]

export function WarehouseConfigPanel() {
  const [data, setData] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Warehouse | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState<Partial<Warehouse>>({
    code: '',
    name: '',
    type: WarehouseType.COMPANY,
    address: '',
    isDefault: false,
    isEnabled: true,
    supplierCode: '',
    supplierName: '',
    remark: '',
  })

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchWarehousesApi()
      setData(result)
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
      type: WarehouseType.COMPANY,
      address: '',
      isDefault: false,
      isEnabled: true,
      supplierCode: '',
      supplierName: '',
      remark: '',
    })
    setDialogOpen(true)
  }

  // 编辑
  const handleEdit = (item: Warehouse) => {
    setEditingItem(item)
    setFormData({
      code: item.code,
      name: item.name,
      type: item.type,
      address: item.address || '',
      isDefault: item.isDefault,
      isEnabled: item.isEnabled,
      supplierCode: item.supplierCode || '',
      supplierName: item.supplierName || '',
      remark: item.remark || '',
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
      await deleteWarehouseApi(deletingItemId)
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
    if (!formData.code || !formData.name) {
      alert('请填写必填字段')
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        await updateWarehouseApi(editingItem.id, formData)
      } else {
        await createWarehouseApi(formData)
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
            新建仓库
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
                  <TableHead>仓库编码</TableHead>
                  <TableHead>仓库名称</TableHead>
                  <TableHead>仓库类型</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>是否默认</TableHead>
                  <TableHead>是否启用</TableHead>
                  <TableHead>供应商名称</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[160px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {WarehouseTypeLabels[item.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.address || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.isDefault ? "default" : "secondary"} className="text-xs">
                        {item.isDefault ? "是" : "否"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isEnabled ? "default" : "secondary"} className="text-xs">
                        {item.isEnabled ? "启用" : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.type === WarehouseType.SUPPLIER ? (item.supplierName || '-') : '-'}
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
              暂无数据，请点击"新建仓库"创建。
            </p>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑仓库' : '新建仓库'}</DialogTitle>
            <DialogDescription>
              {editingItem ? '修改仓库信息' : '创建新仓库'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  仓库编码<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="例如: WH001"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  仓库名称<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: 主仓库"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>仓库类型</Label>
              <Select
                value={(formData.type as string) || ''}
                onValueChange={(v) => setFormData({ ...formData, type: v as WarehouseType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择仓库类型" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {WarehouseTypeLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>仓库地址</Label>
              <Textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="仓库详细地址"
              />
            </div>

            {formData.type === WarehouseType.SUPPLIER && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>供应商编码</Label>
                  <Input
                    value={formData.supplierCode || ''}
                    onChange={(e) => setFormData({ ...formData, supplierCode: e.target.value })}
                    placeholder="供应商编码"
                  />
                </div>
                <div className="space-y-2">
                  <Label>供应商名称</Label>
                  <Input
                    value={formData.supplierName || ''}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    placeholder="供应商名称"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={formData.remark || ''}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="备注信息"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isDefault || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDefault: Boolean(checked) })
                  }
                />
                <Label className="cursor-pointer">默认仓库</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isEnabled || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isEnabled: Boolean(checked) })
                  }
                />
                <Label className="cursor-pointer">启用</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !formData.code || !formData.name}
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
              此操作无法撤销。确定要删除该仓库吗？如仓库已被使用，将无法删除。
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
