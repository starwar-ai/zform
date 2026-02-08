/**
 * RoleManagement
 * 角色管理组件（接入后端 API + 菜单权限分配）
 */

import { useState, useEffect, useCallback } from "react"
import { useRoleStore } from "@/stores/role-store"
import { useUserStore } from "@/stores/user-store"
import { useMenuStore } from "@/stores/menu-store"
import type { Role, CreateRoleInput, UpdateRoleInput } from "@/types/role"
import type { MenuTreeNode } from "@/types/menu"
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  KeyRound,
} from "lucide-react"

const statusLabels = {
  active: "激活",
  inactive: "停用",
}

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
}

/** 菜单树复选框组件 */
function MenuTreeCheckbox({
  nodes,
  checkedIds,
  onToggle,
  level = 0,
}: {
  nodes: MenuTreeNode[]
  checkedIds: Set<string>
  onToggle: (id: string, checked: boolean) => void
  level?: number
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(
    nodes.map((n) => n.id) // 默认展开
  ))

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0
        const isExpanded = expandedIds.has(node.id)
        const isChecked = checkedIds.has(node.id)

        // 判断子节点是否全部选中（半选状态）
        const allChildIds = getAllChildIds(node)
        const checkedChildCount = allChildIds.filter((id) =>
          checkedIds.has(id)
        ).length
        const isIndeterminate =
          hasChildren &&
          checkedChildCount > 0 &&
          checkedChildCount < allChildIds.length &&
          !isChecked

        return (
          <div key={node.id}>
            <div
              className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded px-1"
              style={{ paddingLeft: `${level * 20}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="p-0.5 hover:bg-muted rounded shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <span className="w-4 shrink-0" />
              )}
              <Checkbox
                id={`menu-${node.id}`}
                checked={isIndeterminate ? "indeterminate" : isChecked}
                onCheckedChange={(checked) => {
                  onToggle(node.id, !!checked)
                }}
              />
              <label
                htmlFor={`menu-${node.id}`}
                className="text-sm cursor-pointer select-none"
              >
                {node.title}
              </label>
              {node.permission && (
                <span className="text-xs text-muted-foreground">
                  ({node.permission})
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <MenuTreeCheckbox
                nodes={node.children}
                checkedIds={checkedIds}
                onToggle={onToggle}
                level={level + 1}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/** 获取所有子节点 ID */
function getAllChildIds(node: MenuTreeNode): string[] {
  const ids: string[] = []
  const collect = (n: MenuTreeNode) => {
    n.children.forEach((child) => {
      ids.push(child.id)
      collect(child)
    })
  }
  collect(node)
  return ids
}

export function RoleManagement() {
  const {
    roles,
    loading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    assignMenus,
    getRoleMenuIds,
    getAllRoles,
  } = useRoleStore()
  const { users, fetchUsers, getUsersByRole } = useUserStore()
  const { menuTree, fetchMenuTree } = useMenuStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [menuDialogOpen, setMenuDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 菜单权限分配
  const [menuAssignRoleId, setMenuAssignRoleId] = useState<string | null>(null)
  const [checkedMenuIds, setCheckedMenuIds] = useState<Set<string>>(new Set())
  const [menuLoading, setMenuLoading] = useState(false)

  const [formData, setFormData] = useState<CreateRoleInput>({
    code: "",
    name: "",
    description: "",
    status: "active",
  })

  // 加载数据
  useEffect(() => {
    fetchRoles()
    fetchUsers()
    fetchMenuTree()
  }, [fetchRoles, fetchUsers, fetchMenuTree])

  const allRoles = getAllRoles()

  const handleCreate = () => {
    setEditingRole(null)
    setFormData({
      code: "",
      name: "",
      description: "",
      status: "active",
    })
    setDialogOpen(true)
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      code: role.code,
      name: role.name,
      description: role.description || "",
      status: role.status,
    })
    setDialogOpen(true)
  }

  const handleDelete = (roleId: string) => {
    const roleUsers = getUsersByRole(roleId)
    if (roleUsers.length > 0) {
      alert(`无法删除角色：还有 ${roleUsers.length} 个用户关联此角色`)
      return
    }
    setDeletingRoleId(roleId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (deletingRoleId) {
      setSaving(true)
      try {
        await deleteRole(deletingRoleId)
      } catch (err) {
        console.error("删除失败:", err)
      } finally {
        setSaving(false)
        setDeleteDialogOpen(false)
        setDeletingRoleId(null)
      }
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: formData.name,
          description: formData.description,
          status: formData.status,
        })
      } else {
        await createRole(formData)
      }
      setDialogOpen(false)
    } catch (err) {
      console.error("保存失败:", err)
    } finally {
      setSaving(false)
    }
  }

  // 打开菜单权限分配对话框
  const handleOpenMenuAssign = async (roleId: string) => {
    setMenuAssignRoleId(roleId)
    setMenuLoading(true)
    setMenuDialogOpen(true)
    try {
      const menuIds = await getRoleMenuIds(roleId)
      setCheckedMenuIds(new Set(menuIds))
    } catch (err) {
      console.error("获取角色菜单失败:", err)
    } finally {
      setMenuLoading(false)
    }
  }

  // 切换菜单选中（支持级联选中/取消子节点）
  const handleToggleMenu = useCallback(
    (menuId: string, checked: boolean) => {
      setCheckedMenuIds((prev) => {
        const next = new Set(prev)

        // 查找节点
        const findNode = (
          nodes: MenuTreeNode[],
          id: string
        ): MenuTreeNode | null => {
          for (const node of nodes) {
            if (node.id === id) return node
            const found = findNode(node.children, id)
            if (found) return found
          }
          return null
        }

        const node = findNode(menuTree, menuId)

        if (checked) {
          next.add(menuId)
          // 选中所有子菜单
          if (node) {
            const addChildren = (n: MenuTreeNode) => {
              n.children.forEach((child) => {
                next.add(child.id)
                addChildren(child)
              })
            }
            addChildren(node)
          }
          // 选中所有父菜单（确保父菜单可见）
          const addParents = (nodes: MenuTreeNode[], targetId: string): boolean => {
            for (const n of nodes) {
              if (n.id === targetId) return true
              if (n.children.length > 0 && addParents(n.children, targetId)) {
                next.add(n.id)
                return true
              }
            }
            return false
          }
          addParents(menuTree, menuId)
        } else {
          next.delete(menuId)
          // 取消所有子菜单
          if (node) {
            const removeChildren = (n: MenuTreeNode) => {
              n.children.forEach((child) => {
                next.delete(child.id)
                removeChildren(child)
              })
            }
            removeChildren(node)
          }
        }

        return next
      })
    },
    [menuTree]
  )

  // 保存菜单权限分配
  const handleSaveMenuAssign = async () => {
    if (!menuAssignRoleId) return
    setSaving(true)
    try {
      await assignMenus(menuAssignRoleId, Array.from(checkedMenuIds))
      setMenuDialogOpen(false)
    } catch (err) {
      console.error("保存菜单权限失败:", err)
    } finally {
      setSaving(false)
    }
  }

  const getUserCount = (roleId: string) => {
    return getUsersByRole(roleId).length
  }

  return (
    <div className="space-y-6 p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          角色管理
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRoles()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            新建角色
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
          {error}
        </div>
      )}

      {/* 角色列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            角色列表
            <Badge variant="secondary" className="text-xs">
              {allRoles.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && roles.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : allRoles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>角色编码</TableHead>
                  <TableHead>角色名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>用户数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.code}</TableCell>
                    <TableCell>{role.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                      {role.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getUserCount(role.id)} 人
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[role.status]}>
                        {statusLabels[role.status as keyof typeof statusLabels] || role.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(role.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenMenuAssign(role.id)}
                          title="分配菜单权限"
                        >
                          <KeyRound className="h-3 w-3 mr-1" />
                          权限
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(role)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role.id)}
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
              暂无角色
            </p>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑角色对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "编辑角色" : "新建角色"}
            </DialogTitle>
            <DialogDescription>
              {editingRole ? "修改角色信息" : "创建新角色"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">角色编码 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  disabled={!!editingRole}
                  placeholder="例如: ADMIN, USER"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">角色名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如: 管理员, 普通用户"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="角色说明..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
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
              {editingRole ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 菜单权限分配对话框 */}
      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              分配菜单权限
            </DialogTitle>
            <DialogDescription>
              选择该角色可以访问的菜单，选中父菜单将自动选中所有子菜单。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto border rounded-md p-3">
            {menuLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
              </div>
            ) : menuTree.length > 0 ? (
              <MenuTreeCheckbox
                nodes={menuTree}
                checkedIds={checkedMenuIds}
                onToggle={handleToggleMenu}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无菜单，请先到菜单管理中创建菜单。
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMenuDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveMenuAssign} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              保存
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
              此操作无法撤销。确定要删除该角色吗？
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
