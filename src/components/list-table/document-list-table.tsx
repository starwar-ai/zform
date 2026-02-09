/**
 * DocumentListTable
 *
 * 单据列表适配组件。将 DocumentSchema + 服务端 API 适配为 ListTable。
 * 分页/筛选/排序均由服务端处理。
 *
 * 行操作和工具栏操作根据 Registry 中注册的 DocumentListActionConfig 动态构建。
 * 内置操作 (open / delete / delete-detail / copy-id) 由组件自行处理；
 * 自定义操作通过 onAction 回调交给外部处理。
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { registry } from "@/core/registry"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, FileText, List, MoreHorizontal } from "lucide-react"
import type { DocumentTypeId, DocumentActionDef, DocumentListActionConfig } from "@/core/types"
import type { FetchParams, FetchResult, ListTableColumn } from "./types"
import { ListTable } from "./list-table"
import {
  fetchDocumentListApi,
  deleteDocumentApi,
  deleteDocumentItemApi,
} from "@/lib/document-api"
import { useDocumentStore } from "@/stores/document-store"
import { useUserPermissions } from "@/hooks/use-user-permissions"
import type { FlatDocumentRow, ListMode } from "@/lib/document-api"

// ============================================================
// Props
// ============================================================

interface DocumentListTableProps {
  typeId: DocumentTypeId
  onOpenDocument: (docId: string, typeId?: string) => void
  /** 列表模式: document=单据模式(默认), detail=明细模式 */
  mode?: ListMode
  /** 明细模式下需要指定展示哪个明细表 */
  detailTableId?: string
  /**
   * 自定义操作回调: 处理非内置的行操作
   * @param actionId  操作 ID
   * @param row       行数据
   */
  onAction?: (actionId: string, row: FlatDocumentRow) => void
}

// ============================================================
// 默认 Action Config (未注册配置时的兜底方案)
// ============================================================

const DEFAULT_ROW_ACTIONS: DocumentActionDef[] = [
  { id: "open", label: "打开" },
  { id: "copy-id", label: "复制ID" },
]

const DEFAULT_ACTION_CONFIG: Omit<DocumentListActionConfig, "typeId"> = {
  rowActions: DEFAULT_ROW_ACTIONS,
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline" },
  ],
}

// ============================================================
// ActionCell 子组件
// ============================================================

interface RowAction {
  id: string
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}

