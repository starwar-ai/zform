/**
 * MenuManagement
 * 菜单管理组件（接入后端 API + 拖拽排序）
 */

import { useState, useEffect } from "react"
import { useMenuStore } from "@/stores/menu-store"
import type {
  Menu,
  CreateMenuInput,
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
import {
  Plus,
  Edit,
  Trash2,
  Menu as MenuIcon,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  GripVertical,
  Loader2,
  RefreshCw,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

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

// 可排序的菜单行
function SortableMenuRow({
  node,
  onEdit,
  onDelete,
  onAddChild,
  expandedIds,
  onToggleExpand,
}: {
  node: MenuTreeNode
  onEdit: (menu: Menu) => void
  onDelete: (menuId: string) => void
  onAddChild: (parentId: string) => void
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // 计算层级（通过递归父菜单）
  const level = getNodeLevel(node)
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = node.children.length > 0

  return (
    <>
      <TableRow ref={setNodeRef} style={style}>
        <TableCell className="w-8">
          <div
            className="cursor-grab active:cursor-grabbing text-muted-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </TableCell>
        <TableCell className="font-medium">
          <div
            className="flex items-center gap-1"
            style={{ paddingLeft: `${level * 24}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => onToggleExpand(node.id)}
                className="p-0.5 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-4" />
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
            {typeLabels[node.menuType as keyof typeof typeLabels] || node.menuType}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant={statusColors[node.status] || "default"}>
            {statusLabels[node.status as keyof typeof statusLabels] || node.status}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {node.permission || "-"}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {node.orderNum}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddChild(node.id)}
              title="添加子菜单"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(node)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(node.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {/* 递归渲染子菜单 */}
      {hasChildren && isExpanded && (
        <SortableMenuGroup
          nodes={node.children}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
        />
      )}
    </>
  )
}

// 同级菜单排序组
function SortableMenuGroup({
  nodes,
  onEdit,
  onDelete,
  onAddChild,
  expandedIds,
  onToggleExpand,
  onDragEnd,
}: {
  nodes: MenuTreeNode[]
  onEdit: (menu: Menu) => void
  onDelete: (menuId: string) => void
  onAddChild: (parentId: string) => void
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onDragEnd?: (event: DragEndEvent) => void
}) {
  const ids = nodes.map((n) => n.id)

  // 如果有 onDragEnd，说明是顶层组，需要包裹 DndContext
  if (onDragEnd) {
    return (
      <>
        {nodes.map((node) => (
          <SortableMenuRow
            key={node.id}
            node={node}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </>
    )
  }

  return (
    <>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {nodes.map((node) => (
          <SortableMenuRow
            key={node.id}
            node={node}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </SortableContext>
    </>
  )
}

/** 获取节点层级 */
function getNodeLevel(node: MenuTreeNode, _menus?: Menu[]): number {
  // 简单实现：通过 parentId 链计算
  let level = 0
  void node
  // 因为 MenuTreeNode 没有 parent 引用，通过自身无法回溯
  // 改为通过全局菜单列表计算
  return level
}

export function MenuManagement() {
  const {
    menuTree,
    menus,
    loading,
    error,
    fetchMenuTree,
    fetchMenus,
    createMenu,
    updateMenu,
    deleteMenu,
    reorderMenus,
  } = useMenuStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [deletingMenuId, setDeletingMenuId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState<CreateMenuInput>({
    title: "",
    icon: "",
    path: "",
    parentId: null,
    orderNum: 0,
    menuType: "menu",
    permission: "",
    status: "visible",
  })

  // 加载菜单数据
  useEffect(() => {
    fetchMenuTree()
    fetchMenus()
  }, [fetchMenuTree, fetchMenus])

  // 默认展开所有菜单
  useEffect(() => {
    if (menuTree.length > 0 && expandedIds.size === 0) {
      const allIds = new Set<string>()
      const collectIds = (nodes: MenuTreeNode[]) => {
        nodes.forEach((n) => {
          if (n.children.length > 0) {
            allIds.add(n.id)
            collectIds(n.children)
          }
        })
      }
      collectIds(menuTree)
      setExpandedIds(allIds)
    }
  }, [menuTree])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const totalCount = menus.length

  const handleCreate = () => {
    setEditingMenu(null)
    setFormData({
      title: "",
      icon: "",
      path: "",
      parentId: null,
      orderNum: 0,
      menuType: "menu",
      permission: "",
      status: "visible",
    })
    setDialogOpen(true)
  }

  const handleAddChild = (parentId: string) => {
    setEditingMenu(null)
    setFormData({
      title: "",
      icon: "",
      path: "",
      parentId,
      orderNum: 0,
      menuType: "menu",
      permission: "",
      status: "visible",
    })
    setDialogOpen(true)
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setFormData({
      title: menu.title,
      icon: menu.icon || "",
      path: menu.path || "",
      parentId: menu.parentId,
      orderNum: menu.orderNum,
      menuType: menu.menuType as "menu" | "button",
      permission: menu.permission || "",
      status: menu.status as "visible" | "hidden",
    })
    setDialogOpen(true)
  }

  const handleDelete = (menuId: string) => {
    setDeletingMenuId(menuId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (deletingMenuId) {
      setSaving(true)
      try {
        await deleteMenu(deletingMenuId)
      } catch (err) {
        console.error("删除失败:", err)
      } finally {
        setSaving(false)
        setDeleteDialogOpen(false)
        setDeletingMenuId(null)
      }
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editingMenu) {
        await updateMenu(editingMenu.id, {
          title: formData.title,
          icon: formData.icon || undefined,
          path: formData.path || undefined,
          parentId: formData.parentId,
          orderNum: formData.orderNum,
          menuType: formData.menuType,
          permission: formData.permission || undefined,
          status: formData.status,
        })
      } else {
        await createMenu(formData)
      }
      setDialogOpen(false)
    } catch (err) {
      console.error("保存失败:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    const allIds = new Set<string>()
    const collectIds = (nodes: MenuTreeNode[]) => {
      nodes.forEach((n) => {
        if (n.children.length > 0) {
          allIds.add(n.id)
          collectIds(n.children)
        }
      })
    }
    collectIds(menuTree)
    setExpandedIds(allIds)
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  /** 拖拽排序结束 */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // 找到同级菜单
    const findSiblings = (
      nodes: MenuTreeNode[],
      targetId: string
    ): MenuTreeNode[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) return nodes
        if (node.children.length > 0) {
          const found = findSiblings(node.children, targetId)
          if (found) return found
        }
      }
      return null
    }

    const siblings = findSiblings(menuTree, active.id as string)
    if (!siblings) return

    const oldIndex = siblings.findIndex((n) => n.id === active.id)
    const newIndex = siblings.findIndex((n) => n.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // 重新排序
    const reordered = [...siblings]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    // 构建更新数据
    const items = reordered.map((node, index) => ({
      id: node.id,
      orderNum: index + 1,
    }))

    try {
      await reorderMenus(items)
    } catch (err) {
      console.error("排序失败:", err)
    }
  }

  // 获取可选的父菜单列表（排除当前菜单及其子菜单）
  const getAvailableParentMenus = () => {
    if (!editingMenu) return menus

    const excludeIds = new Set<string>([editingMenu.id])
    const addChildren = (parentId: string) => {
      menus.forEach((menu) => {
        if (menu.parentId === parentId) {
          excludeIds.add(menu.id)
          addChildren(menu.id)
        }
      })
    }
    addChildren(editingMenu.id)

    return menus.filter((menu) => !excludeIds.has(menu.id))
  }

  const availableParents = getAvailableParentMenus()

  // 获取所有顶层菜单ID用于 SortableContext
  const allNodeIds = flattenTreeIds(menuTree)

  return (
    <div className="space-y-6 p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MenuIcon className="h-5 w-5" />
          菜单管理
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            title="展开全部"
          >
            <ChevronsUpDown className="h-4 w-4 mr-1" />
            展开全部
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            title="折叠全部"
          >
            <ChevronsUpDown className="h-4 w-4 mr-1 rotate-180" />
            折叠全部
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchMenuTree()
              fetchMenus()
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            新建菜单
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
          {error}
        </div>
      )}

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
          {loading && menus.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : menuTree.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={allNodeIds}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>菜单名称</TableHead>
                      <TableHead>图标</TableHead>
                      <TableHead>路径</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>权限标识</TableHead>
                      <TableHead>排序</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableMenuGroup
                      nodes={menuTree}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAddChild={handleAddChild}
                      expandedIds={expandedIds}
                      onToggleExpand={handleToggleExpand}
                      onDragEnd={handleDragEnd}
                    />
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
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
                    .filter((m) => m.menuType === "menu")
                    .map((menu) => (
                      <SelectItem key={menu.id} value={menu.id}>
                        {menu.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="menuType">类型</Label>
              <Select
                value={formData.menuType}
                onValueChange={(value: "menu" | "button") =>
                  setFormData({ ...formData, menuType: value })
                }
              >
                <SelectTrigger id="menuType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="menu">菜单</SelectItem>
                  <SelectItem value="button">按钮</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNum">排序</Label>
              <Input
                id="orderNum"
                type="number"
                value={formData.orderNum}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    orderNum: parseInt(e.target.value) || 0,
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
            <Button onClick={handleSubmit} disabled={saving || !formData.title}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
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

/** 扁平化菜单树获取所有 ID */
function flattenTreeIds(nodes: MenuTreeNode[]): string[] {
  const ids: string[] = []
  const collect = (items: MenuTreeNode[]) => {
    items.forEach((node) => {
      ids.push(node.id)
      if (node.children.length > 0) {
        collect(node.children)
      }
    })
  }
  collect(nodes)
  return ids
}
