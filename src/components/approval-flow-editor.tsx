/**
 * ApprovalFlowEditor
 *
 * 审批规则编辑器页面。左右分栏：左侧表单（基本信息 + 级别构建器），右侧实时流程图预览。
 * 支持 @dnd-kit 拖拽排序审批级别。作为独立标签页显示。
 */

import { useState, useEffect, useCallback } from "react"
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
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

import { useRoleStore } from "@/stores/role-store"
import { useUserStore } from "@/stores/user-store"
import { useTabStore } from "@/stores/tab-store"
import type { ApprovalLevelConfig, ApprovalRuleResponse } from "@/apis/approval-api"
import {
  getApprovalRulesApi,
  createApprovalRuleApi,
  updateApprovalRuleApi,
} from "@/apis/approval-api"
import { ApprovalFlowVisualizer } from "./approval-flow-visualizer"
import {
  approvalTemplates,
  type ApprovalTemplate,
} from "./approval-flow-templates"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  GripVertical,
  Plus,
  Trash2,
  LayoutTemplate,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Save,
  Loader2,
} from "lucide-react"
import { nanoid } from "nanoid"

// ============================================================
// DocType Options
// ============================================================

const docTypeOptions = [
  { value: "sales_contract", label: "销售合同" },
  { value: "export_sales_contract", label: "出口销售合同" },
  { value: "domestic_sales_contract", label: "内销合同" },
  { value: "purchase_plan", label: "采购计划" },
  { value: "purchase_contract", label: "采购合同" },
  { value: "inspection_order", label: "检验单" },
  { value: "invoicing_notice", label: "开票通知" },
  { value: "payment_apply", label: "付款申请" },
]

// ============================================================
// Types
// ============================================================

interface ApprovalFlowEditorProps {
  ruleId?: string
}

interface LevelItem extends ApprovalLevelConfig {
  _id: string
}

interface ConditionConfig {
  field: string
  operator: string
  value: string
}

// ============================================================
// Sortable Level Card
// ============================================================

