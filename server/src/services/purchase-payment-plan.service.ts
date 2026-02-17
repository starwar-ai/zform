/**
 * 采购付款计划服务 (PurchasePaymentPlan)
 * 跟踪采购合同的分期付款执行状态
 */

import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type PaymentPlanCreateInput = {
  purchaseContractId: string;
  periodIndex: number;
  paymentMethodType?: number;
  paymentDescription?: string;
  paymentDateBase?: number;
  baseDate?: Date;
  daysOffset: number;
  expectedPaymentDate?: Date;
  paymentRatio: number | Decimal;
  periodPayable: number | Decimal;
  periodPaid?: number | Decimal;
  exeStatus?: number;
};

export type PaymentPlanUpdateInput = Partial<PaymentPlanCreateInput>;

export class PurchasePaymentPlanService {
  constructor() {}

  async findByPurchaseContractId(purchaseContractId: string) {
    return prisma.purchasePaymentPlan.findMany({
      where: {
        purchaseContractId,
        deletedAt: null,
      },
      orderBy: { periodIndex: 'asc' },
    });
  }

  async findById(id: string) {
    const plan = await prisma.purchasePaymentPlan.findFirst({
      where: { id, deletedAt: null },
    });
    if (!plan) throw new Error('付款计划不存在');
    return plan;
  }

  async create(data: PaymentPlanCreateInput, userId: string) {
    return prisma.purchasePaymentPlan.create({
      data: {
        ...data,
        periodPaid: data.periodPaid ?? 0,
        exeStatus: data.exeStatus ?? 0,
        createdBy: userId,
        updatedBy: userId,
      } as any,
    });
  }

  async createMany(
    purchaseContractId: string,
    plans: Omit<PaymentPlanCreateInput, 'purchaseContractId'>[],
    userId: string
  ) {
    if (plans.length === 0) return [];

    const created = await prisma.$transaction(
      plans.map((p: any, index) =>
        prisma.purchasePaymentPlan.create({
          data: {
            purchaseContractId,
            periodIndex: p.periodIndex ?? index + 1,
            paymentMethodType: p.paymentMethodType,
            paymentDescription: p.paymentDescription,
            paymentDateBase: p.paymentDateBase,
            baseDate: p.baseDate,
            daysOffset: p.daysOffset ?? 0,
            expectedPaymentDate: p.expectedPaymentDate,
            paymentRatio: p.paymentRatio,
            periodPayable: p.periodPayable,
            periodPaid: p.periodPaid ?? 0,
            exeStatus: p.exeStatus ?? 0,
            createdBy: userId,
            updatedBy: userId,
          },
        })
      )
    );
    return created;
  }

