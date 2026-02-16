/**
 * BrandConfigPanel
 *
 * 品牌配置面板
 */

import { useState, useEffect, useCallback } from "react"
import type { Brand } from "@/types/business-config"
import { BrandType, BrandTypeLabels } from "@/types/business-config"
import {
  fetchBrandsApi,
  createBrandApi,
  updateBrandApi,
  deleteBrandApi,
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

const brandTypeOptions = [BrandType.CUSTOMER, BrandType.COMPANY]

export function BrandConfigPanel() {
  const [data, setData] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Brand | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState<Partial<Brand>>({
    code: '',
    name: '',
    nameEn: '',
    type: BrandType.COMPANY,
    customerId: '',
    customerCode: '',
    customerName: '',
    description: '',
    descriptionEn: '',
    isCommon: false,
    isSelfOwned: false,
  })

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchBrandsApi()
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
      nameEn: '',
      type: BrandType.COMPANY,
      customerId: '',
      customerCode: '',
      customerName: '',
      description: '',
      descriptionEn: '',
      isCommon: false,
      isSelfOwned: false,
    })
    setDialogOpen(true)
  }

  // 编辑
  const handleEdit = (item: Brand) => {
    setEditingItem(item)
    setFormData({
      code: item.code,
      name: item.name,
      nameEn: item.nameEn || '',
      type: item.type || BrandType.COMPANY,
      customerId: item.customerId || '',
      customerCode: item.customerCode || '',
      customerName: item.customerName || '',
      description: item.description || '',
      descriptionEn: item.descriptionEn || '',
      isCommon: item.isCommon,
      isSelfOwned: item.isSelfOwned,
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
      await deleteBrandApi(deletingItemId)
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
        await updateBrandApi(editingItem.id, formData)
      } else {
        await createBrandApi(formData)
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
            新建品牌
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
                  <TableHead>品牌编码</TableHead>
                  <TableHead>品牌名称</TableHead>
                  <TableHead>英文名称</TableHead>
                  <TableHead>品牌类型</TableHead>
                  <TableHead>客户名称</TableHead>
                  <TableHead>常用</TableHead>
                  <TableHead>自有</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[160px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.nameEn || '-'}</TableCell>
                    <TableCell>
                      {item.type ? BrandTypeLabels[item.type as BrandType] || item.type : '-'}
                    </TableCell>
                    <TableCell>{item.customerName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.isCommon ? "default" : "secondary"} className="text-xs">
                        {item.isCommon ? "是" : "否"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isSelfOwned ? "default" : "secondary"} className="text-xs">
                        {item.isSelfOwned ? "是" : "否"}
                      </Badge>
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
              暂无数据，请点击"新建品牌"创建。
            </p>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑品牌' : '新建品牌'}</DialogTitle>
            <DialogDescription>
              {editingItem ? '修改品牌信息' : '创建新品牌'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  品牌编码<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="例如: BRAND001"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  品牌名称<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: 自有品牌"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>英文名称</Label>
                <Input
                  value={formData.nameEn || ''}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="例如: Own Brand"
                />
              </div>
              <div className="space-y-2">
                <Label>品牌类型</Label>
                <Select
                  value={(formData.type as string) || ''}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择品牌类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {BrandTypeLabels[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>客户ID</Label>
                <Input
                  value={formData.customerId || ''}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  placeholder="客户ID"
                />
              </div>
              <div className="space-y-2">
                <Label>客户编码</Label>
                <Input
                  value={formData.customerCode || ''}
                  onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                  placeholder="客户编码"
                />
              </div>
              <div className="space-y-2">
                <Label>客户名称</Label>
                <Input
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="客户名称"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>中文描述</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="品牌描述"
                />
              </div>
              <div className="space-y-2">
                <Label>英文描述</Label>
                <Textarea
                  value={formData.descriptionEn || ''}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  placeholder="Brand description"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isCommon || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isCommon: Boolean(checked) })
                  }
                />
                <Label className="cursor-pointer">常用品牌</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isSelfOwned || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isSelfOwned: Boolean(checked) })
                  }
                />
                <Label className="cursor-pointer">自有品牌</Label>
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
              此操作无法撤销。确定要删除该品牌吗？如品牌已被产品引用，将无法删除。
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
