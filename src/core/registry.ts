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
} from "./types"

class DocumentRegistry {
  private schemas = new Map<DocumentTypeId, DocumentSchema>()
  private pushDownRules: PushDownRule[] = []
  private changeRules: ChangeRule[] = []
  private approvalRules: ApprovalRule[] = []

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

  /** 清空所有注册 (用于测试) */
  clear(): void {
    this.schemas.clear()
    this.pushDownRules = []
    this.changeRules = []
    this.approvalRules = []
  }
}

/** 全局单据注册中心 */
export const registry = new DocumentRegistry()
