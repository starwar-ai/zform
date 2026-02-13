import prisma from '../config/database';

// ============================================================
// 类型定义
// ============================================================

/** 审核级别（与数据库 JSON 字段对应） */
interface ApprovalLevel {
  name: string;
  mode?: 'single' | 'all' | 'any';
  roleIds?: string[];
  userIds?: string[];
}

/** 触发条件 */
interface ApprovalCondition {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: number | string | boolean;
}

/** 用户信息 */
interface UserInfo {
  userId: string;
  userName: string;
  roleIds: string[];
}

// ============================================================
// 条件评估器
// ============================================================

function evaluateCondition(
  condition: ApprovalCondition | ApprovalCondition[] | null,
  docData: Record<string, unknown>
): boolean {
  if (!condition) return true;

  const conditions = Array.isArray(condition) ? condition : [condition];

  return conditions.every((c) => {
    const fieldValue = docData[c.field];
    if (fieldValue === undefined || fieldValue === null) return false;

    switch (c.operator) {
      case 'gt':
        return Number(fieldValue) > Number(c.value);
      case 'gte':
        return Number(fieldValue) >= Number(c.value);
      case 'lt':
        return Number(fieldValue) < Number(c.value);
      case 'lte':
        return Number(fieldValue) <= Number(c.value);
      case 'eq':
        return fieldValue === c.value;
      case 'neq':
        return fieldValue !== c.value;
      default:
        return true;
    }
  });
}

// ============================================================
// 辅助函数
// ============================================================

function getLevelMode(level: ApprovalLevel): string {
  return level.mode ?? 'any';
}

function canUserApproveLevel(
  level: ApprovalLevel,
  user: UserInfo,
  submitterId: string,
  currentLevelApprovers: string[]
): boolean {
  // 禁止自审
  if (submitterId === user.userId) return false;
  // 不可重复审批
  if (currentLevelApprovers.includes(user.userId)) return false;

  // 检查用户 ID
  if (level.userIds && level.userIds.includes(user.userId)) return true;
  // 检查角色
  if (level.roleIds) {
    return user.roleIds.some((rid) => level.roleIds!.includes(rid));
  }

  return false;
}

function isLevelComplete(
  level: ApprovalLevel,
  approvers: string[]
): boolean {
  const mode = getLevelMode(level);
  switch (mode) {
    case 'single':
    case 'any':
      return approvers.length >= 1;
    case 'all': {
      const requiredCount =
        level.userIds && level.userIds.length > 0
          ? level.userIds.length
          : 1;
      return approvers.length >= requiredCount;
    }
    default:
      return approvers.length >= 1;
  }
}

/** 根据 docType 更新对应单据的 approvalStatus */
async function updateDocApprovalStatus(
  docType: string,
  docId: string,
  approvalStatus: string,
  userId: string
) {
  switch (docType) {
    case 'sales_contract':
      await prisma.salesContract.update({
        where: { id: docId },
        data: { approvalStatus: approvalStatus as any, updatedBy: userId },
      });
      break;
    case 'purchase_plan':
      await prisma.purchasePlan.update({
        where: { id: docId },
        data: { approvalStatus: approvalStatus as any, updatedBy: userId },
      });
      break;
    case 'quotation':
      await prisma.quotation.update({
        where: { id: docId },
        data: { approvalStatus: approvalStatus as any, updatedBy: userId },
      });
      break;
    default:
      break;
  }
}

/** 根据 docType 获取单据数据（用于条件评估） */
async function getDocData(
  docType: string,
  docId: string
): Promise<Record<string, unknown> | null> {
  switch (docType) {
    case 'sales_contract': {
      const doc = await prisma.salesContract.findUnique({ where: { id: docId } });
      return doc as unknown as Record<string, unknown>;
    }
    case 'purchase_plan': {
      const doc = await prisma.purchasePlan.findUnique({ where: { id: docId } });
      return doc as unknown as Record<string, unknown>;
    }
    case 'quotation': {
      const doc = await prisma.quotation.findUnique({ where: { id: docId } });
      return doc as unknown as Record<string, unknown>;
    }
    default:
      return null;
  }
}

// ============================================================
// ApprovalService
// ============================================================

