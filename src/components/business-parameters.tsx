/**
 * BusinessParameters
 *
 * 统一业务配置组件。
 * 通过配置驱动渲染不同业务参数的 Tab 页，支持树形和扁平列表两种展示模式。
 * 新增参数类型只需在 CATEGORY_CONFIGS 数组中添加配置即可。
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import type {
  ParameterConfig,
  ParameterTypeKey,
  ParameterFormField,
  ParameterColumn,
} from "@/types/parameter"
import {
  fetchParameterListApi,
  createParameterApi,
  updateParameterApi,
  deleteParameterApi,
  reorderParameterApi,
} from "@/apis/business-entity-api"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { OtherConfigPanel } from "./business-entities/other-config-panel"
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  Tags,
  Users,
  Package,
  Globe,
  Route,
  Settings,
  GripVertical,
  Banknote,
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

// ==================== 分类配置注册 ====================

/**
 * 所有分类配置。新增分类类型在此添加即可。
 */
export const CATEGORY_CONFIGS: ParameterConfig[] = [
  {
    key: "customer",
    label: "客户分类",
    icon: "Users",
    apiPath: "/parameters/customer",
    isTree: true,
    nameField: "name",
    codeField: "code",
    columns: [
      { key: "name", label: "分类名称", width: "280px" },
      { key: "code", label: "分类编码" },
      { key: "sortOrder", label: "排序", width: "80px" },
      { key: "createdAt", label: "创建时间", render: "date" },
    ],
    formFields: [
      { key: "code", label: "分类编码", type: "text", required: true, placeholder: "例如: CC001" },
      { key: "name", label: "分类名称", type: "text", required: true, placeholder: "例如: A类客户" },
      { key: "parentId", label: "上级分类", type: "parent-select" },
    ],
  },
  {
    key: "customer-source",
    label: "客户来源",
    icon: "Tags",
    apiPath: "/parameters/customer-source",
    isTree: false,
    nameField: "name",
    columns: [
      { key: "code", label: "标签编码", width: "160px" },
      { key: "name", label: "标签名称", width: "260px" },
      { key: "isCommon", label: "是否常用", render: "boolean" },
      { key: "sortOrder", label: "排序", width: "80px" },
      { key: "createdAt", label: "创建时间", render: "date" },
    ],
    formFields: [
      { key: "code", label: "标签编码", type: "text", required: true, placeholder: "例如: CS001" },
      { key: "name", label: "标签名称", type: "text", required: true, placeholder: "例如: 阿里巴巴" },
      { key: "isCommon", label: "是否常用", type: "boolean", defaultValue: false },
      { key: "sortOrder", label: "排序", type: "number", defaultValue: 0 },
    ],
  },
  {
    key: "payment-terms",
    label: "客户付款方式",
    icon: "Banknote",
    apiPath: "/parameters/payment-terms",
    isTree: false,
    nameField: "name",
    codeField: "code",
    columns: [
      { key: "code", label: "编号", width: "120px" },
      { key: "name", label: "结汇名称", width: "160px" },
      { key: "nameEng", label: "结汇英文名称", width: "160px" },
      { key: "dateType", label: "起始日类型", width: "100px" },
      { key: "duration", label: "天数", width: "80px" },
      { key: "createdAt", label: "创建时间", render: "date" },
    ],
    formFields: [
      { key: "code", label: "编号", type: "text", required: true, placeholder: "例如: TT" },
      { key: "name", label: "结汇名称", type: "text", required: true, placeholder: "例如: 电汇" },
      { key: "nameEng", label: "结汇英文名称", type: "text", required: true, placeholder: "例如: T/T" },
      { key: "dateType", label: "起始日类型", type: "number", placeholder: "起始日类型" },
      { key: "duration", label: "天数", type: "number", placeholder: "天数" },
    ],
  },
  {
    key: "product",
    label: "海关编码",
    icon: "Package",
    apiPath: "/parameters/product",
    isTree: false,
    nameField: "name",
    codeField: "code",
    columns: [
      { key: "code", label: "编号", width: "120px" },
      { key: "hsCode", label: "编码", width: "120px" },
      { key: "name", label: "商品名称", width: "200px" },
      { key: "customsUnit", label: "报关单位", width: "100px" },
      { key: "isCommon", label: "是否常用", render: "boolean", width: "100px" },
      { key: "sortOrder", label: "排序", width: "80px" },
      { key: "taxRefundRate", label: "退税率(%)" },
      { key: "taxRate", label: "征税率(%)" },
      { key: "levyRate", label: "征收率(%)" },
      { key: "secondUnit", label: "第二单位" },
      { key: "createdAt", label: "创建时间", render: "date" },
    ],
    formFields: [
      { key: "code", label: "编号", type: "text", required: true, placeholder: "例如: HS001" },
      { key: "hsCode", label: "编码", type: "text", required: true, placeholder: "例如: 6402.99" },
      { key: "name", label: "商品名称", type: "text", required: true, placeholder: "请输入商品名称" },
      { key: "customsUnit", label: "报关单位", type: "text", required: true, placeholder: "例如: 个、把" },
      { key: "isCommon", label: "是否常用", type: "boolean", defaultValue: false },
      { key: "sortOrder", label: "排序", type: "number", defaultValue: 0 },
      { key: "taxRefundRate", label: "退税率(%)", type: "number", required: true, placeholder: "例如: 13" },
      { key: "taxRate", label: "征税率(%)", type: "number", placeholder: "例如: 17" },
      { key: "levyRate", label: "征收率(%)", type: "number", placeholder: "例如: 3" },
      { key: "secondUnit", label: "第二单位", type: "text", placeholder: "例如: 千克" },
      { key: "fullName", label: "商品全称", type: "text", placeholder: "请输入商品全称" },
      { key: "remark", label: "备注", type: "text", placeholder: "请输入备注信息" },
    ],
  },
  {
    key: "exhibition",
    label: "展会分类",
    icon: "Globe",
    apiPath: "/parameters/exhibition",
    isTree: false,
    nameField: "name",
    columns: [
      { key: "name", label: "名称" },
      { key: "isDomestic", label: "是否国内系列", render: "boolean" },
      { key: "isCommon", label: "是否常用", render: "boolean", width: "100px" },
      { key: "sortOrder", label: "排序", width: "80px" },
      { key: "createdAt", label: "创建时间", render: "date" },
    ],
    formFields: [
      { key: "name", label: "名称", type: "text", required: true, placeholder: "例如: 广交会" },
      { key: "isDomestic", label: "是否国内系列", type: "boolean", defaultValue: false },
      { key: "isCommon", label: "是否常用", type: "boolean", defaultValue: false },
      { key: "sortOrder", label: "排序", type: "number", defaultValue: 0 },
    ],
  },
  {
    key: "order-route",
    label: "订单路径",
    icon: "Route",
    apiPath: "/parameters/order-routes",
    isTree: false,
    nameField: "path",
    columns: [
      { key: "path", label: "路径", width: "200px" },
      { key: "status", label: "状态", width: "120px" },
      { key: "description", label: "描述" },
      { key: "isCommon", label: "是否常用", render: "boolean", width: "100px" },
      { key: "sortOrder", label: "排序", width: "80px" },
      { key: "createdAt", label: "创建时间", render: "date" },
    ],
    formFields: [
      { key: "path", label: "路径", type: "text", required: true, placeholder: "例如: /orders/domestic" },
      { key: "status", label: "状态", type: "text", required: true, placeholder: "例如: active" },
      { key: "description", label: "描述", type: "text", placeholder: "请输入描述" },
      { key: "isCommon", label: "是否常用", type: "boolean", defaultValue: false },
      { key: "sortOrder", label: "排序", type: "number", defaultValue: 0 },
    ],
  },
  {
    key: "transport-method",
    label: "运输方式",
    icon: "Route",
    apiPath: "/parameters/transport-methods",
    isTree: false,
    nameField: "name",
    codeField: "code",
    columns: [
      { key: "code", label: "编码", width: "120px" },
      { key: "name", label: "中文名称", width: "160px" },
      { key: "nameEn", label: "英文名称", width: "160px" },
      { key: "isCommon", label: "是否常用", render: "boolean", width: "100px" },
      { key: "sortOrder", label: "排序", width: "80px" },
      { key: "isEnabled", label: "是否启用", render: "boolean", width: "100px" },
      { key: "createdAt", label: "创建时间", render: "date" },
    ],
    formFields: [
      { key: "code", label: "编码", type: "text", required: true, placeholder: "例如: SEA" },
      { key: "name", label: "中文名称", type: "text", required: true, placeholder: "例如: 海运" },
      { key: "nameEn", label: "英文名称", type: "text", placeholder: "例如: Sea" },
      { key: "isCommon", label: "是否常用", type: "boolean", defaultValue: false },
      { key: "isEnabled", label: "是否启用", type: "boolean", defaultValue: true },
      { key: "remark", label: "备注", type: "text", placeholder: "请输入备注" },
    ],
  },
  // 其他配置使用自定义面板
  {
    key: "other-config",
    label: "其他配置",
    icon: "Settings",
    apiPath: "", // 自定义面板不使用标准API
    isTree: false,
    nameField: "name",
    columns: [],
    formFields: [],
  },
]