function ActionCell({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false)
  const visibleActions = actions.filter((action) => action.disabled !== true)
  const inlineActions = visibleActions.slice(0, 2)
  const overflowActions = visibleActions.slice(2)

  return (
    <div className="flex items-center justify-center gap-1">
      {inlineActions.map((action) => (
        <Button
          key={action.id}
          variant="link"
          size="sm"
          className={`h-7 px-1 ${action.danger ? "text-destructive" : ""}`}
          onClick={(event) => {
            event.stopPropagation()
            action.onClick()
          }}
        >
          {action.label}
        </Button>
      ))}

      {overflowActions.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-1" align="end">
            <div className="flex flex-col">
              {overflowActions.map((action) => (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  className={`h-7 justify-start px-2 ${action.danger ? "text-destructive" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    setOpen(false)
                    action.onClick()
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

// ============================================================
// 主组件
// ============================================================

export function DocumentListTable({
  typeId,
  onOpenDocument,
  mode = "document",
  detailTableId,
  onAction,
}: DocumentListTableProps) {
  const schema = registry.getSchema(typeId)
  const actionConfig = registry.getActionConfig(typeId)
  const queryClient = useQueryClient()
  const { permissions } = useUserPermissions()
  const [currentMode, setCurrentMode] = useState<ListMode>(mode)
  const resolvedDetailTableId = useMemo(
    () => detailTableId ?? schema?.detailTables[0]?.id,
    [detailTableId, schema]
  )
  const fixedRightColumns = useMemo(() => ["_actions"], [])
  const fixedLeftColumns = useMemo(() => ["_selection"], [])
  const [selectedRows, setSelectedRows] = useState<FlatDocumentRow[]>([])
  const hasSelection = selectedRows.length > 0
  const canToggleToDetail = Boolean(resolvedDetailTableId)

  useEffect(() => {
    setCurrentMode(mode)
  }, [mode])

  useEffect(() => {
    if (!canToggleToDetail && currentMode === "detail") {
      setCurrentMode("document")
    }
  }, [canToggleToDetail, currentMode])

  const isDetailMode = currentMode === "detail"

  // ---- 合并后的操作配置 (注册配置 > 默认配置) + 权限过滤 ----
  const resolvedRowActions = useMemo<DocumentActionDef[]>(
    () => {
      const actions = actionConfig?.rowActions ?? DEFAULT_ACTION_CONFIG.rowActions
      return actions.filter((a) => !a.permission || permissions.has(a.permission))
    },
    [actionConfig, permissions]
  )

  const resolvedToolbarActions = useMemo(
    () => {
      const actions = actionConfig?.toolbarActions ?? DEFAULT_ACTION_CONFIG.toolbarActions
      return actions?.filter((a) => !a.permission || permissions.has(a.permission))
    },
    [actionConfig, permissions]
  )

  // ============================================================
  // 内置操作 handler
  // ============================================================

  const handleCopyText = useCallback(async (text: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      console.warn("复制失败，请手动复制", text)
    }
  }, [])

  // 新建单据 (本地创建, 不调用服务端 API; 保存/提交时才持久化)
  const createDocument = useDocumentStore((s) => s.createDocument)
  const handleCreate = useCallback(() => {
    const doc = createDocument(typeId)
    onOpenDocument(doc.id)
  }, [typeId, onOpenDocument, createDocument])

  const handleDeleteDocument = useCallback(
    async (docId: string) => {
      const ok = window.confirm("确认删除该单据？")
      if (!ok) return
      await deleteDocumentApi(typeId, docId)
      await queryClient.invalidateQueries({
        queryKey: ["documents", typeId, currentMode, resolvedDetailTableId ?? ""],
      })
    },
    [typeId, currentMode, resolvedDetailTableId, queryClient]
  )

  const handleDeleteDetail = useCallback(
    async (docId: string, detailRowId?: string) => {
      if (!detailRowId) return
      const ok = window.confirm("确认删除该明细？")
      if (!ok) return
      await deleteDocumentItemApi(typeId, docId, detailRowId)
      await queryClient.invalidateQueries({
        queryKey: ["documents", typeId, currentMode, resolvedDetailTableId ?? ""],
      })
    },
    [typeId, currentMode, resolvedDetailTableId, queryClient]
  )

  // ============================================================
  // 内置 handler 映射表: actionId → handler(row)
  // ============================================================

  const builtinHandlers = useMemo<
    Record<string, (row: FlatDocumentRow) => void>
  >(
    () => ({
      open: (row) => onOpenDocument(String(row._id), typeId),
      delete: (row) => handleDeleteDocument(String(row._id)),
      "delete-detail": (row) =>
        handleDeleteDetail(
          String(row._id),
          row._detailRowId ? String(row._detailRowId) : undefined
        ),
      "copy-id": (row) => handleCopyText(String(row._id)),
    }),
    [onOpenDocument, typeId, handleDeleteDocument, handleDeleteDetail, handleCopyText]
  )

  // ============================================================
  // 根据 action config + 行数据动态生成行操作
  // ============================================================

  const getRowActions = useCallback(
    (row: FlatDocumentRow): RowAction[] => {
      return resolvedRowActions
        .filter((def) => {
          // 按模式过滤
          if (def.modes && !def.modes.includes(currentMode)) return false
          // 按可见性条件过滤
          if (def.visible && !def.visible(row)) return false
          return true
        })
        .map((def) => {
          const handler = builtinHandlers[def.id]
          return {
            id: def.id,
            label: def.label,
            danger: def.danger,
            disabled: def.disabled ? def.disabled(row) : false,
            onClick: () => {
              if (handler) {
                handler(row)
              } else if (onAction) {
                // 非内置操作，交给外部 onAction 回调
                onAction(def.id, row)
              } else {
                console.warn(
                  `[DocumentListTable] 未处理的操作: "${def.id}"，请提供 onAction 回调或注册为内置操作。`
                )
              }
            },
          }
        })
    },
    [resolvedRowActions, currentMode, builtinHandlers, onAction]
  )

  // ============================================================
  // 构建列定义
  // ============================================================

  const columns = useMemo<ListTableColumn<FlatDocumentRow>[]>(() => {
    if (!schema) return []

    const cols: ListTableColumn<FlatDocumentRow>[] = []

    // 从 schema.masterFields 中取前几个关键字段作为列表列
    // 过滤掉 textarea 和 computed 类型 (不适合列表显示)
    const listableFields = schema.masterFields.filter(
      (f) => f.type !== "textarea" && f.type !== "computed"
    )

    for (const field of listableFields) {
      cols.push({
        id: field.id,
        label: field.label,
        type: field.type,
        source: "master",
        options: field.options,
        minWidth: 80,
        // 超过 8 个字段的默认隐藏
        defaultHidden: listableFields.indexOf(field) >= 8,
      })
    }

    // 明细模式: 追加指定明细表的字段列
    if (isDetailMode && resolvedDetailTableId) {
      const detailTableDef = schema.detailTables.find(
        (t) => t.id === resolvedDetailTableId
      )
      if (detailTableDef) {
        const detailFields = detailTableDef.fields.filter(
          (f) => f.type !== "textarea" && f.type !== "computed"
        )
        for (const field of detailFields) {
          cols.push({
            id: field.id,
            label: field.label,
            type: field.type,
            source: "detail",
            options: field.options,
            minWidth: 80,
          })
        }
      }
    }

    // 操作列 (始终固定在右侧)
    cols.push({
      id: "_actions",
      label: "操作",
      type: "text",
      source: "system",
      width: 120,
      minWidth: 100,
      sortable: false,
      filterable: false,
      render: (_, row) => <ActionCell actions={getRowActions(row)} />,
    })

    return cols
  }, [schema, isDetailMode, resolvedDetailTableId, getRowActions])

  // queryFn: 从服务端 API 获取数据 (分页/筛选/排序均由服务端处理)
  const queryFn = useCallback(
    async (params: FetchParams): Promise<FetchResult<FlatDocumentRow>> => {
      return fetchDocumentListApi(typeId, params, currentMode, resolvedDetailTableId)
    },
    [typeId, currentMode, resolvedDetailTableId]
  )

  const handleToggleMode = useCallback(() => {
    if (!canToggleToDetail) return
    setCurrentMode((prev) => (prev === "document" ? "detail" : "document"))
  }, [canToggleToDetail])

  // ============================================================
  // 工具栏操作 handler 映射 (内置的 toolbar 操作)
  // ============================================================

  const toolbarBuiltinHandlers: Record<string, () => void> = useMemo(
    () => ({
      create: handleCreate,
    }),
    [handleCreate]
  )

  const handleToolbarAction = useCallback(
    (actionId: string) => {
      const handler = toolbarBuiltinHandlers[actionId]
      if (handler) {
        handler()
      } else {
        console.warn(`[DocumentListTable] 未处理的工具栏操作: "${actionId}"`)
      }
    },
    [toolbarBuiltinHandlers]
  )

  // ============================================================
  // 渲染
  // ============================================================

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">未找到单据类型: {typeId}</p>
      </div>
    )
  }

  return (
    <ListTable<FlatDocumentRow>
    columns={columns}
    queryKey={["documents", typeId, currentMode, resolvedDetailTableId ?? ""]}
    queryFn={queryFn}
    title={schema.typeName}
    titleIcon={<FileText className="h-5 w-5" />}
    fixedRightColumnIds={fixedRightColumns}
    enableRowSelection
    onSelectionChange={setSelectedRows}
    fixedLeftColumnIds={fixedLeftColumns}
    toolbarActions={
      <div className="flex items-center gap-1">
        {/* 根据配置动态渲染工具栏按钮 */}
        {resolvedToolbarActions
          ?.filter((action) => !action.requiresSelection || hasSelection)
          .map((action) => (
          <Button
            key={action.id}
            variant={action.variant ?? "outline"}
            size="sm"
            onClick={() => handleToolbarAction(action.id)}
          >
            {action.icon === "Plus" && <Plus className="h-4 w-4 mr-1" />}
            {action.label}
          </Button>
        ))}

        {/* 模式切换按钮 (始终显示, 由明细表决定是否可用) */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleMode}
          disabled={!canToggleToDetail}
          aria-pressed={isDetailMode}
          title={
            canToggleToDetail
              ? isDetailMode
                ? "切换到单据模式"
                : "切换到明细模式"
              : "当前单据无明细表"
          }
        >
          {isDetailMode ? (
            <FileText className="h-4 w-4" />
          ) : (
            <List className="h-4 w-4" />
          )}
        </Button>
      </div>
    }
    defaultPageSize={20}
    rowKey={(row) =>
      isDetailMode
        ? (row._detailRowId as string)
        : (row._id as string)
    }
    exportFilename={schema.typeName}
  />
  )
}
