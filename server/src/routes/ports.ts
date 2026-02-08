/**
 * Port Routes
 *
 * 港口管理 API 路由。
 */

import { Router, Request, Response } from 'express';
import { PortService } from '../services/port.service';

const router = Router();
const portService = new PortService();

/** GET /api/ports - 获取所有港口 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const ports = await portService.findAll();
    res.json(ports);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取港口列表失败' });
  }
});

/** GET /api/ports/:id - 获取单个港口 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const port = await portService.findById(req.params.id);
    if (!port) {
      return res.status(404).json({ error: '港口不存在' });
    }
    res.json(port);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取港口失败' });
  }
});

/** POST /api/ports - 创建港口 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const port = await portService.create(req.body, userId);
    res.status(201).json(port);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '创建港口失败' });
  }
});

/** PUT /api/ports/:id - 更新港口 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const port = await portService.update(req.params.id, req.body, userId);
    res.json(port);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新港口失败' });
  }
});

/** DELETE /api/ports/:id - 删除港口 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await portService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '删除港口失败' });
  }
});

export default router;
