/**
 * RoleManagement
 * 角色管理组件
 */

import { useState } from "react"
import { useRoleStore } from "@/stores/role-store"
import { useUserStore } from "@/stores/user-store"
import type { Role, CreateRoleInput, UpdateRoleInput } from "@/types/role"
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
import { Plus, Edit, Trash2, Shield } from "lucide-react"

const statusLabels = {
  active: "激活",
  inactive: "停用",
}

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
}

export function RoleManagement() {
  const { createRole, updateRole, deleteRole, getAllRoles } = useRoleStore()
  const { getUsersByRole } = useUserStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateRoleInput>({
    code: "",
    name: "",
    description: "",
    permissions: [],
    status: "active",
  })

  const allRoles = getAllRoles()

  const handleCreate = () => {
    setEditingRole(null)
    setFormData({
      code: "",
      name: "",
      description: "",
      permissions: [],
      status: "active",
    })
    setDialogOpen(true)
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      code: role.code,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      status: role.status,
    })
    setDialogOpen(true)
  }

  const handleDelete = (roleId: string) => {
    const users = getUsersByRole(roleId)
    if (users.length > 0) {
      alert(`无法删除角色：还有 ${users.length} 个用户关联此角色`)
      return
    }
    setDeletingRoleId(roleId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deletingRoleId) {
      deleteRole(deletingRoleId)
      setDeleteDialogOpen(false)
      setDeletingRoleId(null)
    }
  }

  const handleSubmit = () => {
    if (editingRole) {
      // 更新角色
      const updateData: UpdateRoleInput = {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        status: formData.status,
      }
      updateRole(editingRole.id, updateData)
    } else {
      // 创建角色
      createRole(formData)
    }
    setDialogOpen(false)
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
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          新建角色
        </Button>
      </div>

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
          {allRoles.length > 0 ? (
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
                      {role.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getUserCount(role.id)} 人
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[role.status]}>
                        {statusLabels[role.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(role.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
            <Button onClick={handleSubmit}>
              {editingRole ? "保存" : "创建"}
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
            <AlertDialogAction onClick={handleConfirmDelete}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
