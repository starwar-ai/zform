/**
 * 付款提醒调度器服务
 * 定时检查付款计划，生成到期提醒和逾期提醒
 */

import * as schedule from 'node-schedule';
import prisma from '../config/database';
import { PurchasePaymentPlanService } from './purchase-payment-plan.service';
import { PaymentReminderService, PaymentReminderCreateInput } from './payment-reminder.service';

/**
 * 调度器状态接口
 */
interface SchedulerStatus {
  running: boolean;
  jobs: Array<{
    name: string;
    nextInvocation: Date | null;
  }>;
  lastRunTime: Date | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunMessage: string | null;
  stats: {
    dueSoonReminders: number;
    overdueReminders: number;
    plansUpdated: number;
  } | null;
}

// 提前多少天发送即将到期提醒
const DUE_SOON_DAYS = 3;

// 默认执行时间
const DEFAULT_SCHEDULE_TIMES = ['09:00', '14:00'];

export class PaymentReminderSchedulerService {
  private jobs: Map<string, schedule.Job> = new Map();
  private lastRunTime: Date | null = null;
  private lastRunStatus: 'success' | 'error' | null = null;
  private lastRunMessage: string | null = null;
  private lastStats: SchedulerStatus['stats'] = null;

  private paymentPlanService = new PurchasePaymentPlanService();
  private reminderService = new PaymentReminderService();

  /**
   * 解析时间字符串为 cron 表达式
   */
  private timeToCron(timeStr: string): string {
    const parts = timeStr.split(':');
    if (parts.length !== 2) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }

