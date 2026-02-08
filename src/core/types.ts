/**
 * ZForm Core Type System
 *
 * 企业单据管理系统的核心类型定义。
 * 支持主数据/明细数据结构、单据下推、追溯关系、变更影响评估。
 */

import type { z } from "zod"

// ============================================================
// 基础标识类型
// ============================================================

/** 单据类型标识 (如 "sales_contract", "purchase_plan") */
export type DocumentTypeId = string

/** 单据实例 ID */
export type DocumentId = string

/** 明细行 ID */
export type DetailRowId = string

/** 字段标识 */
export type FieldId = string

// ============================================================
// 字段定义 (Schema-driven)
// ============================================================

/** 支持的字段类型 */
export type FieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "textarea"
  | "checkbox"
  | "computed"

/** 字段定义 */
export interface FieldDef {
  /** 字段唯一标识 */
  id: FieldId
  /** 显示名称 */
  label: string
  /** 字段类型 */
  type: FieldType
  /** 是否必填 */
  required?: boolean
  /** 是否只读 */
  readOnly?: boolean
  /** 默认值 */
  defaultValue?: unknown
  /** 下拉选项 (type=select 时) */
  options?: { label: string; value: string }[]
  /** 计算公式 (type=computed 时), 接收当前行数据返回计算值 */
  compute?: (row: Record<string, unknown>) => unknown
  /** 字段在栅格中占的列数 (1-4, 默认1) */
  span?: number
  /** 占位提示 */
  placeholder?: string
  /** 字段分组标题 (用于表单分段) */
  group?: string
}

// ============================================================
// 单据 Schema 定义
// ============================================================

/** 明细表定义 */
export interface DetailTableDef {
  /** 明细表标识 (如 "items", "materials") */
  id: string
  /** 明细表显示名称 */
  label: string
  /** 明细行字段列表 */
  fields: FieldDef[]
  /** 是否允许增删行 */
  editable?: boolean
  /** 最小行数 */
  minRows?: number
  /** 最大行数 */
  maxRows?: number
}

/** 单据 Schema —— 完整描述一种单据的结构 */
export interface DocumentSchema {
  /** 单据类型 ID */
  typeId: DocumentTypeId
  /** 单据类型名称 (中文) */
  typeName: string
  /** 主数据字段 */
  masterFields: FieldDef[]
  /** 明细表列表 (一个单据可以有多个明细表) */
  detailTables: DetailTableDef[]
  /** Zod 校验 schema (可选, 用于整体校验) */
  validationSchema?: z.ZodType
}

// ============================================================
// 单据数据
// ============================================================

/** 明细行数据 */
export interface DetailRow {
  /** 行 ID */
  id: DetailRowId
  /** 行字段数据 */
  data: Record<string, unknown>
  /** 来源追溯 */
  sourceRef?: SourceRef
}

/** 明细表数据 */
export interface DetailTableData {
  /** 对应的 DetailTableDef.id */
  tableId: string
  /** 行数据 */
  rows: DetailRow[]
}

