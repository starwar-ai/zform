/**
 * 收款工作台控制器
 * 提供收款管理的工作台、报表、提醒相关接口
 */

import { Request, Response, NextFunction } from 'express';
import { CollectionPlanService } from '../services/collection-plan.service';
import { CollectionReminderService } from '../services/collection-reminder.service';
import { collectionReminderSchedulerService } from '../services/collection-reminder-scheduler.service';
import { successResponse, paginatedResponse } from '../utils/response';

const collectionPlanService = new CollectionPlanService();
const reminderService = new CollectionReminderService();

export const collectionWorkbenchController = {
  /**
   * 获取工作台统计数据
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await collectionPlanService.getWorkbenchData();
      res.json(successResponse(data));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取本周待收款列表
   */
  async getThisWeekDue(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await collectionPlanService.getThisWeekDueList({ page, pageSize });
      res.json(paginatedResponse(result.plans, result.total, result.page, result.pageSize));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取逾期列表
   */
  async getOverdueList(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const customerId = req.query.customerId as string | undefined;
      const salesmanId = req.query.salesmanId as string | undefined;
      const minOverdueDays = req.query.minOverdueDays
        ? parseInt(req.query.minOverdueDays as string)
        : undefined;
      const maxOverdueDays = req.query.maxOverdueDays
        ? parseInt(req.query.maxOverdueDays as string)
        : undefined;

      const result = await collectionPlanService.getOverdueList({
        page,
        pageSize,
        customerId,
        salesmanId,
        minOverdueDays,
        maxOverdueDays,
      });
      res.json(paginatedResponse(result.plans, result.total, result.page, result.pageSize));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取逾期报表
   */
  async getOverdueReport(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const customerId = req.query.customerId as string | undefined;
      const salesmanId = req.query.salesmanId as string | undefined;
      const minOverdueDays = req.query.minOverdueDays
        ? parseInt(req.query.minOverdueDays as string)
        : undefined;
      const maxOverdueDays = req.query.maxOverdueDays
        ? parseInt(req.query.maxOverdueDays as string)
        : undefined;

      const result = await collectionPlanService.getOverdueReport({
        page,
        pageSize,
        customerId,
        salesmanId,
        minOverdueDays,
        maxOverdueDays,
      });

      res.json(
        successResponse({
          ...paginatedResponse(result.plans, result.total, result.page, result.pageSize),
          summary: result.summary,
        })
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取单个合同的收款进度
   */
  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const salesContractId = req.params.id;
      const data = await collectionPlanService.getProgressBoard(salesContractId);
      res.json(successResponse(data));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取用户提醒列表
   */
  async getReminders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const targetUserId = (req.headers['x-user-id'] as string) || undefined;
      const reminderType = req.query.reminderType
        ? parseInt(req.query.reminderType as string)
        : undefined;
      const readStatus = req.query.readStatus
        ? parseInt(req.query.readStatus as string)
        : undefined;

      const result = await reminderService.getUserReminders({
        page,
        pageSize,
        targetUserId,
        reminderType,
        readStatus,
      });

      res.json(paginatedResponse(result.reminders, result.total, result.page, result.pageSize));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取未读提醒数量
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUserId = (req.headers['x-user-id'] as string) || undefined;
      const count = await reminderService.getUnreadCount(targetUserId);
      res.json(successResponse({ count }));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取提醒统计
   */
  async getReminderStats(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUserId = (req.headers['x-user-id'] as string) || undefined;
      const stats = await reminderService.getStatistics(targetUserId);
      res.json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 标记提醒为已读
   */
  async markReminderAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await reminderService.markAsRead(id);
      res.json(successResponse(null, '已标记为已读'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 标记所有提醒为已读
   */
  async markAllRemindersAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.headers['x-user-id'] as string;
      if (!targetUserId) {
        return res.status(400).json({ success: false, message: '缺少用户ID' });
      }
      const result = await reminderService.markAllAsRead(targetUserId);
      res.json(successResponse({ updated: result.count }, '已全部标记为已读'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 标记提醒为已处理
   */
  async markReminderAsHandled(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await reminderService.markAsHandled(id);
      res.json(successResponse(null, '已标记为已处理'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 手动触发提醒检查
   */
  async triggerReminderCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await collectionReminderSchedulerService.triggerCheck();
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取调度器状态
   */
  async getSchedulerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = collectionReminderSchedulerService.getStatus();
      res.json(successResponse(status));
    } catch (error) {
      next(error);
    }
  },
};