    return `${minute} ${hour} * * *`;
  }

  /**
   * 验证时间格式
   */
  private isValidTimeFormat(timeStr: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return regex.test(timeStr);
  }

  /**
   * 停止所有定时任务
   */
  private stopAllJobs(): void {
    for (const [name, job] of this.jobs) {
      job.cancel();
      console.log(`[PaymentReminderScheduler] Cancelled job: ${name}`);
    }
    this.jobs.clear();
  }

  /**
   * 创建单个定时任务
   */
  private createJob(timeStr: string): void {
    if (!this.isValidTimeFormat(timeStr)) {
      console.error(`[PaymentReminderScheduler] Invalid time format: ${timeStr}`);
      return;
    }

    const cronExpression = this.timeToCron(timeStr);
    const jobName = `payment-reminder-${timeStr.replace(':', '-')}`;

    const job = schedule.scheduleJob(jobName, cronExpression, async () => {
      await this.executeCheck(timeStr);
    });

    if (job) {
      this.jobs.set(jobName, job);
      console.log(`[PaymentReminderScheduler] Scheduled job: ${jobName} with cron: ${cronExpression}`);
    } else {
      console.error(`[PaymentReminderScheduler] Failed to schedule job: ${jobName}`);
    }
  }

  /**
   * 执行检查 - 主逻辑
   */
  async executeCheck(source: string = 'manual'): Promise<{
    dueSoonReminders: number;
    overdueReminders: number;
    plansUpdated: number;
  }> {
    console.log(`[PaymentReminderScheduler] Executing check at ${source}`);
    this.lastRunTime = new Date();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 即将到期的截止日期（提前3天）
    const dueSoonDate = new Date(today);
    dueSoonDate.setDate(dueSoonDate.getDate() + DUE_SOON_DAYS);

    let dueSoonReminders = 0;
    let overdueReminders = 0;
    let plansUpdated = 0;

    try {
      // 1. 更新所有付款计划的逾期状态
      const updateResult = await this.paymentPlanService.updateOverdueStatus();
      plansUpdated = updateResult.updated;

      // 2. 获取所有未完成的付款计划
      const pendingPlans = await prisma.purchasePaymentPlan.findMany({
        where: {
          deletedAt: null,
          exeStatus: { lt: 2 },
          expectedPaymentDate: { not: null },
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

      const remindersToCreate: PaymentReminderCreateInput[] = [];

      for (const plan of pendingPlans) {
        if (!plan.expectedPaymentDate) continue;

        const expectedDate = new Date(plan.expectedPaymentDate);
        expectedDate.setHours(0, 0, 0, 0);

        const payable = Number(plan.periodPayable);
        const paid = Number(plan.periodPaid);
        const remaining = payable - paid;

        // 跳过已付齐的
        if (remaining <= 0) continue;

        // 计算逾期天数
        const diffMs = today.getTime() - expectedDate.getTime();
        const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (overdueDays > 0) {
          // 已逾期 - 生成逾期提醒
          const hasReminder = await this.reminderService.hasTodayReminder(plan.id, 2);
          if (!hasReminder) {
            remindersToCreate.push({
              paymentPlanId: plan.id,
              purchaseContractId: plan.purchaseContractId,
              purchaseContractCode: plan.purchaseContract?.code,
              supplierId: plan.purchaseContract?.supplierId ?? undefined,
              supplierCode: plan.purchaseContract?.supplierCode ?? undefined,
              supplierName: plan.purchaseContract?.supplierName ?? undefined,
              reminderType: 2, // 已逾期
              reminderDate: today,
              expectedDate,
              payableAmt: remaining,
              paidAmt: paid,
              overdueDays,
              periodIndex: plan.periodIndex,
              targetUserId: plan.purchaseContract?.buyerCode ?? undefined,
            });
            overdueReminders++;
          }
        } else if (expectedDate <= dueSoonDate && expectedDate >= today) {
          // 即将到期 - 生成到期提醒
          const hasReminder = await this.reminderService.hasTodayReminder(plan.id, 1);
          if (!hasReminder) {
            remindersToCreate.push({
              paymentPlanId: plan.id,
              purchaseContractId: plan.purchaseContractId,
              purchaseContractCode: plan.purchaseContract?.code,
              supplierId: plan.purchaseContract?.supplierId ?? undefined,
              supplierCode: plan.purchaseContract?.supplierCode ?? undefined,
              supplierName: plan.purchaseContract?.supplierName ?? undefined,
              reminderType: 1, // 即将到期
              reminderDate: today,
              expectedDate,
              payableAmt: remaining,
              paidAmt: paid,
              overdueDays: 0,
              periodIndex: plan.periodIndex,
              targetUserId: plan.purchaseContract?.buyerCode ?? undefined,
            });
            dueSoonReminders++;
          }
        }

        // 更新提醒状态
        if (plan.reminderStatus === 0 && (dueSoonReminders > 0 || overdueReminders > 0)) {
          await prisma.purchasePaymentPlan.update({
            where: { id: plan.id },
            data: {
              reminderStatus: 1,
              lastReminderAt: today,
              reminderCount: { increment: 1 },
            },
          });
        }
      }

      // 3. 批量创建提醒
      if (remindersToCreate.length > 0) {
        await this.reminderService.createMany(remindersToCreate);
      }

      this.lastRunStatus = 'success';
      this.lastRunMessage = `即将到期: ${dueSoonReminders}, 已逾期: ${overdueReminders}, 更新计划: ${plansUpdated}`;
      this.lastStats = { dueSoonReminders, overdueReminders, plansUpdated };

      console.log(`[PaymentReminderScheduler] Check completed. ${this.lastRunMessage}`);

      return { dueSoonReminders, overdueReminders, plansUpdated };
    } catch (error) {
      this.lastRunStatus = 'error';
      this.lastRunMessage = error instanceof Error ? error.message : 'Unknown error';
      this.lastStats = null;
      console.error('[PaymentReminderScheduler] Check failed:', error);
      throw error;
    }
  }

  /**
   * 手动触发检查
   */
  async triggerCheck(): Promise<{
    success: boolean;
    message: string;
    stats?: SchedulerStatus['stats'];
  }> {
    console.log('[PaymentReminderScheduler] Manual check triggered');

    try {
      const stats = await this.executeCheck('manual');

      return {
        success: true,
        message: `检查完成。即将到期提醒: ${stats.dueSoonReminders}, 逾期提醒: ${stats.overdueReminders}, 更新计划: ${stats.plansUpdated}`,
        stats,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 启动调度器
   */
  async start(): Promise<void> {
    console.log('[PaymentReminderScheduler] Starting scheduler...');

    // 停止现有任务
    this.stopAllJobs();

    // 创建定时任务
    for (const timeStr of DEFAULT_SCHEDULE_TIMES) {
      this.createJob(timeStr);
    }

    console.log(`[PaymentReminderScheduler] Started ${this.jobs.size} scheduled jobs`);
  }

  /**
   * 停止调度器
   */
  async stop(): Promise<void> {
    console.log('[PaymentReminderScheduler] Stopping scheduler...');
    this.stopAllJobs();
    console.log('[PaymentReminderScheduler] Scheduler stopped');
  }

  /**
   * 获取调度器状态
   */
  getStatus(): SchedulerStatus {
    const jobs = Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      nextInvocation: job.nextInvocation() as Date | null,
    }));

    return {
      running: this.jobs.size > 0,
      jobs,
      lastRunTime: this.lastRunTime,
      lastRunStatus: this.lastRunStatus,
      lastRunMessage: this.lastRunMessage,
      stats: this.lastStats,
    };
  }
}

// 导出单例实例
export const paymentReminderSchedulerService = new PaymentReminderSchedulerService();