/** 单据数据 */
export interface DocumentData {
  /** 单据实例 ID */
  id: DocumentId
  /** 单据类型 ID */
  typeId: DocumentTypeId
  /** 单据编号 (业务编号) */
  docNumber: string
  /** 主数据 */
  masterData: Record<string, unknown>
  /** 明细数据 */
  detailTables: DetailTableData[]
  /** 单据状态 */
  status: DocumentStatus
  /** 来源追溯 (整单级) */
  sourceRef?: SourceRef
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 单据状态 */
export type DocumentStatus = "draft" | "submitted" | "approved" | "closed" | "cancelled"

// ============================================================
// 追溯关系 (Traceability)
// ============================================================

/** 来源引用 —— 记录当前单据/明细行从哪里生成 */
export interface SourceRef {
  /** 来源单据类型 */
  sourceTypeId: DocumentTypeId
  /** 来源单据 ID */
  sourceDocId: DocumentId
  /** 来源明细行 ID (如果是行级追溯) */
  sourceDetailRowId?: DetailRowId
  /** 来源明细表 ID */
  sourceDetailTableId?: string
}

/** 追溯链条节点 */
export interface TraceNode {
  /** 当前单据 */
  document: DocumentData
  /** 下游单据 */
  children: TraceNode[]
}

// ============================================================
// 下推规则 (Push-down Rules)
// ============================================================

/** 字段映射规则 —— 定义下推时字段如何从上游映射到下游 */
export interface FieldMapping {
  /** 源字段 ID (支持 "master.fieldId" 或 "detail.tableId.fieldId" 格式) */
  sourceField: string
  /** 目标字段 ID */
  targetField: string
  /** 自定义转换函数 */
  transform?: (value: unknown, sourceDoc: DocumentData) => unknown
}

/** 明细映射规则 */
export interface DetailMapping {
  /** 源明细表 ID */
  sourceTableId: string
  /** 目标明细表 ID */
  targetTableId: string
  /** 行字段映射 */
  fieldMappings: FieldMapping[]
  /** 行过滤器 (决定哪些源行参与下推) */
  rowFilter?: (row: DetailRow) => boolean
}

/** 下推规则 —— 定义如何从一种单据生成另一种 */
export interface PushDownRule {
  /** 源单据类型 */
  sourceTypeId: DocumentTypeId
  /** 目标单据类型 */
  targetTypeId: DocumentTypeId
  /** 规则名称 (如 "生成采购计划") */
  name: string
  /** 主数据字段映射 */
  masterFieldMappings: FieldMapping[]
  /** 明细映射 */
  detailMappings: DetailMapping[]
}

// ============================================================
// 变更影响评估 (Change Impact Assessment)
// ============================================================

/** 影响类型 */
export type ImpactLevel = "info" | "warning" | "critical"

/** 单个影响项 */
export interface ImpactItem {
  /** 影响级别 */
  level: ImpactLevel
  /** 被影响的单据 */
  affectedDocId: DocumentId
  /** 被影响的单据类型 */
  affectedTypeId: DocumentTypeId
  /** 被影响的单据编号 */
  affectedDocNumber: string
  /** 被影响的字段 */
  affectedField?: string
  /** 影响描述 */
  description: string
}

/** 影响评估结果 */
export interface ImpactAssessment {
  /** 是否允许变更 */
  canProceed: boolean
  /** 影响列表 */
  impacts: ImpactItem[]
  /** 汇总消息 */
  summary: string
}

// ============================================================
// 变更规则
// ============================================================

/** 变更规则 —— 定义某个字段变更时的影响评估逻辑 */
export interface ChangeRule {
  /** 适用的单据类型 */
  typeId: DocumentTypeId
  /** 监控的字段 (支持 "master.fieldId" 或 "detail.tableId.fieldId") */
  watchFields: string[]
  /** 评估函数: 给定旧值和新值, 返回影响列表 */
  evaluate: (
    oldDoc: DocumentData,
    newDoc: DocumentData,
    downstreamDocs: DocumentData[]
  ) => ImpactItem[]
}

// ============================================================
// 审核系统 (Approval System)
// ============================================================

/** 审核动作类型 */
export type ApprovalAction = "submit" | "approve" | "reject" | "withdraw"

/** 审批模式: single=单人审批, all=会签(所有人通过), any=或签(任一通过) */
export type ApprovalMode = "single" | "all" | "any"

/** 审核级别定义 */
export interface ApprovalLevel {
  /** 级别名称 (如 "部门主管审批") */
  name: string
  /** 审批模式 (默认 "any") */
  mode?: ApprovalMode
  /** 可审批的角色 ID 列表 */
  roleIds?: string[]
  /** 可审批的用户 ID 列表 */
  userIds?: string[]
}

/** 审核规则 —— 定义单据类型的审核流程 */
export interface ApprovalRule {
  /** 规则 ID */
  id: string
  /** 适用的单据类型 */
  typeId: DocumentTypeId
  /** 规则名称 */
  name: string
  /** 审核级别定义 (按顺序审批) */
  levels: ApprovalLevel[]
  /** 触发条件 (可选, 返回 true 表示需要审批; 不设置则所有单据都需要审批) */
  condition?: (doc: DocumentData) => boolean
  /** 是否启用 (默认 true) */
  enabled?: boolean
}

/** 审核记录 */
export interface ApprovalRecord {
  /** 记录 ID */
  id: string
  /** 单据 ID */
  docId: DocumentId
  /** 单据类型 */
  typeId: DocumentTypeId
  /** 审核规则 ID */
  ruleId: string
  /** 审核级别 (0=提交, 1+=审批级别) */
  level: number
  /** 审核动作 */
  action: ApprovalAction
  /** 操作人 ID */
  userId: string
  /** 操作人姓名 */
  userName: string
  /** 审批意见 */
  comment?: string
  /** 操作时间 */
  timestamp: string
}

/** 审核状态 */
export interface ApprovalStatus {
  /** 单据 ID */
  docId: DocumentId
  /** 单据类型 */
  typeId: DocumentTypeId
  /** 审核规则 ID */
  ruleId: string
  /** 当前审核级别 (从 1 开始) */
  currentLevel: number
  /** 审核状态 */
  status: "pending" | "in_progress" | "approved" | "rejected"
  /** 提交人 ID */
  submitterId: string
  /** 提交时间 */
  submittedAt?: string
  /** 完成时间 */
  completedAt?: string
  /** 当前级别已审批的用户 ID 集合 (用于会签/或签) */
  currentLevelApprovers: string[]
}

/** 审核操作结果 */
export interface ApprovalResult {
  /** 是否成功 */
  success: boolean
  /** 消息 */
  message: string
  /** 新的审核状态 */
  status?: ApprovalStatus
  /** 审核记录 */
  record?: ApprovalRecord
}

// ============================================================
// 单据列表操作配置 (Action Config)
// ============================================================

/**
 * 内置操作 ID 常量
 *
 * 内置操作由 DocumentListTable 自行实现 handler，
 * 业务侧只需声明即可，无需提供 handler。
 */
export type BuiltinActionId =
  | "open"        // 打开单据
  | "delete"      // 删除单据
  | "delete-detail" // 删除明细行 (仅明细模式)
  | "copy-id"     // 复制单据 ID

/** 行操作定义 */
export interface DocumentActionDef {
  /** 操作标识: 内置 ID 或自定义字符串 */
  id: BuiltinActionId | string
  /** 显示文本 */
  label: string
  /** 适用的列表模式: document / detail; 不设则两种模式都显示 */
  modes?: ("document" | "detail")[]
  /** 是否危险操作 (红色显示) */
  danger?: boolean
  /**
   * 可见性条件: 根据行数据决定是否显示
   * row 的类型为 FlatDocumentRow (Record<string, unknown> & 系统字段)
   */
  visible?: (row: Record<string, unknown>) => boolean
  /**
   * 禁用条件: 根据行数据决定是否禁用
   */
  disabled?: (row: Record<string, unknown>) => boolean
}

/** 工具栏操作定义 */
export interface ToolbarActionDef {
  /** 操作标识 */
  id: string
  /** 显示文本 */
  label: string
  /** 图标名称 (对应 lucide-react 的 icon name) */
  icon?: string
  /** 按钮样式 */
  variant?: "default" | "outline" | "ghost"
}

/** 单据列表操作配置 —— 声明式定义某种单据在列表中可执行的操作 */
export interface DocumentListActionConfig {
  /** 单据类型 ID */
  typeId: DocumentTypeId
  /** 行级操作列表 (按顺序显示，前2个内联，其余溢出到 ··· 菜单) */
  rowActions: DocumentActionDef[]
  /** 工具栏操作列表 (显示在标题栏右侧) */
  toolbarActions?: ToolbarActionDef[]
}
