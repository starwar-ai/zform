/**
 * 运输方式配置面板
 */

import { useState, useEffect, useCallback } from "react"
import type { TransportMethod } from "@/types/business-config"
import {
  fetchTransportMethodsApi,
  createTransportMethodApi,
  updateTransportMethodApi,
  deleteTransportMethodApi,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, Star, StarOff } from "lucide-react"

export function TransportMethodConfigPanel() {
  const [methods, setMethods] = useState<TransportMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<TransportMethod | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    nameEn: "",
    isCommon: false,
    sortOrder: 0,
    isEnabled: true,
    remark: ""
  })

  const loadMethods = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchTransportMethodsApi()
      // 按是否常用排序，常用的在前
      const sorted = [...data].sort((a, b) => {
        if (a.isCommon && !b.isCommon) return -1
        if (!a.isCommon && b.isCommon) return 1
        return a.sortOrder - b.sortOrder
      })
      setMethods(sorted)
    } catch (error) {
      console.error("加载运输方式失败:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMethods()
  }, [loadMethods])

  const handleCreate = () => {
    setEditingMethod(null)
    setFormData({
      code: "",
      name: "",
      nameEn: "",
      isCommon: false,
      sortOrder: 0,
      isEnabled: true,
      remark: ""
    })
    setDialogOpen(true)
  }

  const handleEdit = (method: TransportMethod) => {
    setEditingMethod(method)
    setFormData({
      code: method.code,
      name: method.name,
      nameEn: method.nameEn || "",
      isCommon: method.isCommon,
      sortOrder: method.sortOrder,
      isEnabled: method.isEnabled,
      remark: method.remark || ""
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个运输方式吗？")) return
    
    try {
      await deleteTransportMethodApi(id)
      loadMethods()
    } catch (error) {
      console.error("删除失败:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingMethod) {
        await updateTransportMethodApi(editingMethod.id, formData)
      } else {
        await createTransportMethodApi(formData)
      }
      setDialogOpen(false)
      loadMethods()
    } catch (error) {
      console.error(editingMethod ? "更新失败:" : "创建失败:", error)
    }
  }

  const toggleCommon = async (method: TransportMethod) => {
    try {
      await updateTransportMethodApi(method.id, {
        ...method,
        isCommon: !method.isCommon
      })
      loadMethods()
    } catch (error) {
      console.error("操作失败:", error)
    }
  }

  const commonMethods = methods.filter(m => m.isCommon)
  const otherMethods = methods.filter(m => !m.isCommon)

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">运输方式配置</h2>
          <p className="text-sm text-muted-foreground">
            管理运输方式，设置常用项会在列表中优先显示
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新增运输方式
        </Button>
      </div>

      {/* 运输方式列表 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              加载中...
            </div>
          ) : (
            <div className="divide-y">
              {/* 常用运输方式 */}
              {commonMethods.length > 0 && (
                <div>
                  <div className="p-4 bg-muted/50 border-b">
                    <h3 className="font-medium flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-500 fill-current" />
                      常用运输方式
                    </h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>编码</TableHead>
                        <TableHead>中文名称</TableHead>
                        <TableHead>英文名称</TableHead>
                        <TableHead>排序</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commonMethods.map((method) => (
                        <TableRow key={method.id}>
                          <TableCell className="font-mono">{method.code}</TableCell>
                          <TableCell>{method.name}</TableCell>
                          <TableCell>{method.nameEn || "-"}</TableCell>
                          <TableCell>{method.sortOrder}</TableCell>
                          <TableCell>
                            <Badge variant={method.isEnabled ? "default" : "secondary"}>
                              {method.isEnabled ? "启用" : "停用"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCommon(method)}
                            >
                              <StarOff className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(method)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(method.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* 其他运输方式 */}
              {otherMethods.length > 0 && (
                <div>
                  <div className="p-4 bg-muted/30 border-b">
                    <h3 className="font-medium">其他运输方式</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>编码</TableHead>
                        <TableHead>中文名称</TableHead>
                        <TableHead>英文名称</TableHead>
                        <TableHead>排序</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherMethods.map((method) => (
                        <TableRow key={method.id}>
                          <TableCell className="font-mono">{method.code}</TableCell>
                          <TableCell>{method.name}</TableCell>
                          <TableCell>{method.nameEn || "-"}</TableCell>
                          <TableCell>{method.sortOrder}</TableCell>
                          <TableCell>
                            <Badge variant={method.isEnabled ? "default" : "secondary"}>
                              {method.isEnabled ? "启用" : "停用"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCommon(method)}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(method)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(method.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {methods.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  暂无运输方式配置
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "编辑运输方式" : "新增运输方式"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">编码 *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">中文名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nameEn">英文名称</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sortOrder">排序</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remark">备注</Label>
              <Textarea
                id="remark"
                value={formData.remark}
                onChange={(e) => setFormData({...formData, remark: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isCommon"
                  checked={formData.isCommon}
                  onCheckedChange={(checked) => setFormData({...formData, isCommon: !!checked})}
                />
                <Label htmlFor="isCommon">设为常用</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => setFormData({...formData, isEnabled: !!checked})}
                />
                <Label htmlFor="isEnabled">启用</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit">
                {editingMethod ? "更新" : "创建"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}