export class ApprovalService {
  /**
   * 提交审核
   */
  async submit(params: {
    docType: string;
    docId: string;
    docNumber?: string;
    user: UserInfo;
  }) {
    const { docType, docId, docNumber, user } = params;

    // 查找匹配的审核规则
    const rules = await prisma.approvalRuleConfig.findMany({
      where: { docType, enabled: true },
    });

    if (rules.length === 0) {
      throw new Error('该单据类型未配置审核规则');
    }

    // 获取单据数据以评估条件
    const docData = await getDocData(docType, docId);
    if (!docData) {
      throw new Error('单据不存在');
    }

    // 找到第一个满足条件的规则
    const rule = rules.find((r) =>
      evaluateCondition(r.condition as ApprovalCondition | ApprovalCondition[] | null, docData)
    );

    if (!rule) {
      throw new Error('该单据不满足审核条件');
    }

    // 检查是否已有进行中的审核实例
    const existing = await prisma.approvalInstance.findFirst({
      where: { docType, docId, status: 'in_progress' },
    });

    if (existing) {
      throw new Error('该单据已在审核中，不能重复提交');
    }

    // 创建审核实例和提交记录
    const instance = await prisma.approvalInstance.create({
      data: {
        ruleId: rule.id,
        docType,
        docId,
        docNumber,
        status: 'in_progress',
        currentLevel: 1,
        currentLevelApprovers: [],
        submitterId: user.userId,
        submitterName: user.userName,
      },
    });

    await prisma.approvalRecord.create({
      data: {
        instanceId: instance.id,
        level: 0,
        action: 'submit',
        userId: user.userId,
        userName: user.userName,
      },
    });

    // 更新单据审核状态
    await updateDocApprovalStatus(docType, docId, 'PENDING', user.userId);

    const levels = rule.levels as ApprovalLevel[];
    const firstLevelName = levels[0]?.name ?? '第一级';

    return {
      instance,
      message: `已提交审核，等待「${firstLevelName}」审批`,
    };
  }

  /**
   * 审批（通过或拒绝）
   */
  async process(params: {
    instanceId: string;
    user: UserInfo;
    action: 'approve' | 'reject';
    comment?: string;
  }) {
    const { instanceId, user, action, comment } = params;

    const instance = await prisma.approvalInstance.findUnique({
      where: { id: instanceId },
      include: { rule: true },
    });

    if (!instance) {
      throw new Error('审核实例不存在');
    }

    if (instance.status !== 'in_progress') {
      throw new Error(
        `审核已${instance.status === 'approved' ? '通过' : '结束'}，不能再审批`
      );
    }

    const levels = instance.rule.levels as ApprovalLevel[];
    const currentLevelDef = levels[instance.currentLevel - 1];
    if (!currentLevelDef) {
      throw new Error('审核级别配置异常');
    }

    const currentLevelApprovers = instance.currentLevelApprovers as string[];

    // 权限检查
    if (
      !canUserApproveLevel(
        currentLevelDef,
        user,
        instance.submitterId,
        currentLevelApprovers
      )
    ) {
      throw new Error('您没有权限审批此单据');
    }

    // 创建审核记录
    await prisma.approvalRecord.create({
      data: {
        instanceId,
        level: instance.currentLevel,
        action,
        userId: user.userId,
        userName: user.userName,
        comment,
      },
    });

    // 拒绝
    if (action === 'reject') {
      const updated = await prisma.approvalInstance.update({
        where: { id: instanceId },
        data: {
          status: 'rejected',
          completedAt: new Date(),
        },
        include: { rule: true, records: { orderBy: { createdAt: 'asc' } } },
      });

      await updateDocApprovalStatus(
        instance.docType,
        instance.docId,
        'REJECTED',
        user.userId
      );

      return { instance: updated, message: '已拒绝' };
    }

    // 通过: 将用户加入本级审批人
    const updatedApprovers = [...currentLevelApprovers, user.userId];

    // 本级是否完成
    if (!isLevelComplete(currentLevelDef, updatedApprovers)) {
      const updated = await prisma.approvalInstance.update({
        where: { id: instanceId },
        data: { currentLevelApprovers: updatedApprovers },
        include: { rule: true, records: { orderBy: { createdAt: 'asc' } } },
      });
      return {
        instance: updated,
        message: `已通过，「${currentLevelDef.name}」还需其他审批人审批`,
      };
    }

    // 本级完成，检查是否最后一级
    if (instance.currentLevel >= levels.length) {
      const updated = await prisma.approvalInstance.update({
        where: { id: instanceId },
        data: {
          currentLevelApprovers: updatedApprovers,
          status: 'approved',
          completedAt: new Date(),
        },
        include: { rule: true, records: { orderBy: { createdAt: 'asc' } } },
      });

      await updateDocApprovalStatus(
        instance.docType,
        instance.docId,
        'APPROVED',
        user.userId
      );

      return { instance: updated, message: '审批完成，所有级别已通过' };
    }

    // 进入下一级
    const nextLevel = instance.currentLevel + 1;
    const nextLevelDef = levels[nextLevel - 1];
    const updated = await prisma.approvalInstance.update({
      where: { id: instanceId },
      data: {
        currentLevel: nextLevel,
        currentLevelApprovers: [],
      },
      include: { rule: true, records: { orderBy: { createdAt: 'asc' } } },
    });

    return {
      instance: updated,
      message: `已通过，等待「${nextLevelDef.name}」审批`,
    };
  }

  /**
   * 撤回审核
   */
  async withdraw(params: { instanceId: string; user: UserInfo }) {
    const { instanceId, user } = params;

    const instance = await prisma.approvalInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error('审核实例不存在');
    }