// ==================== 图标映射 ====================

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Package,
  Globe,
  Tags,
  Route,
  Settings,
  Banknote,
}

function getCategoryIcon(iconName: string) {
  return categoryIconMap[iconName] || Tags
}

// ==================== 树形工具函数 ====================

interface TreeNode {
  id: string
  parentId?: string | null
  children?: TreeNode[]
  [key: string]: unknown
}

interface FlatNode extends TreeNode {
  level: number
  hasChildren: boolean
}

function flattenTree(
  nodes: TreeNode[],
  level: number,
  expandedIds: Set<string>
): FlatNode[] {
  const result: FlatNode[] = []
  for (const node of nodes) {
    const children = (node.children as TreeNode[]) || []
    result.push({
      ...node,
      level,
      hasChildren: children.length > 0,
    })
    if (children.length > 0 && expandedIds.has(node.id)) {
      result.push(...flattenTree(children, level + 1, expandedIds))
    }
  }
  return result
}

function countDescendants(node: TreeNode): number {
  const children = (node.children as TreeNode[]) || []
  let count = children.length
  for (const child of children) {
    count += countDescendants(child)
  }
  return count
}

/** 将树形数据扁平化为选择列表 */
function flattenForSelect(nodes: TreeNode[], nameField: string, level = 0): { id: string; name: string; level: number }[] {
  const result: { id: string; name: string; level: number }[] = []
  for (const node of nodes) {
    const name = String(node[nameField] || "")
    result.push({ id: node.id, name: "\u00A0\u00A0".repeat(level) + name, level })
    const children = (node.children as TreeNode[]) || []
    result.push(...flattenForSelect(children, nameField, level + 1))
  }
  return result
}

