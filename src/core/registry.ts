/**
 * Document Registry
 *
 * 单据注册中心: 管理所有单据 Schema、下推规则、变更规则。
 * 全局单例，在应用启动时注册所有业务单据定义。
 */

import type {
  DocumentSchema,
  DocumentTypeId,
  PushDownRule,
  ChangeRule,
  ApprovalRule,
  DocumentListActionConfig,
  DocumentFormActionConfig,
} from "./types"

class DocumentRegistry {
  private schemas = new Map<DocumentTypeId, DocumentSchema>()
  private pushDownRules: PushDownRule[] = []
  private changeRules: ChangeRule[] = []
  private approvalRules: ApprovalRule[] = []
  private actionConfigs = new Map<DocumentTypeId, DocumentListActionConfig>()
  private formActionConfigs = new Map<DocumentTypeId, DocumentFormActionConfig>()

  /** 注册单据 Schema */
  registerSchema(schema: DocumentSchema): void {
    if (this.schemas.has(schema.typeId)) {
      console.warn(`[Registry] Schema "${schema.typeId}" already registered, overwriting.`)
    }
    this.schemas.set(schema.typeId, schema)
  }

  /** 获取单据 Schema */
  getSchema(typeId: DocumentTypeId): DocumentSchema | undefined {
    return this.schemas.get(typeId)
  }

  /** 获取所有已注册的 Schema */
  getAllSchemas(): DocumentSchema[] {
    return Array.from(this.schemas.values())
  }

  /** 注册下推规则 */
  registerPushDownRule(rule: PushDownRule): void {
    this.pushDownRules.push(rule)
  }

  /** 获取某种单据可用的下推规则 */
  getPushDownRules(sourceTypeId: DocumentTypeId): PushDownRule[] {
    return this.pushDownRules.filter((r) => r.sourceTypeId === sourceTypeId)
  }

  /** 获取所有下推规则 */
  getAllPushDownRules(): PushDownRule[] {
    return [...this.pushDownRules]
  }

  /** 注册变更规则 */
  registerChangeRule(rule: ChangeRule): void {
    this.changeRules.push(rule)
  }

  /** 获取某种单据的变更规则 */
  getChangeRules(typeId: DocumentTypeId): ChangeRule[] {
    return this.changeRules.filter((r) => r.typeId === typeId)
  }

  /** 获取可以追溯到指定单据类型的下游单据类型 */
  getDownstreamTypes(sourceTypeId: DocumentTypeId): DocumentTypeId[] {
    return this.pushDownRules
      .filter((r) => r.sourceTypeId === sourceTypeId)
      .map((r) => r.targetTypeId)
  }

  /** 获取指定单据类型的上游单据类型 */
  getUpstreamTypes(targetTypeId: DocumentTypeId): DocumentTypeId[] {
    return this.pushDownRules
      .filter((r) => r.targetTypeId === targetTypeId)
      .map((r) => r.sourceTypeId)
  }

  // ---- 审核规则 ----

  /** 注册审核规则 */
  registerApprovalRule(rule: ApprovalRule): void {
    this.approvalRules.push(rule)
  }

  /** 获取某种单据类型的审核规则 */
  getApprovalRules(typeId: DocumentTypeId): ApprovalRule[] {
    return this.approvalRules.filter((r) => r.typeId === typeId)
  }

  /** 根据 ID 获取审核规则 */
  getApprovalRule(ruleId: string): ApprovalRule | undefined {
    return this.approvalRules.find((r) => r.id === ruleId)
  }

  /** 获取所有审核规则 */
  getAllApprovalRules(): ApprovalRule[] {
    return [...this.approvalRules]
  }

  // ---- 列表操作配置 ----

  /** 注册单据列表操作配置 */
  registerActionConfig(config: DocumentListActionConfig): void {
    if (this.actionConfigs.has(config.typeId)) {
      console.warn(`[Registry] ActionConfig "${config.typeId}" already registered, overwriting.`)
    }
    this.actionConfigs.set(config.typeId, config)
  }

  /** 获取某种单据的列表操作配置 */
  getActionConfig(typeId: DocumentTypeId): DocumentListActionConfig | undefined {
    return this.actionConfigs.get(typeId)
  }

  /** 获取所有列表操作配置 */
  getAllActionConfigs(): DocumentListActionConfig[] {
    return Array.from(this.actionConfigs.values())
  }

  // ---- 表单操作配置 ----

  /** 注册单据表单操作配置 */
  registerFormActionConfig(config: DocumentFormActionConfig): void {
    if (this.formActionConfigs.has(config.typeId)) {
      console.warn(`[Registry] FormActionConfig "${config.typeId}" already registered, overwriting.`)
    }
    this.formActionConfigs.set(config.typeId, config)
  }

  /** 获取某种单据的表单操作配置 */
  getFormActionConfig(typeId: DocumentTypeId): DocumentFormActionConfig | undefined {
    return this.formActionConfigs.get(typeId)
  }

  /** 获取所有表单操作配置 */
  getAllFormActionConfigs(): DocumentFormActionConfig[] {
    return Array.from(this.formActionConfigs.values())
  }

  /** 清空所有注册 (用于测试) */
  clear(): void {
    this.schemas.clear()
    this.pushDownRules = []
    this.changeRules = []
    this.approvalRules = []
    this.actionConfigs.clear()
    this.formActionConfigs.clear()
  }
}

/** 全局单据注册中心 */
export const registry = new DocumentRegistry()
