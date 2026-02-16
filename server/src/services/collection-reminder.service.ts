/**
 * 收款提醒服务 (CollectionReminder)
 * 管理收款计划的到期提醒和逾期提醒
 */

import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export interface ReminderCreateInput {
  collectionPlanId: string;
  salesContractId: string;
  salesContractCode?: string;
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  reminderType: number; // 1-即将到期 2-已逾期
  reminderDate: Date;
  expectedDate: Date;
  receivableAmt: number | Prisma.Decimal;
  receivedAmt?: number | Prisma.Decimal;
  overdueDays?: number;
  periodIndex?: number;
  targetUserId?: string;
}

export interface ReminderQueryParams {
  page?: number;
  pageSize?: number;
  targetUserId?: string;
  reminderType?: number;
  readStatus?: number;
  handleStatus?: number;
  startDate?: Date;
  endDate?: Date;
}

export class CollectionReminderService {
  constructor() {}

  /**
   * 创建提醒
   */
  async create(data: ReminderCreateInput) {
    return prisma.collectionReminder.create({
      data: {
        collectionPlanId: data.collectionPlanId,
        salesContractId: data.salesContractId,
        salesContractCode: data.salesContractCode,
        customerId: data.customerId,
        customerCode: data.customerCode,
        customerName: data.customerName,
        reminderType: data.reminderType,
        reminderDate: data.reminderDate,
        expectedDate: data.expectedDate,
        receivableAmt: data.receivableAmt,
        receivedAmt: data.receivedAmt ?? 0,
        overdueDays: data.overdueDays ?? 0,
        periodIndex: data.periodIndex ?? 1,
        targetUserId: data.targetUserId,
      },
    });
  }

  /**
   * 批量创建提醒
   */
  async createMany(reminders: ReminderCreateInput[]) {
    if (reminders.length === 0) return [];

    return prisma.$transaction(
      reminders.map((data) =>
        prisma.collectionReminder.create({
          data: {
            collectionPlanId: data.collectionPlanId,
            salesContractId: data.salesContractId,
            salesContractCode: data.salesContractCode,
            customerId: data.customerId,
            customerCode: data.customerCode,
            customerName: data.customerName,
            reminderType: data.reminderType,
            reminderDate: data.reminderDate,
            expectedDate: data.expectedDate,
            receivableAmt: data.receivableAmt,
            receivedAmt: data.receivedAmt ?? 0,
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
  async getUserReminders(params: ReminderQueryParams = {}) {
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

    const where: Prisma.CollectionReminderWhereInput = {};

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
      prisma.collectionReminder.count({ where }),
      prisma.collectionReminder.findMany({
        where,
        include: {
          collectionPlan: {
            select: {
              id: true,
              periodIndex: true,
              receiptDescription: true,
              periodReceivable: true,
              periodReceived: true,
              expectedReceiptDate: true,
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
    const where: Prisma.CollectionReminderWhereInput = {
      readStatus: 0,
    };
    if (targetUserId) where.targetUserId = targetUserId;

    return prisma.collectionReminder.count({ where });
  }

  /**
   * 标记单条提醒为已读
   */
  async markAsRead(id: string) {
    return prisma.collectionReminder.update({
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
    return prisma.collectionReminder.updateMany({
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
    return prisma.collectionReminder.update({
      where: { id },
      data: {
        handleStatus: 1,
      },
    });
  }

  /**
   * 根据收款计划ID查找提醒
   */
  async findByCollectionPlanId(collectionPlanId: string) {
    return prisma.collectionReminder.findMany({
      where: { collectionPlanId },
      orderBy: { reminderDate: 'desc' },
    });
  }

  /**
   * 检查今日是否已为该计划生成过指定类型的提醒
   */
  async hasTodayReminder(collectionPlanId: string, reminderType: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await prisma.collectionReminder.count({
      where: {
        collectionPlanId,
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
   * 删除收款计划关联的所有未读提醒
   * 当收款完成时调用
   */
  async deleteUnreadByPlanId(collectionPlanId: string) {
    return prisma.collectionReminder.deleteMany({
      where: {
        collectionPlanId,
        readStatus: 0,
      },
    });
  }

  /**
   * 获取提醒统计
   */
  async getStatistics(targetUserId?: string) {
    const where: Prisma.CollectionReminderWhereInput = {};
    if (targetUserId) where.targetUserId = targetUserId;

    const [total, unread, dueSoon, overdue] = await Promise.all([
      prisma.collectionReminder.count({ where }),
      prisma.collectionReminder.count({ where: { ...where, readStatus: 0 } }),
      prisma.collectionReminder.count({ where: { ...where, reminderType: 1, readStatus: 0 } }),
      prisma.collectionReminder.count({ where: { ...where, reminderType: 2, readStatus: 0 } }),
    ]);

    return {
      total,
      unread,
      dueSoon,
      overdue,
    };
  }
}