function SortableLevelCard({
  item,
  index,
  roles,
  users,
  onUpdate,
  onDelete,
}: {
  item: LevelItem
  index: number
  roles: { id: string; code: string; name: string }[]
  users: { id: string; name: string }[]
  onUpdate: (id: string, data: Partial<LevelItem>) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [rolePopoverOpen, setRolePopoverOpen] = useState(false)
  const [userPopoverOpen, setUserPopoverOpen] = useState(false)

  const toggleRole = (roleId: string) => {
    const current = item.roleIds ?? []
    const next = current.includes(roleId)
      ? current.filter((r) => r !== roleId)
      : [...current, roleId]
    onUpdate(item._id, { roleIds: next })
  }

  const toggleUser = (userId: string) => {
    const current = item.userIds ?? []
    const next = current.includes(userId)
      ? current.filter((u) => u !== userId)
      : [...current, userId]
    onUpdate(item._id, { userIds: next })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg p-3 bg-card space-y-2",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Header with drag handle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground font-medium">
          级别 {index + 1}
        </span>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(item._id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Name */}
      <div>
        <Input
          value={item.name}
          onChange={(e) => onUpdate(item._id, { name: e.target.value })}
          placeholder="级别名称"
          className="h-8 text-sm"
        />
      </div>

      {/* Mode */}
      <div>
        <Select
          value={item.mode ?? "any"}
          onValueChange={(v) =>
            onUpdate(item._id, { mode: v as "single" | "any" | "all" })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">或签（任一通过）</SelectItem>
            <SelectItem value="all">会签（全部通过）</SelectItem>
            <SelectItem value="single">单签（指定一人）</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Roles multi-select */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">
          审批角色
        </Label>
        <Popover open={rolePopoverOpen} onOpenChange={setRolePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between h-8 text-sm font-normal"
            >
              <span className="truncate">
                {(item.roleIds ?? []).length > 0
                  ? (item.roleIds ?? [])
                      .map((rid) => roles.find((r) => r.code === rid)?.name ?? rid)
                      .join(", ")
                  : "选择角色..."}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-1" align="start">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                onClick={() => toggleRole(role.code)}
              >
                <Checkbox
                  checked={(item.roleIds ?? []).includes(role.code)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-sm">{role.name}</span>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Users multi-select */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">
          审批用户
        </Label>
        <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between h-8 text-sm font-normal"
            >
              <span className="truncate">
                {(item.userIds ?? []).length > 0
                  ? (item.userIds ?? [])
                      .map((uid) => users.find((u) => u.id === uid)?.name ?? uid)
                      .join(", ")
                  : "选择用户..."}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-1 max-h-[200px] overflow-y-auto" align="start">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                onClick={() => toggleUser(user.id)}
              >
                <Checkbox
                  checked={(item.userIds ?? []).includes(user.id)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-sm">{user.name}</span>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

// ============================================================
// Template Selector
// ============================================================

function TemplateSelector({
  onSelect,
}: {
  onSelect: (template: ApprovalTemplate) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-1.5">
          <LayoutTemplate className="h-3.5 w-3.5" />
          从模板创建
        </span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </Button>
      {expanded && (
        <div className="grid grid-cols-1 gap-1.5">
          {approvalTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="text-left border rounded-md p-2 hover:bg-accent transition-colors"
              onClick={() => {
                onSelect(tpl)
                setExpanded(false)
              }}
            >
              <div className="text-sm font-medium">{tpl.name}</div>
              <div className="text-xs text-muted-foreground">
                {tpl.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Main Editor Page Component
// ============================================================

export function ApprovalFlowEditor({ ruleId }: ApprovalFlowEditorProps) {
  const { openTab } = useTabStore()
  const isEdit = !!ruleId

  // Rule data loading
  const [rule, setRule] = useState<ApprovalRuleResponse | null>(null)
  const [loadingRule, setLoadingRule] = useState(!!ruleId)

  // Form state
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [docType, setDocType] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [levels, setLevels] = useState<LevelItem[]>([])
  const [noCondition, setNoCondition] = useState(true)
  const [condition, setCondition] = useState<ConditionConfig>({
    field: "",
    operator: "gt",
    value: "",
  })
  const [saving, setSaving] = useState(false)

  // Load rule data if editing
  useEffect(() => {
    if (!ruleId) {
      setLoadingRule(false)
      return
    }
    setLoadingRule(true)
    getApprovalRulesApi().then((rules) => {
      const found = rules.find((r) => r.id === ruleId)
      if (found) {
        setRule(found)
        setCode(found.code)
        setName(found.name)
        setDocType(found.docType)
        setEnabled(found.enabled)
        setLevels(found.levels.map((l) => ({ ...l, _id: nanoid() })))
        setNoCondition(!found.condition)
        if (found.condition) {
          const c = found.condition as ConditionConfig
          setCondition(c)
        }
      }
      setLoadingRule(false)
    }).catch(() => {
      setLoadingRule(false)
    })
  }, [ruleId])

  // Load roles and users
  const roleStore = useRoleStore()
  const userStore = useUserStore()

  useEffect(() => {
    if (roleStore.roles.length === 0) roleStore.fetchRoles()
    if (userStore.users.length === 0) userStore.fetchUsers()
  }, [])

  const roles = roleStore.roles.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
  }))
  const users = userStore.users.map((u) => ({ id: u.id, name: u.name }))

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        setLevels((prev) => {
          const oldIndex = prev.findIndex((l) => l._id === active.id)
          const newIndex = prev.findIndex((l) => l._id === over.id)
          return arrayMove(prev, oldIndex, newIndex)
        })
      }
    },
    []
  )

  const addLevel = () => {
    setLevels((prev) => [
      ...prev,
      {
        _id: nanoid(),
        name: `第${prev.length + 1}级审批`,
        mode: "any",
        roleIds: [],
        userIds: [],
      },
    ])
  }

  const updateLevel = (id: string, data: Partial<LevelItem>) => {
    setLevels((prev) =>
      prev.map((l) => (l._id === id ? { ...l, ...data } : l))
    )
  }

  const deleteLevel = (id: string) => {
    setLevels((prev) => prev.filter((l) => l._id !== id))
  }

  const handleTemplateSelect = (tpl: ApprovalTemplate) => {
    setLevels(tpl.levels.map((l) => ({ ...l, _id: nanoid() })))
  }

  const goBack = () => {
    openTab("approval-flow-management", {}, "流程配置")
  }

  const handleSubmit = async () => {
    const cleanLevels: ApprovalLevelConfig[] = levels.map(
      ({ _id, ...rest }) => rest
    )
    const conditionData = noCondition ? null : condition

    setSaving(true)
    try {
      if (isEdit && ruleId) {
        const result = await updateApprovalRuleApi(ruleId, {
          name,
          docType,
          levels: cleanLevels,
          condition: conditionData,
          enabled,
        })
        if (result.warning) {
          alert(`更新成功: ${result.warning}`)
        }
      } else {
        await createApprovalRuleApi({
          code,
          name,
          docType,
          levels: cleanLevels,
          condition: conditionData,
          enabled,
        })
      }
      goBack()
    } catch (err) {
      alert(`保存失败: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  // Preview levels (without _id)
  const previewLevels: ApprovalLevelConfig[] = levels.map(
    ({ _id, ...rest }) => rest
  )

  const isValid =
    code.trim() !== "" &&
    name.trim() !== "" &&
    docType !== "" &&
    levels.length > 0 &&
    levels.every((l) => l.name.trim() !== "")

  if (loadingRule) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b bg-background">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {isEdit ? "编辑审批规则" : "新建审批规则"}
        </h2>
        <div className="flex-1" />
        <Button variant="outline" onClick={goBack}>
          取消
        </Button>
        <Button disabled={!isValid || saving} onClick={handleSubmit}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              {isEdit ? "更新规则" : "创建规则"}
            </>
          )}
        </Button>
      </div>

      {/* Main content: left-right split */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: Form */}
        <ResizablePanel defaultSize={50} minSize={35}>
          <ScrollArea className="h-full">
            <div className="p-6 space-y-5 max-w-[600px]">
              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">基本信息</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">规则编码</Label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="如 RULE_SC_001"
                      disabled={isEdit}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">规则名称</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="如 销售合同审批"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">单据类型</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择单据类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {docTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <Checkbox
                      id="enabled"
                      checked={enabled}
                      onCheckedChange={(v) => setEnabled(v === true)}
                    />
                    <Label htmlFor="enabled" className="text-sm cursor-pointer">
                      启用规则
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Templates */}
              {!isEdit && (
                <>
                  <TemplateSelector onSelect={handleTemplateSelect} />
                  <Separator />
                </>
              )}

              {/* Level Builder */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">审批级别</h4>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={levels.map((l) => l._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {levels.map((item, idx) => (
                        <SortableLevelCard
                          key={item._id}
                          item={item}
                          index={idx}
                          roles={roles}
                          users={users}
                          onUpdate={updateLevel}
                          onDelete={deleteLevel}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={addLevel}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  添加审批级别
                </Button>
              </div>

              <Separator />

              {/* Condition */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">触发条件</h4>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="no-condition"
                    checked={noCondition}
                    onCheckedChange={(v) => setNoCondition(v === true)}
                  />
                  <Label
                    htmlFor="no-condition"
                    className="text-sm cursor-pointer"
                  >
                    无条件（所有单据触发）
                  </Label>
                </div>
                {!noCondition && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={condition.field}
                      onChange={(e) =>
                        setCondition((c) => ({ ...c, field: e.target.value }))
                      }
                      placeholder="字段名"
                    />
                    <Select
                      value={condition.operator}
                      onValueChange={(v) =>
                        setCondition((c) => ({ ...c, operator: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gt">大于</SelectItem>
                        <SelectItem value="gte">大于等于</SelectItem>
                        <SelectItem value="lt">小于</SelectItem>
                        <SelectItem value="lte">小于等于</SelectItem>
                        <SelectItem value="eq">等于</SelectItem>
                        <SelectItem value="neq">不等于</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={condition.value}
                      onChange={(e) =>
                        setCondition((c) => ({ ...c, value: e.target.value }))
                      }
                      placeholder="值"
                    />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Live Preview */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b">
              <h4 className="text-sm font-semibold">流程预览</h4>
            </div>
            <div className="flex-1">
              <ApprovalFlowVisualizer
                levels={previewLevels}
                interactive
                className="h-full"
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