  async update(id: string, data: PaymentPlanUpdateInput, userId: string) {
    await this.findById(id);
    return prisma.purchasePaymentPlan.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      } as any,
    });
  }

  async delete(id: string, userId: string) {
    await this.findById(id);
    return prisma.purchasePaymentPlan.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async deleteByPurchaseContractId(purchaseContractId: string, userId: string) {
    return prisma.purchasePaymentPlan.updateMany({
      where: { purchaseContractId },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // 批量更新付款计划（替换模式：先删后建）
  async upsertByPurchaseContractId(
    purchaseContractId: string,
    plans: Omit<PaymentPlanCreateInput, 'purchaseContractId'>[],
    userId: string
  ) {
    await this.deleteByPurchaseContractId(purchaseContractId, userId);
    if (plans.length === 0) return [];
    return this.createMany(purchaseContractId, plans, userId);
  }

  // 更新实付金额并计算执行状态
  async updatePaidAmount(
    id: string,
    periodPaid: number | Decimal,
    userId: string
  ) {
    const plan = await this.findById(id);
    const payable = Number(plan.periodPayable);
    const paid = Number(periodPaid);

    let exeStatus = 0;
    if (paid >= payable) exeStatus = 2; // 已执行
    else if (paid > 0) exeStatus = 1; // 部分执行

    const realRatio = payable > 0 ? (paid / payable) * 100 : 0;

    return prisma.purchasePaymentPlan.update({
      where: { id },
      data: {
        periodPaid,
        realPaymentRatio: realRatio,
        exeStatus,
        updatedBy: userId,
      },
    });
  }

  /**
   * 更新实付金额（扩展版）
   * 支持记录实际付款日，并计算 earlyDays
   */
  async updatePaidAmountWithDate(
    id: string,
    periodPaid: number | Decimal,
    actualPaymentDate: Date | null,
    userId: string
  ) {
    const plan = await this.findById(id);
    const payable = Number(plan.periodPayable);
    const paid = Number(periodPaid);

    let exeStatus = 0;
    if (paid >= payable) exeStatus = 2;
    else if (paid > 0) exeStatus = 1;

    const realRatio = payable > 0 ? (paid / payable) * 100 : 0;

    // 计算 earlyDays：正=提前，负=逾期，0=准时
    let earlyDays = 0;
    if (actualPaymentDate && plan.expectedPaymentDate) {
      const expected = new Date(plan.expectedPaymentDate);
      expected.setHours(0, 0, 0, 0);
      const actual = new Date(actualPaymentDate);
      actual.setHours(0, 0, 0, 0);
      const msPerDay = 1000 * 60 * 60 * 24;
      earlyDays = Math.floor((expected.getTime() - actual.getTime()) / msPerDay);
    }

    // 如果已完成付款，重置逾期状态
    const overdueStatus = exeStatus === 2 ? 0 : plan.overdueStatus;
    const overdueDays = exeStatus === 2 ? 0 : plan.overdueDays;

    return prisma.purchasePaymentPlan.update({
      where: { id },
      data: {
        periodPaid,
        realPaymentRatio: realRatio,
        exeStatus,
        actualPaymentDate,
        earlyDays,
        overdueStatus,
        overdueDays,
        updatedBy: userId,
      },
    });
  }

  // 计算预计付款日（根据 baseDate + daysOffset）
  static calcExpectedPaymentDate(baseDate: Date, daysOffset: number): Date {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + daysOffset);
    return d;
  }

  // ============================================================
  // 付款工作台相关方法
  // ============================================================

  /**
   * 获取付款工作台统计数据
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

    // 未执行的付款计划（exeStatus < 2）
    const pendingPlans = await prisma.purchasePaymentPlan.findMany({
      where: {
        deletedAt: null,
        exeStatus: { lt: 2 },
      },
      include: {
        purchaseContract: {
          select: {
            id: true,
            code: true,
            supplierId: true,
            supplierCode: true,
            supplierName: true,
            buyerCode: true,
          },
        },
      },
    });

    // 统计
    let totalPayable = 0;
    let totalPaid = 0;
    let thisWeekPayable = 0;
    let overduePayable = 0;
    let overdueCount = 0;
    let thisWeekCount = 0;

    for (const plan of pendingPlans) {
      const payable = Number(plan.periodPayable);
      const paid = Number(plan.periodPaid);
      const remaining = payable - paid;

      totalPayable += payable;
      totalPaid += paid;

      if (plan.expectedPaymentDate) {
        const expectedDate = new Date(plan.expectedPaymentDate);
        expectedDate.setHours(0, 0, 0, 0);

        // 本周到期
        if (expectedDate >= weekStart && expectedDate <= weekEnd) {
          thisWeekPayable += remaining;
          thisWeekCount++;
        }

        // 已逾期
        if (expectedDate < today && remaining > 0) {
          overduePayable += remaining;
          overdueCount++;
        }
      }
    }

    // 已完成的付款计划
    const completedCount = await prisma.purchasePaymentPlan.count({
      where: {
        deletedAt: null,
        exeStatus: 2,
      },
    });

    return {
      totalPayable,
      totalPaid,
      totalRemaining: totalPayable - totalPaid,
      thisWeekPayable,
      thisWeekCount,
      overduePayable,
      overdueCount,
      completedCount,
      progressRate: totalPayable > 0 ? (totalPaid / totalPayable) * 100 : 0,
    };
  }

  /**
   * 获取本周待付款列表
   */
  async getThisWeekDueList(params: {
    page?: number;
    pageSize?: number;
    supplierId?: string;
    buyerCode?: string;
  } = {}) {
    const { page = 1, pageSize = 20, supplierId, buyerCode } = params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const where: Prisma.PurchasePaymentPlanWhereInput = {
      deletedAt: null,
      exeStatus: { lt: 2 },
      expectedPaymentDate: {
        gte: weekStart,
        lte: weekEnd,
      },
    };

    if (supplierId || buyerCode) {
      where.purchaseContract = {
        ...(supplierId && { supplierId }),
        ...(buyerCode && { buyerCode }),
      };
    }

    const [total, plans] = await Promise.all([
      prisma.purchasePaymentPlan.count({ where }),
      prisma.purchasePaymentPlan.findMany({
        where,
        include: {
          purchaseContract: {
            select: {
              id: true,
              code: true,
              supplierId: true,
              supplierCode: true,
              supplierName: true,
              buyerCode: true,
              buyerName: true,
              totalAmount: true,
              currency: true,
            },
          },
        },
        orderBy: { expectedPaymentDate: 'asc' },
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
    supplierId?: string;
    buyerCode?: string;
    minOverdueDays?: number;
    maxOverdueDays?: number;
  } = {}) {
    const { page = 1, pageSize = 20, supplierId, buyerCode, minOverdueDays, maxOverdueDays } = params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Prisma.PurchasePaymentPlanWhereInput = {
      deletedAt: null,
      exeStatus: { lt: 2 },
      expectedPaymentDate: { lt: today },
    };

    // 过滤逾期天数
    if (minOverdueDays !== undefined || maxOverdueDays !== undefined) {
      where.overdueDays = {};
      if (minOverdueDays !== undefined) where.overdueDays.gte = minOverdueDays;
      if (maxOverdueDays !== undefined) where.overdueDays.lte = maxOverdueDays;
    }

    // 通过关联合同过滤供应商和采购员
    if (supplierId || buyerCode) {
      where.purchaseContract = {
        ...(supplierId && { supplierId }),
        ...(buyerCode && { buyerCode }),
      };
    }

    const [total, plans] = await Promise.all([
      prisma.purchasePaymentPlan.count({ where }),
      prisma.purchasePaymentPlan.findMany({
        where,
        include: {
          purchaseContract: {
            select: {
              id: true,
              code: true,
              supplierId: true,
              supplierCode: true,
              supplierName: true,
              buyerCode: true,
              buyerName: true,
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
    supplierId?: string;
    buyerCode?: string;
    minOverdueDays?: number;
    maxOverdueDays?: number;
  } = {}) {
    const listResult = await this.getOverdueList(params);

    // 计算汇总
    const allOverdue = await prisma.purchasePaymentPlan.findMany({
      where: {
        deletedAt: null,
        exeStatus: { lt: 2 },
        expectedPaymentDate: { lt: new Date() },
        ...(params.supplierId && {
          purchaseContract: { supplierId: params.supplierId },
        }),
        ...(params.buyerCode && {
          purchaseContract: { buyerCode: params.buyerCode },
        }),
      },
      select: {
        periodPayable: true,
        periodPaid: true,
        overdueDays: true,
      },
    });

    let totalOverdueAmount = 0;
    let maxOverdueDays = 0;
    let avgOverdueDays = 0;

    for (const plan of allOverdue) {
      const remaining = Number(plan.periodPayable) - Number(plan.periodPaid);
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
   * 获取单个合同的付款进度
   */
  async getProgressBoard(purchaseContractId: string) {
    const plans = await prisma.purchasePaymentPlan.findMany({
      where: {
        purchaseContractId,
        deletedAt: null,
      },
      orderBy: { periodIndex: 'asc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalPayable = 0;
    let totalPaid = 0;

    const planDetails = plans.map((plan) => {
      const payable = Number(plan.periodPayable);
      const paid = Number(plan.periodPaid);
      totalPayable += payable;
      totalPaid += paid;

      let status: 'pending' | 'partial' | 'completed' | 'overdue' = 'pending';
      if (plan.exeStatus === 2) {
        status = 'completed';
      } else if (plan.exeStatus === 1) {
        status = 'partial';
      } else if (
        plan.expectedPaymentDate &&
        new Date(plan.expectedPaymentDate) < today &&
        paid < payable
      ) {
        status = 'overdue';
      }

      // 付款时效标记
      let paymentTiming: 'early' | 'late' | 'ontime' | null = null;
      if (plan.exeStatus === 2 && plan.actualPaymentDate) {
        if (plan.earlyDays > 0) paymentTiming = 'early';
        else if (plan.earlyDays < 0) paymentTiming = 'late';
        else paymentTiming = 'ontime';
      }

      return {
        id: plan.id,
        periodIndex: plan.periodIndex,
        paymentDescription: plan.paymentDescription,
        expectedPaymentDate: plan.expectedPaymentDate,
        actualPaymentDate: plan.actualPaymentDate,
        payable,
        paid,
        remaining: payable - paid,
        ratio: payable > 0 ? (paid / payable) * 100 : 0,
        status,
        overdueDays: plan.overdueDays,
        earlyDays: plan.earlyDays,
        paymentTiming,
      };
    });

    return {
      purchaseContractId,
      totalPayable,
      totalPaid,
      totalRemaining: totalPayable - totalPaid,
      progressRate: totalPayable > 0 ? (totalPaid / totalPayable) * 100 : 0,
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

    // 获取所有未完成的付款计划
    const pendingPlans = await prisma.purchasePaymentPlan.findMany({
      where: {
        deletedAt: null,
        exeStatus: { lt: 2 },
        expectedPaymentDate: { not: null },
      },
    });

    const updates: Promise<unknown>[] = [];

    for (const plan of pendingPlans) {
      if (!plan.expectedPaymentDate) continue;

      const expectedDate = new Date(plan.expectedPaymentDate);
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
          prisma.purchasePaymentPlan.update({
            where: { id: plan.id },
            data: { overdueStatus, overdueDays },
          })
        );
      }
    }

    await Promise.all(updates);

    return { updated: updates.length };
  }
}