/** 判断配置是否支持拖拽排序（扁平列表） */
function supportsFlatReorder(config: ParameterConfig): boolean {
  return config.columns.some((c) => c.key === "sortOrder")
}

/** 在树中查找目标节点的兄弟节点列表 */
function findSiblings(nodes: TreeNode[], targetId: string): TreeNode[] | null {
  for (const node of nodes) {
    if (node.id === targetId) return nodes
    const children = (node.children as TreeNode[]) || []
    if (children.length > 0) {
      const found = findSiblings(children, targetId)
      if (found) return found
    }
  }
  return null
}

/** 扁平化树节点 ID（用于 SortableContext） */
function flattenTreeIds(nodes: TreeNode[]): string[] {
  const result: string[] = []
  for (const node of nodes) {
    result.push(node.id)
    const children = (node.children as TreeNode[]) || []
    if (children.length > 0) {
      result.push(...flattenTreeIds(children))
    }
  }
  return result
}

// 可排序的扁平行
function SortableFlatRow({
  item,
  config,
  renderCellValue,
  onEdit,
  onDelete,
}: {
  item: TreeNode
  config: ParameterConfig
  renderCellValue: (item: TreeNode, col: ParameterColumn) => React.ReactNode
  onEdit: (item: TreeNode) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
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
      {config.columns.map((col) => (
        <TableCell key={col.key}>
          <span className="text-sm">{renderCellValue(item, col)}</span>
        </TableCell>
      ))}
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
            <Edit className="h-3 w-3 mr-1" />
            编辑
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-3 w-3 mr-1" />
            删除
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// 可排序的树形行（同级拖拽）
function SortableTreeRow({
  node,
  config,
  expandedIds,
  toggleExpand,
  renderCellValue,
  countDescendants,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: FlatNode
  config: ParameterConfig
  expandedIds: Set<string>
  toggleExpand: (id: string) => void
  renderCellValue: (item: TreeNode, col: ParameterColumn) => React.ReactNode
  countDescendants: (node: TreeNode) => number
  onAddChild: (parentId: string) => void
  onEdit: (item: TreeNode) => void
  onDelete: (id: string) => void
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

  const hasChildren = node.hasChildren
  const isExpanded = expandedIds.has(node.id)

  return (
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
      {config.columns.map((col, colIdx) => (
        <TableCell key={col.key}>
          {colIdx === 0 ? (
            <div
              className="flex items-center gap-1"
              style={{ paddingLeft: `${node.level * 24}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="p-0.5 hover:bg-muted rounded shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <span className="w-5 shrink-0" />
              )}
              <span className="font-medium">{String(node[col.key] || "")}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">
              {renderCellValue(node, col)}
            </span>
          )}
        </TableCell>
      ))}
      <TableCell>
        {hasChildren && (
          <Badge variant="outline" className="text-xs">
            {countDescendants(node)}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddChild(node.id)}
            title="添加子级"
          >
            <FolderPlus className="h-3 w-3 mr-1" />
            子级
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(node)}>
            <Edit className="h-3 w-3 mr-1" />
            编辑
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(node.id)}>
            <Trash2 className="h-3 w-3 mr-1" />
            删除
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ==================== 单个分类 Tab 面板 ====================

function CategoryPanel({ config }: { config: ParameterConfig }) {
  const [data, setData] = useState<TreeNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TreeNode | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  // 初始化表单默认值
  const getDefaultFormData = useCallback(
    (parentId?: string | null): Record<string, unknown> => {
      const defaults: Record<string, unknown> = {}
      for (const field of config.formFields) {
        if (field.key === "parentId") {
          defaults[field.key] = parentId || null
        } else if (field.defaultValue !== undefined) {
          defaults[field.key] = field.defaultValue
        } else if (field.type === "boolean") {
          defaults[field.key] = false
        } else if (field.type === "number") {
          defaults[field.key] = 0
        } else {
          defaults[field.key] = ""
        }
      }
      return defaults
    },
    [config.formFields]
  )

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchParameterListApi<TreeNode>(config.key)
      setData(result)
      // 树形时默认展开顶级节点
      if (config.isTree) {
        const topIds = new Set(result.map((n) => n.id))
        setExpandedIds((prev) => new Set([...prev, ...topIds]))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }, [config.key, config.isTree])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 扁平列表拖拽结束
  const handleFlatDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id || !supportsFlatReorder(config)) return

      const oldIndex = data.findIndex((d) => d.id === active.id)
      const newIndex = data.findIndex((d) => d.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = [...data]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      const items = reordered.map((node, index) => ({
        id: node.id,
        sortOrder: index,
      }))

      try {
        await reorderParameterApi(config.key, items)
        await loadData()
      } catch (err) {
        console.error("排序失败:", err)
        alert(err instanceof Error ? err.message : "排序失败")
      }
    },
    [config, data, loadData]
  )

  const flatSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // 树形同级拖拽结束（仅客户分类）
  const handleTreeDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (config.key !== "customer") return
      const { active, over } = event
      if (!over || active.id === over.id) return

      const siblings = findSiblings(data, active.id as string)
      if (!siblings) return

      const oldIndex = siblings.findIndex((n) => n.id === active.id)
      const newIndex = siblings.findIndex((n) => n.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = [...siblings]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      const items = reordered.map((node, index) => ({
        id: node.id,
        sortOrder: index,
      }))

      try {
        await reorderParameterApi("customer", items)
        await loadData()
      } catch (err) {
        console.error("排序失败:", err)
        alert(err instanceof Error ? err.message : "排序失败")
      }
    },
    [config.key, data, loadData]
  )

  const treeSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // 展开/折叠
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 新建
  const handleCreate = (parentId?: string | null) => {
    setEditingItem(null)
    setFormData(getDefaultFormData(parentId))
    setDialogOpen(true)
  }

  // 编辑
  const handleEdit = (item: TreeNode) => {
    setEditingItem(item)
    const fd: Record<string, unknown> = {}
    for (const field of config.formFields) {
      fd[field.key] = item[field.key] ?? (field.defaultValue !== undefined ? field.defaultValue : "")
    }
    setFormData(fd)
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
      await deleteParameterApi(config.key, deletingItemId)
      await loadData()
    } catch (err) {
      console.error("删除失败:", err)
      alert(err instanceof Error ? err.message : "删除失败")
    } finally {
      setSaving(false)
      setDeleteDialogOpen(false)
      setDeletingItemId(null)
    }
  }

  // 提交
  const handleSubmit = async () => {
    setSaving(true)
    try {
      // 清理表单数据
      const submitData: Record<string, unknown> = { ...formData }
      // 如果 parentId 为空字符串，设置为 null
      if (submitData.parentId === "" || submitData.parentId === "__none__") {
        submitData.parentId = null
      }

      if (editingItem) {
        await updateParameterApi(config.key, editingItem.id, submitData)
      } else {
        await createParameterApi(config.key, submitData)
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error("保存失败:", err)
      alert(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  // 判断表单是否可提交
  const canSubmit = useMemo(() => {
    for (const field of config.formFields) {
      if (field.required) {
        const val = formData[field.key]
        if (val === undefined || val === null || val === "") return false
      }
    }
    return true
  }, [config.formFields, formData])

  // 父级选择选项
  const parentOptions = useMemo(() => {
    if (!config.isTree) return []
    return flattenForSelect(data, config.nameField)
  }, [data, config.isTree, config.nameField])

  // ---- 渲染表格内容 ----

  const renderCellValue = (item: TreeNode, col: ParameterColumn) => {
    const value = item[col.key]
    switch (col.render) {
      case "date":
        return value ? new Date(String(value)).toLocaleString("zh-CN") : "-"
      case "boolean":
        return (
          <Badge variant={value ? "default" : "secondary"} className="text-xs">
            {value ? "是" : "否"}
          </Badge>
        )
      case "badge":
        return value ? (
          <Badge variant="outline" className="text-xs">
            {String(value)}
          </Badge>
        ) : "-"
      default:
        return value !== null && value !== undefined ? String(value) : "-"
    }
  }

  // 树形表格渲染（客户分类支持同级拖拽）
  const renderTreeTable = () => {
    const flatNodes = flattenTree(data, 0, expandedIds) as FlatNode[]
    const sortableTree = config.key === "customer"
    const allIds = flattenTreeIds(data)

    const tableContent = (
      <Table>
        <TableHeader>
          <TableRow>
            {sortableTree && <TableHead className="w-8"></TableHead>}
            {config.columns.map((col) => (
              <TableHead key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </TableHead>
            ))}
            <TableHead className="w-[50px]">子级数</TableHead>
            <TableHead className="w-[200px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flatNodes.map((node) =>
            sortableTree ? (
              <SortableTreeRow
                key={node.id}
                node={node}
                config={config}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                renderCellValue={renderCellValue}
                countDescendants={countDescendants}
                onAddChild={handleCreate}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : (
              <TableRow key={node.id}>
                {config.columns.map((col, colIdx) => (
                  <TableCell key={col.key}>
                    {colIdx === 0 ? (
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
                        <span className="font-medium">{String(node[col.key] || "")}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {renderCellValue(node, col)}
                      </span>
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  {node.hasChildren && (
                    <Badge variant="outline" className="text-xs">
                      {countDescendants(node)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {config.isTree && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreate(node.id)}
                        title="添加子级"
                      >
                        <FolderPlus className="h-3 w-3 mr-1" />
                        子级
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(node)}>
                      <Edit className="h-3 w-3 mr-1" />
                      编辑
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(node.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    )

    if (sortableTree) {
      return (
        <DndContext
          sensors={treeSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleTreeDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
            {tableContent}
          </SortableContext>
        </DndContext>
      )
    }
    return tableContent
  }

  // 扁平列表表格渲染
  const renderFlatTable = () => {
    const sortable = supportsFlatReorder(config)
    const ids = data.map((d) => d.id)

    const tableContent = (
      <Table>
        <TableHeader>
          <TableRow>
            {sortable && <TableHead className="w-8"></TableHead>}
            {config.columns.map((col) => (
              <TableHead key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </TableHead>
            ))}
            <TableHead className="w-[160px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortable ? (
            data.map((item) => (
              <SortableFlatRow
                key={item.id}
                item={item}
                config={config}
                renderCellValue={renderCellValue}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                {config.columns.map((col) => (
                  <TableCell key={col.key}>
                    <span className="text-sm">{renderCellValue(item, col)}</span>
                  </TableCell>
                ))}
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
            ))
          )}
        </TableBody>
      </Table>
    )

    if (sortable) {
      return (
        <DndContext
          sensors={flatSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleFlatDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {tableContent}
          </SortableContext>
        </DndContext>
      )
    }
    return tableContent
  }

  // 渲染表单字段
  const renderFormField = (field: ParameterFormField) => {
    const value = formData[field.key]

    switch (field.type) {
      case "text":
        return (
          <Input
            value={String(value ?? "")}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            placeholder={field.placeholder}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={value !== undefined && value !== null ? Number(value) : 0}
            onChange={(e) => setFormData({ ...formData, [field.key]: Number(e.target.value) || 0 })}
            placeholder={field.placeholder}
          />
        )

      case "boolean":
        return (
          <div className="flex items-center gap-2 h-9">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) => setFormData({ ...formData, [field.key]: Boolean(checked) })}
            />
            <span className="text-sm text-muted-foreground">
              {Boolean(value) ? "是" : "否"}
            </span>
          </div>
        )

      case "select":
        return (
          <Select
            value={String(value ?? "")}
            onValueChange={(v) => setFormData({ ...formData, [field.key]: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "请选择"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "parent-select":
        return (
          <Select
            value={String(value ?? "__none__")}
            onValueChange={(v) =>
              setFormData({ ...formData, [field.key]: v === "__none__" ? null : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="无（顶级分类）" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">无（顶级分类）</SelectItem>
              {parentOptions
                .filter((opt) => opt.id !== editingItem?.id)
                .map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )

      default:
        return null
    }
  }

  const itemCount = config.isTree
    ? flattenTree(data, 0, expandedIds).length
    : data.length

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            共 {itemCount} 条
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button size="sm" onClick={() => handleCreate()}>
            <Plus className="h-4 w-4 mr-1" />
            新建{config.label}
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
            config.isTree ? renderTreeTable() : renderFlatTable()
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              暂无数据，请点击"新建{config.label}"创建。
            </p>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `编辑${config.label}` : `新建${config.label}`}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? `修改${config.label}信息` : `创建新${config.label}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {config.formFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderFormField(field)}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !canSubmit}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingItem ? "保存" : "创建"}
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
              此操作无法撤销。确定要删除该{config.label}吗？
              {config.isTree && "如果该分类下有子分类，将无法删除。"}
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

// ==================== 主组件 ====================

export function BusinessParameters() {
  const [activeKey, setActiveKey] = useState<ParameterTypeKey>(CATEGORY_CONFIGS[0].key)

  const activeConfig = CATEGORY_CONFIGS.find((c) => c.key === activeKey) || CATEGORY_CONFIGS[0]

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-2">
        <Tags className="h-5 w-5" />
        <h1 className="text-xl font-bold">参数配置</h1>
      </div>

      {/* 分类 Tab 切换 */}
      <Tabs value={activeKey} onValueChange={(v) => setActiveKey(v as ParameterTypeKey)}>
        <TabsList>
          {CATEGORY_CONFIGS.map((cfg) => {
            const Icon = getCategoryIcon(cfg.icon)
            return (
              <TabsTrigger key={cfg.key} value={cfg.key} className="flex items-center gap-1.5">
                <Icon className="h-4 w-4" />
                {cfg.label}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {/* 当前分类面板 */}
      {activeKey === 'other-config' ? (
        <OtherConfigPanel />
      ) : (
        <CategoryPanel key={activeKey} config={activeConfig} />
      )}
    </div>
  )
}