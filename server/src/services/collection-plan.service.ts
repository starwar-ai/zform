/**
 * 收款计划服务 (SmsCollectionPlan)
 * 基于 zexport CollectionPlan，支持分期付款如 "T/T 20%预付，余款发货后30天"
 */

import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type CollectionPlanCreateInput = {
  salesContractId: string;
  periodIndex: number;
  receiptMethodType?: number;
  receiptDescription?: string;
  receiptDateBase?: number;
  baseDate?: Date;
  daysOffset: number;
  expectedReceiptDate?: Date;
  receiptRatio: number | Decimal;
  periodReceivable: number | Decimal;
  periodReceived?: number | Decimal;
  blockPurchaseUntilPaid?: number;
  blockShipmentUntilPaid?: number;
  exeStatus?: number;
  children?: unknown;
  differenceReason?: unknown;
};

export type CollectionPlanUpdateInput = Partial<CollectionPlanCreateInput>;

export class CollectionPlanService {
  constructor() {}

  async findBySalesContractId(salesContractId: string) {
    return prisma.smsCollectionPlan.findMany({
      where: {
        salesContractId,
        deletedAt: null,
      },
      orderBy: { periodIndex: 'asc' },
    });
  }

  async findById(id: string) {
    const plan = await prisma.smsCollectionPlan.findFirst({
      where: { id, deletedAt: null },
    });
    if (!plan) throw new Error('收款计划不存在');
    return plan;
  }

  async create(data: CollectionPlanCreateInput, userId: string) {
    return prisma.smsCollectionPlan.create({
      data: {
        ...data,
        periodReceived: data.periodReceived ?? 0,
        blockPurchaseUntilPaid: data.blockPurchaseUntilPaid ?? 0,
        blockShipmentUntilPaid: data.blockShipmentUntilPaid ?? 0,
        exeStatus: data.exeStatus ?? 0,
        createdBy: userId,
        updatedBy: userId,
      } as any,
    });
  }

  async createMany(
    salesContractId: string,
    plans: Omit<CollectionPlanCreateInput, 'salesContractId'>[],
    userId: string
  ) {
    if (plans.length === 0) return [];

    const toNum = (v: unknown) => (v === true ? 1 : v === false ? 0 : Number(v ?? 0));
    const created = await prisma.$transaction(
      plans.map((p: any, index) =>
        prisma.smsCollectionPlan.create({
          data: {
            salesContractId,
            periodIndex: p.periodIndex ?? index + 1,
            receiptMethodType: p.receiptMethodType,
            receiptDescription: p.receiptDescription,
            receiptDateBase: p.receiptDateBase,
            baseDate: p.baseDate,
            daysOffset: p.daysOffset ?? 0,
            expectedReceiptDate: p.expectedReceiptDate,
            receiptRatio: p.receiptRatio,
            periodReceivable: p.periodReceivable,
            periodReceived: p.periodReceived ?? 0,
            blockPurchaseUntilPaid: toNum(p.blockPurchaseUntilPaid),
            blockShipmentUntilPaid: toNum(p.blockShipmentUntilPaid),
            exeStatus: p.exeStatus ?? 0,
            children: p.children as Prisma.InputJsonValue | undefined,
            differenceReason: p.differenceReason as Prisma.InputJsonValue | undefined,
            createdBy: userId,
            updatedBy: userId,
          },
        })
      )
    );
    return created;
  }

