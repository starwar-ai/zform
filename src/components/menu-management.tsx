/**
 * MenuManagement
 * 菜单管理组件
 */

import { useState } from "react"
import { useMenuStore } from "@/stores/menu-store"
import type {
  Menu,
  CreateMenuInput,
  UpdateMenuInput,
  MenuTreeNode,
} from "@/types/menu"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, Menu as MenuIcon, ChevronRight } from "lucide-react"

const typeLabels = {
  menu: "菜单",
  button: "按钮",
}

const statusLabels = {
  visible: "显示",
  hidden: "隐藏",
}

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  visible: "default",
  hidden: "secondary",
}

// 递归渲染菜单树
function MenuTreeRows({
  nodes,
  onEdit,
  onDelete,
}: {
  nodes: MenuTreeNode[]
  onEdit: (menu: Menu) => void
  onDelete: (menuId: string) => void
}) {
  return (
    <>
      {nodes.map((node) => (
        <>
          <TableRow key={node.id}>
            <TableCell className="font-medium">
              <div
                className="flex items-center gap-1"
                style={{ paddingLeft: `${node.level * 24}px` }}
              >
                {node.children.length > 0 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <span>{node.title}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {node.icon || "-"}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {node.path || "-"}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">
                {typeLabels[node.type]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={statusColors[node.status]}>
                {statusLabels[node.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {node.order}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(node.createdAt).toLocaleString("zh-CN")}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(node)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(node.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
          {node.children.length > 0 && (
            <MenuTreeRows
              nodes={node.children}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </>
      ))}
    </>
  )
}

export function MenuManagement() {
  const { createMenu, updateMenu, deleteMenu, getMenuTree, getAllMenus } =
    useMenuStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [deletingMenuId, setDeletingMenuId] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateMenuInput>({
    title: "",
    icon: "",
    path: "",
    parentId: null,
    order: 0,
    type: "menu",
    permission: "",
    status: "visible",
  })

  const menuTree = getMenuTree()
  const allMenus = getAllMenus()
  const totalCount = allMenus.length

  const handleCreate = () => {
    setEditingMenu(null)
    setFormData({
      title: "",
      icon: "",
      path: "",
      parentId: null,
      order: 0,
      type: "menu",
      permission: "",
      status: "visible",
    })
    setDialogOpen(true)
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setFormData({
      title: menu.title,
      icon: menu.icon,
      path: menu.path,
      parentId: menu.parentId,
      order: menu.order,
      type: menu.type,
      permission: menu.permission,
      status: menu.status,
    })
    setDialogOpen(true)
  }

  const handleDelete = (menuId: string) => {
    setDeletingMenuId(menuId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deletingMenuId) {
      deleteMenu(deletingMenuId)
      setDeleteDialogOpen(false)
      setDeletingMenuId(null)
    }
  }

  const handleSubmit = () => {
    if (editingMenu) {
      // 更新菜单
      const updateData: UpdateMenuInput = {
        title: formData.title,
        icon: formData.icon,
        path: formData.path,
        parentId: formData.parentId,
        order: formData.order,
        type: formData.type,
        permission: formData.permission,
        status: formData.status,
      }
      updateMenu(editingMenu.id, updateData)
    } else {
      // 创建菜单
      createMenu(formData)
    }
    setDialogOpen(false)
  }

  // 获取可选的父菜单列表（排除当前菜单及其子菜单）
  const getAvailableParentMenus = () => {
    if (!editingMenu) return allMenus

    const excludeIds = new Set<string>([editingMenu.id])
    const addChildren = (parentId: string) => {
      allMenus.forEach((menu) => {
        if (menu.parentId === parentId) {
          excludeIds.add(menu.id)
          addChildren(menu.id)
        }
      })
    }
    addChildren(editingMenu.id)

    return allMenus.filter((menu) => !excludeIds.has(menu.id))
  }

  const availableParents = getAvailableParentMenus()

  return (
    <div className="space-y-6 p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MenuIcon className="h-5 w-5" />
          菜单管理
        </h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          新建菜单
        </Button>
      </div>

      {/* 菜单列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            菜单列表
            <Badge variant="secondary" className="text-xs">
              {totalCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {menuTree.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>菜单名称</TableHead>
                  <TableHead>图标</TableHead>
                  <TableHead>路径</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <MenuTreeRows
                  nodes={menuTree}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              暂无菜单
            </p>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑菜单对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMenu ? "编辑菜单" : "新建菜单"}
            </DialogTitle>
            <DialogDescription>
              {editingMenu ? "修改菜单信息" : "创建新菜单项"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">菜单名称 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="例如: 系统管理"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">图标</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="例如: Settings"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="path">路径</Label>
              <Input
                id="path"
                value={formData.path}
                onChange={(e) =>
                  setFormData({ ...formData, path: e.target.value })
                }
                placeholder="例如: /system"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentId">父菜单</Label>
              <Select
                value={formData.parentId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    parentId: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger id="parentId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无（顶级菜单）</SelectItem>
                  {availableParents
                    .filter((m) => m.type === "menu")
                    .map((menu) => (
                      <SelectItem key={menu.id} value={menu.id}>
                        {menu.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "menu" | "button") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="menu">菜单</SelectItem>
                  <SelectItem value="button">按钮</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">排序</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission">权限标识</Label>
              <Input
                id="permission"
                value={formData.permission}
                onChange={(e) =>
                  setFormData({ ...formData, permission: e.target.value })
                }
                placeholder="例如: system:menu:view"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "visible" | "hidden") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">显示</SelectItem>
                  <SelectItem value="hidden">隐藏</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingMenu ? "保存" : "创建"}
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
              此操作将删除该菜单及其所有子菜单，且无法撤销。确定要继续吗？
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
