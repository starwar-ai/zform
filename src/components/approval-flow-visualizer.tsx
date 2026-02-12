/**
 * ApprovalFlowVisualizer
 *
 * 使用 @xyflow/react + dagre 渲染审批流程的交互式流程图。
 * 支持自定义节点（开始/审批步骤/结束）、状态着色、动画和自动布局。
 */

import { useMemo, useCallback } from "react"
import {
  ReactFlow,
  Background,
  MiniMap,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
} from "@xyflow/react"
import dagre from "dagre"
import "@xyflow/react/dist/style.css"

import type {
  ApprovalLevelConfig,
  ApprovalInstanceResponse,
  ApprovalRecordResponse,
} from "@/apis/approval-api"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Circle,
  Users,
  User,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ============================================================
// Types
// ============================================================

interface ApprovalFlowVisualizerProps {
  levels: ApprovalLevelConfig[]
  instance?: ApprovalInstanceResponse | null
  records?: ApprovalRecordResponse[]
  compact?: boolean
  interactive?: boolean
  className?: string
}

type StepStatus = "approved" | "current" | "rejected" | "pending"

interface StartNodeData {
  submitterName?: string | null
  submittedAt?: string | null
  [key: string]: unknown
}

interface StepNodeData {
  label: string
  mode: string
  roleIds?: string[]
  userIds?: string[]
  status: StepStatus
  records: ApprovalRecordResponse[]
  levelIndex: number
  [key: string]: unknown
}

interface EndNodeData {
  completed: boolean
  completedAt?: string | null
  status?: string
  [key: string]: unknown
}

// ============================================================
// Mode label helper
// ============================================================

function getModeLabel(mode?: string) {
  switch (mode) {
    case "single":
      return "单签"
    case "all":
      return "会签"
    case "any":
    default:
      return "或签"
  }
}

function getModeBadgeColor(mode?: string) {
  switch (mode) {
    case "all":
      return "bg-purple-100 text-purple-700"
    case "single":
      return "bg-amber-100 text-amber-700"
    case "any":
    default:
      return "bg-blue-100 text-blue-700"
  }
}

// ============================================================
// Custom Nodes
// ============================================================

