/**
 * 收款工作台路由
 * 提供收款管理的工作台、报表、提醒相关接口
 */

import { Router } from 'express';
import { collectionWorkbenchController } from '../controllers/collection-workbench.controller';

const router = Router();

// ---- 工作台 ----
// GET /collection-workbench/dashboard - 工作台统计数据
router.get('/dashboard', collectionWorkbenchController.getDashboard);

// GET /collection-workbench/this-week - 本周待收款列表
router.get('/this-week', collectionWorkbenchController.getThisWeekDue);

// GET /collection-workbench/overdue - 逾期列表
router.get('/overdue', collectionWorkbenchController.getOverdueList);

// ---- 报表 ----
// GET /collection-workbench/overdue-report - 逾期报表（带汇总）
router.get('/overdue-report', collectionWorkbenchController.getOverdueReport);

// ---- 收款进度 ----
// GET /collection-workbench/progress/:id - 单个合同收款进度
router.get('/progress/:id', collectionWorkbenchController.getProgress);

// ---- 提醒管理 ----
// GET /collection-workbench/reminders - 获取用户提醒列表
router.get('/reminders', collectionWorkbenchController.getReminders);

// GET /collection-workbench/reminders/unread-count - 获取未读提醒数量
router.get('/reminders/unread-count', collectionWorkbenchController.getUnreadCount);

// GET /collection-workbench/reminders/stats - 获取提醒统计
router.get('/reminders/stats', collectionWorkbenchController.getReminderStats);

// POST /collection-workbench/reminders/:id/read - 标记单条提醒为已读
router.post('/reminders/:id/read', collectionWorkbenchController.markReminderAsRead);

// POST /collection-workbench/reminders/read-all - 标记所有提醒为已读
router.post('/reminders/read-all', collectionWorkbenchController.markAllRemindersAsRead);

// POST /collection-workbench/reminders/:id/handled - 标记提醒为已处理
router.post('/reminders/:id/handled', collectionWorkbenchController.markReminderAsHandled);

// ---- 调度器管理 ----
// POST /collection-workbench/scheduler/trigger - 手动触发提醒检查
router.post('/scheduler/trigger', collectionWorkbenchController.triggerReminderCheck);

// GET /collection-workbench/scheduler/status - 获取调度器状态
router.get('/scheduler/status', collectionWorkbenchController.getSchedulerStatus);

export default router;
