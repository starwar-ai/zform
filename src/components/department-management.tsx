/**
 * DepartmentManagement
 * 部门管理组件（树形表格 CRUD）
 */

import { useState, useEffect, useCallback } from "react"
import type {
  DepartmentTreeNode,
  CreateDepartmentInput,
} from "@/types/department"
import {
  fetchDepartmentTreeApi,
  createDepartmentApi,
  updateDepartmentApi,
  deleteDepartmentApi,
} from "@/apis/department-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  FolderPlus,
} from "lucide-react"

/** 扁平化树节点，带缩进层级 */
interface FlatNode extends DepartmentTreeNode {
  level: number
  hasChildren: boolean
}

function flattenTree(
  nodes: DepartmentTreeNode[],
  level = 0,
  expandedIds: Set<string>
): FlatNode[] {
  const result: FlatNode[] = []
  for (const node of nodes) {
    result.push({
      ...node,
      level,
      hasChildren: node.children.length > 0,
    })
    if (node.children.length > 0 && expandedIds.has(node.id)) {
      result.push(...flattenTree(node.children, level + 1, expandedIds))
    }
  }
  return result
}

/** 递归统计子节点总数 */
function countDescendants(node: DepartmentTreeNode): number {
  let count = node.children.length
  for (const child of node.children) {
    count += countDescendants(child)
  }
  return count
}

export function DepartmentManagement() {
  const [tree, setTree] = useState<DepartmentTreeNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<DepartmentTreeNode | null>(null)
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<CreateDepartmentInput>({
    code: "",
    name: "",
    parentId: null,
    orderNum: 0,
  })

  // 加载部门树
  const loadTree = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchDepartmentTreeApi()
      setTree(data)
      // 默认展开所有一级节点
      const topIds = new Set(data.map((n) => n.id))
      setExpandedIds((prev) => new Set([...prev, ...topIds]))
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTree()
  }, [loadTree])

  // 展开/折叠
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 扁平化用于选择父级
  const flatOptions = useCallback(() => {
    const result: { id: string; name: string; level: number }[] = []
    const walk = (nodes: DepartmentTreeNode[], lv: number) => {
      for (const n of nodes) {
        result.push({ id: n.id, name: "\u00A0\u00A0".repeat(lv) + n.name, level: lv })
        walk(n.children, lv + 1)
      }
    }
    walk(tree, 0)
    return result
  }, [tree])

  // 新建
  const handleCreate = (parentId?: string | null) => {
    setEditingDept(null)
    setFormData({
      code: "",
      name: "",
      parentId: parentId || null,
      orderNum: 0,
    })
    setDialogOpen(true)
  }

  // 编辑
  const handleEdit = (dept: DepartmentTreeNode) => {
    setEditingDept(dept)
    setFormData({
      code: dept.code,
      name: dept.name,
      parentId: dept.parentId,
      orderNum: dept.orderNum,
    })
    setDialogOpen(true)
  }

  // 删除
  const handleDelete = (deptId: string) => {
    setDeletingDeptId(deptId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingDeptId) return
    setSaving(true)
    try {
      await deleteDepartmentApi(deletingDeptId)
      await loadTree()
    } catch (err) {
      console.error("删除失败:", err)
      alert(err instanceof Error ? err.message : "删除失败")
    } finally {
      setSaving(false)
      setDeleteDialogOpen(false)
      setDeletingDeptId(null)
    }
  }

  // 提交
  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editingDept) {
        await updateDepartmentApi(editingDept.id, {
          code: formData.code,
          name: formData.name,
          parentId: formData.parentId,
          orderNum: formData.orderNum,
        })
      } else {
        await createDepartmentApi(formData)
      }
      setDialogOpen(false)
      await loadTree()
    } catch (err) {
      console.error("保存失败:", err)
      alert(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const flatNodes = flattenTree(tree, 0, expandedIds)

  return (
    <div className="space-y-6 p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          部门管理
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTree}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={() => handleCreate()}>
            <Plus className="h-4 w-4 mr-1" />
            新建部门
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
          {error}
        </div>
      )}

      {/* 部门树表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            部门列表
            <Badge variant="secondary" className="text-xs">
              {flatNodes.length} 条
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && tree.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : tree.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">部门名称</TableHead>
                  <TableHead>部门编码</TableHead>
                  <TableHead>子部门数</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flatNodes.map((node) => (
                  <TableRow key={node.id}>
                    <TableCell>
                      <div
                        className="flex items-center gap-1"
                        style={{ paddingLeft: `${node.level * 24}px` }}
                      >
                        {node.hasChildren ? (
                          <button
                            onClick={() => toggleExpand(node.id)}
                            className="p-0.5 hover:bg-muted rounded shrink-0"
                          >
                            {expandedIds.has(node.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        ) : (
                          <span className="w-5 shrink-0" />
                        )}
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{node.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {node.code}
                    </TableCell>
                    <TableCell>
                      {node.children.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {countDescendants(node)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {node.orderNum}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(node.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCreate(node.id)}
                          title="添加子部门"
                        >
                          <FolderPlus className="h-3 w-3 mr-1" />
                          子级
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(node)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(node.id)}
                        >
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
            <p className="text-sm text-muted-foreground text-center py-4">
              暂无部门，请点击"新建部门"创建。
            </p>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑部门对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDept ? "编辑部门" : "新建部门"}
            </DialogTitle>
            <DialogDescription>
              {editingDept ? "修改部门信息" : "创建新部门"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dept-code">部门编码 *</Label>
                <Input
                  id="dept-code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="例如: DEPT001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-name">部门名称 *</Label>
                <Input
                  id="dept-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如: 销售部"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-parent">上级部门</Label>
              <Select
                value={formData.parentId || "__none__"}
                onValueChange={(v) =>
                  setFormData({ ...formData, parentId: v === "__none__" ? null : v })
                }
              >
                <SelectTrigger id="dept-parent">
                  <SelectValue placeholder="无（顶级部门）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">无（顶级部门）</SelectItem>
                  {flatOptions()
                    .filter((opt) => opt.id !== editingDept?.id)
                    .map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-order">排序号</Label>
              <Input
                id="dept-order"
                type="number"
                value={formData.orderNum ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, orderNum: Number(e.target.value) || 0 })
                }
                placeholder="0"
              />
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
              {editingDept ? "保存" : "创建"}
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
              此操作无法撤销。确定要删除该部门吗？
              如果该部门下有子部门或用户，将无法删除。
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
