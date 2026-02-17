/**
 * 付款工作台路由
 * 提供付款管理的工作台、报表、提醒相关接口
 */

import { Router } from 'express';
import { paymentWorkbenchController } from '../controllers/payment-workbench.controller';

const router = Router();

// ---- 工作台 ----
// GET /payment-workbench/dashboard - 工作台统计数据
router.get('/dashboard', paymentWorkbenchController.getDashboard);

// GET /payment-workbench/this-week - 本周待付款列表
router.get('/this-week', paymentWorkbenchController.getThisWeekDue);

// GET /payment-workbench/overdue - 逾期列表
router.get('/overdue', paymentWorkbenchController.getOverdueList);

// ---- 报表 ----
// GET /payment-workbench/overdue-report - 逾期报表（带汇总）
router.get('/overdue-report', paymentWorkbenchController.getOverdueReport);

// ---- 付款进度 ----
// GET /payment-workbench/progress/:id - 单个合同付款进度
router.get('/progress/:id', paymentWorkbenchController.getProgress);

// ---- 提醒管理 ----
// GET /payment-workbench/reminders - 获取用户提醒列表
router.get('/reminders', paymentWorkbenchController.getReminders);

// GET /payment-workbench/reminders/unread-count - 获取未读提醒数量
router.get('/reminders/unread-count', paymentWorkbenchController.getUnreadCount);

// GET /payment-workbench/reminders/stats - 获取提醒统计
router.get('/reminders/stats', paymentWorkbenchController.getReminderStats);

// POST /payment-workbench/reminders/:id/read - 标记单条提醒为已读
router.post('/reminders/:id/read', paymentWorkbenchController.markReminderAsRead);

// POST /payment-workbench/reminders/read-all - 标记所有提醒为已读
router.post('/reminders/read-all', paymentWorkbenchController.markAllRemindersAsRead);

// POST /payment-workbench/reminders/:id/handled - 标记提醒为已处理
router.post('/reminders/:id/handled', paymentWorkbenchController.markReminderAsHandled);

// ---- 调度器管理 ----
// POST /payment-workbench/scheduler/trigger - 手动触发提醒检查
router.post('/scheduler/trigger', paymentWorkbenchController.triggerReminderCheck);

// GET /payment-workbench/scheduler/status - 获取调度器状态
router.get('/scheduler/status', paymentWorkbenchController.getSchedulerStatus);

export default router;
