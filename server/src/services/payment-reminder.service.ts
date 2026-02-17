/**
 * 付款提醒服务 (PaymentReminder)
 * 管理付款计划的到期提醒和逾期提醒
 */

import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export interface PaymentReminderCreateInput {
  paymentPlanId: string;
  purchaseContractId: string;
  purchaseContractCode?: string;
  supplierId?: string;
  supplierCode?: string;
  supplierName?: string;
  reminderType: number; // 1-即将到期 2-已逾期
  reminderDate: Date;
  expectedDate: Date;
  payableAmt: number | Prisma.Decimal;
  paidAmt?: number | Prisma.Decimal;
  overdueDays?: number;
  periodIndex?: number;
  targetUserId?: string;
}

export interface PaymentReminderQueryParams {
  page?: number;
  pageSize?: number;
  targetUserId?: string;
  reminderType?: number;
  readStatus?: number;
  handleStatus?: number;
  startDate?: Date;
  endDate?: Date;
}

export class PaymentReminderService {
  constructor() {}

  /**
   * 创建提醒
   */
  async create(data: PaymentReminderCreateInput) {
    return prisma.paymentReminder.create({
      data: {
        paymentPlanId: data.paymentPlanId,
        purchaseContractId: data.purchaseContractId,
        purchaseContractCode: data.purchaseContractCode,
        supplierId: data.supplierId,
        supplierCode: data.supplierCode,
        supplierName: data.supplierName,
        reminderType: data.reminderType,
        reminderDate: data.reminderDate,
        expectedDate: data.expectedDate,
        payableAmt: data.payableAmt,
        paidAmt: data.paidAmt ?? 0,
        overdueDays: data.overdueDays ?? 0,
        periodIndex: data.periodIndex ?? 1,
        targetUserId: data.targetUserId,
      },
    });
  }

  /**
   * 批量创建提醒
   */
  async createMany(reminders: PaymentReminderCreateInput[]) {
    if (reminders.length === 0) return [];

    return prisma.$transaction(
      reminders.map((data) =>
        prisma.paymentReminder.create({
          data: {
            paymentPlanId: data.paymentPlanId,
            purchaseContractId: data.purchaseContractId,
            purchaseContractCode: data.purchaseContractCode,
            supplierId: data.supplierId,
            supplierCode: data.supplierCode,
            supplierName: data.supplierName,
            reminderType: data.reminderType,
            reminderDate: data.reminderDate,
            expectedDate: data.expectedDate,
            payableAmt: data.payableAmt,
            paidAmt: data.paidAmt ?? 0,
            overdueDays: data.overdueDays ?? 0,
            periodIndex: data.periodIndex ?? 1,
            targetUserId: data.targetUserId,
          },
        })
      )
    );
  }

  /**
   * 获取用户提醒列表
   */
  async getUserReminders(params: PaymentReminderQueryParams = {}) {
    const {
      page = 1,
      pageSize = 20,
      targetUserId,
      reminderType,
      readStatus,
      handleStatus,
      startDate,
      endDate,
    } = params;

    const where: Prisma.PaymentReminderWhereInput = {};

    if (targetUserId) where.targetUserId = targetUserId;
    if (reminderType !== undefined) where.reminderType = reminderType;
    if (readStatus !== undefined) where.readStatus = readStatus;
    if (handleStatus !== undefined) where.handleStatus = handleStatus;

    if (startDate || endDate) {
      where.reminderDate = {};
      if (startDate) where.reminderDate.gte = startDate;
      if (endDate) where.reminderDate.lte = endDate;
    }

    const [total, reminders] = await Promise.all([
      prisma.paymentReminder.count({ where }),
      prisma.paymentReminder.findMany({
        where,
        include: {
          paymentPlan: {
            select: {
              id: true,
              periodIndex: true,
              paymentDescription: true,
              periodPayable: true,
              periodPaid: true,
              expectedPaymentDate: true,
              exeStatus: true,
            },
          },
        },
        orderBy: [{ readStatus: 'asc' }, { reminderDate: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { reminders, total, page, pageSize };
  }

  /**
   * 获取未读提醒数量
   */
  async getUnreadCount(targetUserId?: string) {
    const where: Prisma.PaymentReminderWhereInput = {
      readStatus: 0,
    };
    if (targetUserId) where.targetUserId = targetUserId;

    return prisma.paymentReminder.count({ where });
  }

  /**
   * 标记单条提醒为已读
   */
  async markAsRead(id: string) {
    return prisma.paymentReminder.update({
      where: { id },
      data: {
        readStatus: 1,
        readAt: new Date(),
      },
    });
  }

  /**
   * 标记用户所有提醒为已读
   */
  async markAllAsRead(targetUserId: string) {
    return prisma.paymentReminder.updateMany({
      where: {
        targetUserId,
        readStatus: 0,
      },
      data: {
        readStatus: 1,
        readAt: new Date(),
      },
    });
  }

  /**
   * 标记提醒为已处理
   */
  async markAsHandled(id: string) {
    return prisma.paymentReminder.update({
      where: { id },
      data: {
        handleStatus: 1,
      },
    });
  }

  /**
   * 根据付款计划ID查找提醒
   */
  async findByPaymentPlanId(paymentPlanId: string) {
    return prisma.paymentReminder.findMany({
      where: { paymentPlanId },
      orderBy: { reminderDate: 'desc' },
    });
  }

  /**
   * 检查今日是否已为该计划生成过指定类型的提醒
   */
  async hasTodayReminder(paymentPlanId: string, reminderType: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await prisma.paymentReminder.count({
      where: {
        paymentPlanId,
        reminderType,
        reminderDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return count > 0;
  }

  /**
   * 删除付款计划关联的所有未读提醒
   * 当付款完成时调用
   */
  async deleteUnreadByPlanId(paymentPlanId: string) {
    return prisma.paymentReminder.deleteMany({
      where: {
        paymentPlanId,
        readStatus: 0,
      },
    });
  }

  /**
   * 获取提醒统计
   */
  async getStatistics(targetUserId?: string) {
    const where: Prisma.PaymentReminderWhereInput = {};
    if (targetUserId) where.targetUserId = targetUserId;

    const [total, unread, dueSoon, overdue] = await Promise.all([
      prisma.paymentReminder.count({ where }),
      prisma.paymentReminder.count({ where: { ...where, readStatus: 0 } }),
      prisma.paymentReminder.count({ where: { ...where, reminderType: 1, readStatus: 0 } }),
      prisma.paymentReminder.count({ where: { ...where, reminderType: 2, readStatus: 0 } }),
    ]);

    return {
      total,
      unread,
      dueSoon,
      overdue,
    };
  }
}
