/**
 * UserManagement
 * 用户管理组件（接入后端 API）
 */

import { useState, useEffect } from "react"
import { useUserStore } from "@/stores/user-store"
import { useRoleStore } from "@/stores/role-store"
import type { User, CreateUserInput, UpdateUserInput } from "@/types/user"
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
import { Plus, Edit, Trash2, Users, Loader2, RefreshCw } from "lucide-react"

const statusLabels = {
  active: "激活",
  inactive: "停用",
}

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
}

export function UserManagement() {
  const {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    assignRoles,
    getAllUsers,
  } = useUserStore()
  const { roles, fetchRoles, getAllRoles } = useRoleStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  const [formData, setFormData] = useState<CreateUserInput & { password?: string }>({
    username: "",
    name: "",
    email: "",
    phone: "",
    roleIds: [],
    department: "",
    status: "active",
    password: "",
  })

  // 加载数据
  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [fetchUsers, fetchRoles])

  const allUsers = getAllUsers()
  const allRoles = getAllRoles()

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      username: "",
      name: "",
      email: "",
      phone: "",
      roleIds: [],
      department: "",
      status: "active",
      password: "",
    })
    setSelectedRoleIds([])
    setDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email || "",
      phone: user.phone || "",
      roleIds: user.roleIds,
      department: user.department || "",
      status: user.status,
      password: "",
    })
    setSelectedRoleIds(user.roleIds)
    setDialogOpen(true)
  }

  const handleDelete = (userId: string) => {
    setDeletingUserId(userId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (deletingUserId) {
      setSaving(true)
      try {
        await deleteUser(deletingUserId)
      } catch (err) {
        console.error("删除失败:", err)
      } finally {
        setSaving(false)
        setDeleteDialogOpen(false)
        setDeletingUserId(null)
      }
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editingUser) {
        // 更新用户
        await updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          department: formData.department || undefined,
          status: formData.status,
          password: formData.password || undefined,
        })
        // 更新角色分配
        await assignRoles(editingUser.id, selectedRoleIds)
      } else {
        // 创建用户
        await createUser({
          ...formData,
          roleIds: selectedRoleIds,
          password: formData.password || undefined,
        })
      }
      setDialogOpen(false)
    } catch (err) {
      console.error("保存失败:", err)
    } finally {
      setSaving(false)
    }
  }

  const getRoleNames = (roleIds: string[]) => {
    return roleIds
      .map((id) => allRoles.find((r) => r.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  return (
    <div className="space-y-6 p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          用户管理
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            新建用户
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
          {error}
        </div>
      )}

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            用户列表
            <Badge variant="secondary" className="text-xs">
              {allUsers.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : allUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.email || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.phone || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.department || "-"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getRoleNames(user.roleIds) || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[user.status]}>
                        {statusLabels[user.status as keyof typeof statusLabels] || user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
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
              暂无用户
            </p>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑用户对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "编辑用户" : "新建用户"}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? "修改用户信息" : "创建新用户账号"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名 *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                disabled={!!editingUser}
                placeholder="登录用户名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {editingUser ? "密码（留空不修改）" : "密码"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password || ""}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={editingUser ? "留空不修改" : "默认 123456"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="真实姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">电话</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="手机号码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">部门</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="所属部门"
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
            <div className="col-span-2 space-y-2">
              <Label>角色</Label>
              <div className="flex flex-wrap gap-2">
                {allRoles.map((role) => {
                  const isSelected = selectedRoleIds.includes(role.id)
                  return (
                    <Badge
                      key={role.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedRoleIds((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== role.id)
                            : [...prev, role.id]
                        )
                      }}
                    >
                      {role.name}
                    </Badge>
                  )
                })}
                {allRoles.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    暂无角色，请先创建角色
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !formData.username || !formData.name}
            >
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingUser ? "保存" : "创建"}
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
              此操作无法撤销。确定要删除该用户吗？
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