function ApprovalStartNode({ data }: NodeProps<Node<StartNodeData>>) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 text-white shadow-md border-2 border-emerald-600">
            <Circle className="h-5 w-5 fill-current" />
            <Handle type="source" position={Position.Right} className="!bg-emerald-600 !w-2 !h-2" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs">
            <p className="font-medium">提交发起</p>
            {data.submitterName && <p>提交人: {data.submitterName}</p>}
            {data.submittedAt && (
              <p>时间: {new Date(data.submittedAt).toLocaleString()}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ApprovalStepNode({ data }: NodeProps<Node<StepNodeData>>) {
  const status = data.status as StepStatus

  const borderColor = {
    approved: "border-emerald-500",
    current: "border-blue-500",
    rejected: "border-red-500",
    pending: "border-gray-300",
  }[status]

  const bgColor = {
    approved: "bg-emerald-50",
    current: "bg-blue-50",
    rejected: "bg-red-50",
    pending: "bg-gray-50",
  }[status]

  const StatusIcon = {
    approved: CheckCircle2,
    current: Clock,
    rejected: XCircle,
    pending: Clock,
  }[status]

  const iconColor = {
    approved: "text-emerald-500",
    current: "text-blue-500",
    rejected: "text-red-500",
    pending: "text-gray-400",
  }[status]

  const approveRecords = (data.records as ApprovalRecordResponse[]).filter(
    (r) => r.action === "approve" && r.level === data.levelIndex + 1
  )
  const rejectRecord = (data.records as ApprovalRecordResponse[]).find(
    (r) => r.action === "reject" && r.level === data.levelIndex + 1
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "rounded-lg border-2 shadow-sm px-4 py-3 min-w-[140px] max-w-[200px]",
              borderColor,
              bgColor,
              status === "current" && "animate-pulse"
            )}
          >
            <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />
            <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />

            {/* Header */}
            <div className="flex items-center gap-2 mb-1.5">
              <StatusIcon className={cn("h-4 w-4 shrink-0", iconColor)} />
              <span className="text-sm font-medium truncate">{data.label}</span>
            </div>

            {/* Mode badge */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  getModeBadgeColor(data.mode as string)
                )}
              >
                {getModeLabel(data.mode as string)}
              </span>
            </div>

            {/* Status-specific content */}
            {status === "approved" && approveRecords.length > 0 && (
              <div className="text-[10px] text-emerald-600 truncate">
                {approveRecords.map((r) => r.userName).join(", ")} 已通过
              </div>
            )}
            {status === "rejected" && rejectRecord && (
              <div className="text-[10px] text-red-600 truncate">
                {rejectRecord.userName} 已拒绝
              </div>
            )}
            {status === "current" && (
              <div className="text-[10px] text-blue-600">等待审批</div>
            )}
            {status === "pending" && (
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                {(data.roleIds as string[] | undefined)?.length ? (
                  <>
                    <Users className="h-3 w-3" />
                    <span className="truncate">
                      {(data.roleIds as string[]).join(", ")}
                    </span>
                  </>
                ) : (data.userIds as string[] | undefined)?.length ? (
                  <>
                    <User className="h-3 w-3" />
                    <span className="truncate">
                      {(data.userIds as string[]).join(", ")}
                    </span>
                  </>
                ) : (
                  <span>待分配</span>
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px]">
          <div className="text-xs space-y-1">
            <p className="font-medium">
              {data.label} ({getModeLabel(data.mode as string)})
            </p>
            {(data.roleIds as string[] | undefined)?.length && (
              <p>角色: {(data.roleIds as string[]).join(", ")}</p>
            )}
            {(data.userIds as string[] | undefined)?.length && (
              <p>用户: {(data.userIds as string[]).join(", ")}</p>
            )}
            {approveRecords.length > 0 &&
              approveRecords.map((r) => (
                <p key={r.id}>
                  {r.userName} 通过 ({new Date(r.createdAt).toLocaleString()})
                  {r.comment && ` — ${r.comment}`}
                </p>
              ))}
            {rejectRecord && (
              <p>
                {rejectRecord.userName} 拒绝 (
                {new Date(rejectRecord.createdAt).toLocaleString()})
                {rejectRecord.comment && ` — ${rejectRecord.comment}`}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ApprovalEndNode({ data }: NodeProps<Node<EndNodeData>>) {
  const completed = data.completed as boolean
  const isRejected = data.status === "rejected"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-full shadow-md border-2",
              completed && !isRejected
                ? "bg-emerald-500 border-emerald-600 text-white"
                : isRejected
                  ? "bg-red-500 border-red-600 text-white"
                  : "bg-gray-200 border-gray-300 text-gray-500"
            )}
          >
            <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />
            {completed && !isRejected ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : isRejected ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs">
            <p className="font-medium">
              {completed && !isRejected
                ? "审批完成"
                : isRejected
                  ? "已拒绝"
                  : "等待完成"}
            </p>
            {data.completedAt && (
              <p>
                时间: {new Date(data.completedAt as string).toLocaleString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const nodeTypes = {
  start: ApprovalStartNode,
  step: ApprovalStepNode,
  end: ApprovalEndNode,
}

// ============================================================
// Dagre Layout
// ============================================================

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 120 })
  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((node) => {
    const width = node.type === "step" ? 180 : 56
    const height = node.type === "step" ? 100 : 56
    g.setNode(node.id, { width, height })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    const width = node.type === "step" ? 180 : 56
    const height = node.type === "step" ? 100 : 56
    return {
      ...node,
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

// ============================================================
// Build flow graph
// ============================================================

function buildFlowGraph(
  levels: ApprovalLevelConfig[],
  instance?: ApprovalInstanceResponse | null,
  records?: ApprovalRecordResponse[]
) {
  const allRecords = records ?? instance?.records ?? []

  // Determine step status
  function getStepStatus(levelIndex: number): StepStatus {
    if (!instance) return "pending"

    const level = levelIndex + 1
    if (instance.status === "rejected") {
      // Find which level was rejected
      const rejectRecord = allRecords.find(
        (r) => r.action === "reject"
      )
      if (rejectRecord && rejectRecord.level === level) return "rejected"
      if (rejectRecord && rejectRecord.level > level) return "approved"
      return "pending"
    }

    if (instance.status === "approved") return "approved"

    // in_progress
    if (level < instance.currentLevel) return "approved"
    if (level === instance.currentLevel) return "current"
    return "pending"
  }

  const nodes: Node[] = []
  const edges: Edge[] = []

  // Start node
  nodes.push({
    id: "start",
    type: "start",
    position: { x: 0, y: 0 },
    data: {
      submitterName: instance?.submitterName,
      submittedAt: instance?.submittedAt,
    },
  })

  // Level nodes
  levels.forEach((level, idx) => {
    const status = getStepStatus(idx)
    nodes.push({
      id: `level-${idx}`,
      type: "step",
      position: { x: 0, y: 0 },
      data: {
        label: level.name,
        mode: level.mode ?? "any",
        roleIds: level.roleIds,
        userIds: level.userIds,
        status,
        records: allRecords,
        levelIndex: idx,
      },
    })
  })

  // End node
  const isCompleted =
    instance?.status === "approved" || instance?.status === "rejected"
  nodes.push({
    id: "end",
    type: "end",
    position: { x: 0, y: 0 },
    data: {
      completed: isCompleted,
      completedAt: instance?.completedAt,
      status: instance?.status,
    },
  })

  // Edges
  const getEdgeStyle = (
    sourceStatus: StepStatus | "start",
    targetStatus: StepStatus | "end"
  ): Partial<Edge> => {
    // If source is approved/start and has been passed
    if (sourceStatus === "start" && instance) {
      return {
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2 },
      }
    }
    if (sourceStatus === "approved") {
      return {
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2 },
      }
    }
    if (sourceStatus === "current") {
      return {
        style: { stroke: "#3b82f6", strokeWidth: 2, strokeDasharray: "5 5" },
      }
    }
    if (sourceStatus === "rejected") {
      return {
        style: { stroke: "#ef4444", strokeWidth: 2 },
      }
    }
    return {
      style: { stroke: "#d1d5db", strokeWidth: 1.5, strokeDasharray: "5 5" },
    }
  }

  // Start -> first level
  if (levels.length > 0) {
    const firstStatus = getStepStatus(0)
    edges.push({
      id: "start-to-level-0",
      source: "start",
      target: "level-0",
      type: "smoothstep",
      ...getEdgeStyle("start", firstStatus),
    })
  }

  // Level -> Level
  for (let i = 0; i < levels.length - 1; i++) {
    const sourceStatus = getStepStatus(i)
    const targetStatus = getStepStatus(i + 1)
    edges.push({
      id: `level-${i}-to-level-${i + 1}`,
      source: `level-${i}`,
      target: `level-${i + 1}`,
      type: "smoothstep",
      ...getEdgeStyle(sourceStatus, targetStatus),
    })
  }

  // Last level -> end
  if (levels.length > 0) {
    const lastIdx = levels.length - 1
    const lastStatus = getStepStatus(lastIdx)
    edges.push({
      id: `level-${lastIdx}-to-end`,
      source: `level-${lastIdx}`,
      target: "end",
      type: "smoothstep",
      ...getEdgeStyle(lastStatus, "end"),
    })
  }

  return getLayoutedElements(nodes, edges)
}

// ============================================================
// Component
// ============================================================

export function ApprovalFlowVisualizer({
  levels,
  instance,
  records,
  compact = false,
  interactive = true,
  className,
}: ApprovalFlowVisualizerProps) {
  const { nodes, edges } = useMemo(
    () => buildFlowGraph(levels, instance, records),
    [levels, instance, records]
  )

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smoothstep" as const,
    }),
    []
  )

  const proOptions = useMemo(() => ({ hideAttribution: true }), [])

  const onInit = useCallback(
    (reactFlowInstance: { fitView: () => void }) => {
      setTimeout(() => reactFlowInstance.fitView(), 0)
    },
    []
  )

  if (levels.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-sm text-muted-foreground",
          compact ? "h-full" : "h-[300px]",
          className
        )}
      >
        暂无审批级别
      </div>
    )
  }

  return (
    <div
      className={cn(
        compact ? "h-full" : "h-[300px]",
        className
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        proOptions={proOptions}
        fitView
        onInit={onInit}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={interactive && !compact}
        zoomOnPinch={interactive && !compact}
        panOnScroll={interactive && !compact}
        panOnDrag={interactive && !compact}
        minZoom={0.3}
        maxZoom={2}
      >
        {!compact && <Background gap={16} size={1} />}
        {!compact && levels.length > 3 && <MiniMap />}
      </ReactFlow>
    </div>
  )
}