    if (instance.submitterId !== user.userId) {
      throw new Error('只有提交人才能撤回审核');
    }

    if (instance.status !== 'in_progress') {
      throw new Error('只有审批中的单据才能撤回');
    }

    await prisma.approvalRecord.create({
      data: {
        instanceId,
        level: instance.currentLevel,
        action: 'withdraw',
        userId: user.userId,
        userName: user.userName,
      },
    });

    const updated = await prisma.approvalInstance.update({
      where: { id: instanceId },
      data: {
        status: 'pending',
        currentLevel: 0,
        currentLevelApprovers: [],
      },
      include: { rule: true, records: { orderBy: { createdAt: 'asc' } } },
    });

    await updateDocApprovalStatus(
      instance.docType,
      instance.docId,
      'PENDING',
      user.userId
    );

    return { instance: updated, message: '已撤回审核' };
  }

  /**
   * 查询单据的审核历史
   */
  async getHistory(docType: string, docId: string) {
    const instances = await prisma.approvalInstance.findMany({
      where: { docType, docId },
      include: {
        rule: true,
        records: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return instances;
  }

  /**
   * 查询待审批列表
   */
  async getPending(user: UserInfo) {
    const instances = await prisma.approvalInstance.findMany({
      where: { status: 'in_progress' },
      include: {
        rule: true,
        records: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 筛选当前用户有权限审批的实例
    return instances.filter((instance) => {
      const levels = instance.rule.levels as ApprovalLevel[];
      const levelDef = levels[instance.currentLevel - 1];
      if (!levelDef) return false;

      const currentLevelApprovers = instance.currentLevelApprovers as string[];
      return canUserApproveLevel(
        levelDef,
        user,
        instance.submitterId,
        currentLevelApprovers
      );
    });
  }

  /**
   * 查询审核规则列表
   */
  async getRules(docType?: string) {
    const where = docType ? { docType } : {};
    return prisma.approvalRuleConfig.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 创建审核规则
   */
  async createRule(data: {
    code: string;
    name: string;
    docType: string;
    levels: ApprovalLevel[];
    condition?: ApprovalCondition | ApprovalCondition[] | null;
    enabled?: boolean;
  }) {
    // 校验 code 唯一性
    const existing = await prisma.approvalRuleConfig.findFirst({
      where: { code: data.code },
    });
    if (existing) {
      throw new Error(`规则编码 "${data.code}" 已存在`);
    }

    return prisma.approvalRuleConfig.create({
      data: {
        code: data.code,
        name: data.name,
        docType: data.docType,
        levels: data.levels as any,
        condition: (data.condition ?? null) as any,
        enabled: data.enabled ?? true,
      },
    });
  }

  /**
   * 更新审核规则
   */
  async updateRule(
    id: string,
    data: {
      name?: string;
      docType?: string;
      levels?: ApprovalLevel[];
      condition?: ApprovalCondition | ApprovalCondition[] | null;
      enabled?: boolean;
    }
  ) {
    const rule = await prisma.approvalRuleConfig.findUnique({ where: { id } });
    if (!rule) {
      throw new Error('审核规则不存在');
    }

    // 检查是否有进行中的实例
    const inProgressCount = await prisma.approvalInstance.count({
      where: { ruleId: id, status: 'in_progress' },
    });

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.docType !== undefined) updateData.docType = data.docType;
    if (data.levels !== undefined) updateData.levels = data.levels;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;

    const updated = await prisma.approvalRuleConfig.update({
      where: { id },
      data: updateData,
    });

    return {
      rule: updated,
      warning: inProgressCount > 0
        ? `注意：当前有 ${inProgressCount} 个进行中的审核实例使用此规则`
        : undefined,
    };
  }

  /**
   * 删除审核规则
   */
  async deleteRule(id: string) {
    const rule = await prisma.approvalRuleConfig.findUnique({ where: { id } });
    if (!rule) {
      throw new Error('审核规则不存在');
    }

    // 检查是否有关联实例
    const instanceCount = await prisma.approvalInstance.count({
      where: { ruleId: id },
    });

    if (instanceCount > 0) {
      throw new Error(
        `该规则已有 ${instanceCount} 个审核实例，无法删除。建议禁用该规则。`
      );
    }

    await prisma.approvalRuleConfig.delete({ where: { id } });
    return { message: '规则已删除' };
  }

  /**
   * 检查单据是否需要审核
   */
  async requiresApproval(docType: string, docId: string): Promise<boolean> {
    const rules = await prisma.approvalRuleConfig.findMany({
      where: { docType, enabled: true },
    });

    if (rules.length === 0) return false;

    const docData = await getDocData(docType, docId);
    if (!docData) return false;

    return rules.some((r) =>
      evaluateCondition(r.condition as ApprovalCondition | ApprovalCondition[] | null, docData)
    );
  }
}