  async update(id: string, data: CollectionPlanUpdateInput, userId: string) {
    await this.findById(id);
    return prisma.smsCollectionPlan.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      } as any,
    });
  }

  async delete(id: string, userId: string) {
    await this.findById(id);
    return prisma.smsCollectionPlan.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async deleteBySalesContractId(salesContractId: string, userId: string) {
    return prisma.smsCollectionPlan.updateMany({
      where: { salesContractId },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // 批量更新收款计划（替换模式：先删后建）
  async upsertBySalesContractId(
    salesContractId: string,
    plans: Omit<CollectionPlanCreateInput, 'salesContractId'>[],
    userId: string
  ) {
    await this.deleteBySalesContractId(salesContractId, userId);
    if (plans.length === 0) return [];
    return this.createMany(salesContractId, plans, userId);
  }

  // 更新实收金额并计算执行状态
  async updateReceivedAmount(
    id: string,
    periodReceived: number | Decimal,
    userId: string
  ) {
    const plan = await this.findById(id);
    const receivable = Number(plan.periodReceivable);
    const received = Number(periodReceived);

    let exeStatus = 0;
    if (received >= receivable) exeStatus = 2; // 已执行
    else if (received > 0) exeStatus = 1; // 部分执行

    const realRatio = receivable > 0 ? (received / receivable) * 100 : 0;

    return prisma.smsCollectionPlan.update({
      where: { id },
      data: {
        periodReceived,
        realCollectionRatio: realRatio,
        exeStatus,
        updatedBy: userId,
      },
    });
  }

  // 计算预计收款日（根据 baseDate + daysOffset）
  static calcExpectedReceiptDate(baseDate: Date, daysOffset: number): Date {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + daysOffset);
    return d;
  }

  // ============================================================
  // 收款工作台相关方法
  // ============================================================

  /**
   * 获取收款工作台统计数据
   */
  async getWorkbenchData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 计算本周开始和结束
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // 未执行的收款计划（exeStatus < 2）
    const pendingPlans = await prisma.smsCollectionPlan.findMany({
      where: {
        deletedAt: null,
        exeStatus: { lt: 2 },
      },
      include: {
        salesContract: {
          select: {
            id: true,
            code: true,
            customerId: true,
            customerCode: true,
            customerName: true,
            salesPerson: true,
          },
        },
      },
    });

    // 统计
    let totalReceivable = 0;
    let totalReceived = 0;
    let thisWeekReceivable = 0;
    let overdueReceivable = 0;
    let overdueCount = 0;
    let thisWeekCount = 0;

    for (const plan of pendingPlans) {
      const receivable = Number(plan.periodReceivable);
      const received = Number(plan.periodReceived);
      const remaining = receivable - received;

      totalReceivable += receivable;
      totalReceived += received;

      if (plan.expectedReceiptDate) {
        const expectedDate = new Date(plan.expectedReceiptDate);
        expectedDate.setHours(0, 0, 0, 0);

        // 本周到期
        if (expectedDate >= weekStart && expectedDate <= weekEnd) {
          thisWeekReceivable += remaining;
          thisWeekCount++;
        }

        // 已逾期
        if (expectedDate < today && remaining > 0) {
          overdueReceivable += remaining;
          overdueCount++;
        }
      }
    }

    // 已完成的收款计划
    const completedCount = await prisma.smsCollectionPlan.count({
      where: {
        deletedAt: null,
        exeStatus: 2,
      },
    });

    return {
      totalReceivable,
      totalReceived,
      totalRemaining: totalReceivable - totalReceived,
      thisWeekReceivable,
      thisWeekCount,
      overdueReceivable,
      overdueCount,
      completedCount,
      progressRate: totalReceivable > 0 ? (totalReceived / totalReceivable) * 100 : 0,
    };
  }

  /**
   * 获取本周待收款列表
   */
  async getThisWeekDueList(params: { page?: number; pageSize?: number } = {}) {
    const { page = 1, pageSize = 20 } = params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const where: Prisma.SmsCollectionPlanWhereInput = {
      deletedAt: null,
      exeStatus: { lt: 2 },
      expectedReceiptDate: {
        gte: weekStart,
        lte: weekEnd,
      },
    };

    const [total, plans] = await Promise.all([
      prisma.smsCollectionPlan.count({ where }),
      prisma.smsCollectionPlan.findMany({
        where,
        include: {
          salesContract: {
            select: {
              id: true,
              code: true,
              customerId: true,
              customerCode: true,
              customerName: true,
              salesPerson: true,
              totalAmount: true,
              currency: true,
            },
          },
        },
        orderBy: { expectedReceiptDate: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { plans, total, page, pageSize };
  }

  /**
   * 获取逾期列表
   */
  async getOverdueList(params: {
    page?: number;
    pageSize?: number;
    customerId?: string;
    salesPerson?: string;
    minOverdueDays?: number;
    maxOverdueDays?: number;
  } = {}) {
    const { page = 1, pageSize = 20, customerId, salesPerson, minOverdueDays, maxOverdueDays } = params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Prisma.SmsCollectionPlanWhereInput = {
      deletedAt: null,
      exeStatus: { lt: 2 },
      expectedReceiptDate: { lt: today },
    };

    // 过滤逾期天数
    if (minOverdueDays !== undefined || maxOverdueDays !== undefined) {
      where.overdueDays = {};
      if (minOverdueDays !== undefined) where.overdueDays.gte = minOverdueDays;
      if (maxOverdueDays !== undefined) where.overdueDays.lte = maxOverdueDays;
    }

    // 通过关联合同过滤客户和业务员
    if (customerId || salesPerson) {
      where.salesContract = {
        ...(customerId && { customerId }),
        ...(salesPerson && { salesPerson }),
      };
    }

    const [total, plans] = await Promise.all([
      prisma.smsCollectionPlan.count({ where }),
      prisma.smsCollectionPlan.findMany({
        where,
        include: {
          salesContract: {
            select: {
              id: true,
              code: true,
              customerId: true,
              customerCode: true,
              customerName: true,
              salesPerson: true,
              totalAmount: true,
              currency: true,
            },
          },
        },
        orderBy: { overdueDays: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { plans, total, page, pageSize };
  }

  /**
   * 获取逾期报表数据（带汇总）
   */
  async getOverdueReport(params: {
    page?: number;
    pageSize?: number;
    customerId?: string;
    salesPerson?: string;
    minOverdueDays?: number;
    maxOverdueDays?: number;
  } = {}) {
    const listResult = await this.getOverdueList(params);

    // 计算汇总
    const allOverdue = await prisma.smsCollectionPlan.findMany({
      where: {
        deletedAt: null,
        exeStatus: { lt: 2 },
        expectedReceiptDate: { lt: new Date() },
        ...(params.customerId && {
          salesContract: { customerId: params.customerId },
        }),
        ...(params.salesPerson && {
          salesContract: { salesPerson: params.salesPerson },
        }),
      },
      select: {
        periodReceivable: true,
        periodReceived: true,
        overdueDays: true,
      },
    });

    let totalOverdueAmount = 0;
    let maxOverdueDays = 0;
    let avgOverdueDays = 0;

    for (const plan of allOverdue) {
      const remaining = Number(plan.periodReceivable) - Number(plan.periodReceived);
      totalOverdueAmount += remaining;
      if (plan.overdueDays > maxOverdueDays) {
        maxOverdueDays = plan.overdueDays;
      }
      avgOverdueDays += plan.overdueDays;
    }

    if (allOverdue.length > 0) {
      avgOverdueDays = Math.round(avgOverdueDays / allOverdue.length);
    }

    return {
      ...listResult,
      summary: {
        totalOverdueAmount,
        totalOverdueCount: allOverdue.length,
        maxOverdueDays,
        avgOverdueDays,
      },
    };
  }

  /**
   * 获取单个合同的收款进度
   */
  async getProgressBoard(salesContractId: string) {
    const plans = await prisma.smsCollectionPlan.findMany({
      where: {
        salesContractId,
        deletedAt: null,
      },
      orderBy: { periodIndex: 'asc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalReceivable = 0;
    let totalReceived = 0;

    const planDetails = plans.map((plan) => {
      const receivable = Number(plan.periodReceivable);
      const received = Number(plan.periodReceived);
      totalReceivable += receivable;
      totalReceived += received;

      let status: 'pending' | 'partial' | 'completed' | 'overdue' = 'pending';
      if (plan.exeStatus === 2) {
        status = 'completed';
      } else if (plan.exeStatus === 1) {
        status = 'partial';
      } else if (
        plan.expectedReceiptDate &&
        new Date(plan.expectedReceiptDate) < today &&
        received < receivable
      ) {
        status = 'overdue';
      }

      return {
        id: plan.id,
        periodIndex: plan.periodIndex,
        receiptDescription: plan.receiptDescription,
        expectedReceiptDate: plan.expectedReceiptDate,
        actualReceiptDate: plan.actualReceiptDate,
        receivable,
        received,
        remaining: receivable - received,
        ratio: receivable > 0 ? (received / receivable) * 100 : 0,
        status,
        overdueDays: plan.overdueDays,
      };
    });

    return {
      salesContractId,
      totalReceivable,
      totalReceived,
      totalRemaining: totalReceivable - totalReceived,
      progressRate: totalReceivable > 0 ? (totalReceived / totalReceivable) * 100 : 0,
      plans: planDetails,
    };
  }

  /**
   * 批量更新逾期状态
   * 由定时任务调用
   */
  async updateOverdueStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 提前3天预警
    const warningDate = new Date(today);
    warningDate.setDate(warningDate.getDate() + 3);

    // 获取所有未完成的收款计划
    const pendingPlans = await prisma.smsCollectionPlan.findMany({
      where: {
        deletedAt: null,
        exeStatus: { lt: 2 },
        expectedReceiptDate: { not: null },
      },
    });

    const updates: Promise<unknown>[] = [];

    for (const plan of pendingPlans) {
      if (!plan.expectedReceiptDate) continue;

      const expectedDate = new Date(plan.expectedReceiptDate);
      expectedDate.setHours(0, 0, 0, 0);

      let overdueStatus = 0;
      let overdueDays = 0;

      if (expectedDate < today) {
        // 已逾期
        overdueStatus = 2;
        overdueDays = Math.floor(
          (today.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      } else if (expectedDate <= warningDate) {
        // 即将到期
        overdueStatus = 1;
      }

      // 仅当状态有变化时才更新
      if (plan.overdueStatus !== overdueStatus || plan.overdueDays !== overdueDays) {
        updates.push(
          prisma.smsCollectionPlan.update({
            where: { id: plan.id },
            data: { overdueStatus, overdueDays },
          })
        );
      }
    }

    await Promise.all(updates);

    return { updated: updates.length };
  }

  /**
   * 更新实收金额并计算执行状态（扩展版）
   * 支持记录实际收款日
   */
  async updateReceivedAmountWithDate(
    id: string,
    periodReceived: number | Decimal,
    actualReceiptDate: Date | null,
    userId: string
  ) {
    const plan = await this.findById(id);
    const receivable = Number(plan.periodReceivable);
    const received = Number(periodReceived);

    let exeStatus = 0;
    if (received >= receivable) exeStatus = 2; // 已执行
    else if (received > 0) exeStatus = 1; // 部分执行

    const realRatio = receivable > 0 ? (received / receivable) * 100 : 0;

    // 如果已完成收款，重置逾期状态
    const overdueStatus = exeStatus === 2 ? 0 : plan.overdueStatus;
    const overdueDays = exeStatus === 2 ? 0 : plan.overdueDays;

    return prisma.smsCollectionPlan.update({
      where: { id },
      data: {
        periodReceived,
        realCollectionRatio: realRatio,
        exeStatus,
        actualReceiptDate,
        overdueStatus,
        overdueDays,
        updatedBy: userId,
      },
    });
  }
}
