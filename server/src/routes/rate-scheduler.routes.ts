import { Router, Request, Response } from 'express';
import { exchangeRateSchedulerService } from '../services/exchange-rate-scheduler.service';

const router = Router();

/**
 * @swagger
 * /rate-scheduler/status:
 *   get:
 *     summary: 获取调度器状态
 *     tags: [Rate Scheduler]
 *     responses:
 *       200:
 *         description: 调度器状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 running:
 *                   type: boolean
 *                   description: 调度器是否正在运行
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       nextInvocation:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                 lastRunTime:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 lastRunStatus:
 *                   type: string
 *                   enum: [success, error, null]
 *                   nullable: true
 *                 lastRunMessage:
 *                   type: string
 *                   nullable: true
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = exchangeRateSchedulerService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Get scheduler status error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rate-scheduler/reload:
 *   post:
 *     summary: 重新加载配置并重启调度
 *     tags: [Rate Scheduler]
 *     responses:
 *       200:
 *         description: 重载成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/reload', async (req: Request, res: Response) => {
  try {
    await exchangeRateSchedulerService.loadConfigAndSchedule();
    res.json({
      success: true,
      message: '配置已重新加载，调度器已重启',
    });
  } catch (error) {
    console.error('Reload scheduler error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rate-scheduler/trigger:
 *   post:
 *     summary: 手动触发汇率抓取
 *     tags: [Rate Scheduler]
 *     responses:
 *       200:
 *         description: 抓取结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       currency:
 *                         type: string
 *                       rate:
 *                         type: number
 *                         nullable: true
 */
router.post('/trigger', async (req: Request, res: Response) => {
  try {
    const result = await exchangeRateSchedulerService.triggerFetch();
    res.json(result);
  } catch (error) {
    console.error('Trigger fetch error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rate-scheduler/start:
 *   post:
 *     summary: 启动调度器
 *     tags: [Rate Scheduler]
 *     responses:
 *       200:
 *         description: 启动成功
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    await exchangeRateSchedulerService.start();
    res.json({
      success: true,
      message: '调度器已启动',
    });
  } catch (error) {
    console.error('Start scheduler error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rate-scheduler/stop:
 *   post:
 *     summary: 停止调度器
 *     tags: [Rate Scheduler]
 *     responses:
 *       200:
 *         description: 停止成功
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    await exchangeRateSchedulerService.stop();
    res.json({
      success: true,
      message: '调度器已停止',
    });
  } catch (error) {
    console.error('Stop scheduler error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
