/**
 * Region Routes
 *
 * 区域管理 API 路由。
 */

import { Router, Request, Response } from 'express';
import { RegionService } from '../services/region.service';
import { ensureString } from '../utils/request';

const router = Router();
const regionService = new RegionService();

/** GET /api/regions - 获取所有区域 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const regions = await regionService.findAll();
    res.json(regions);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取区域列表失败' });
  }
});

/** GET /api/regions/:id - 获取单个区域 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const region = await regionService.findById(ensureString(req.params.id));
    if (!region) {
      return res.status(404).json({ error: '区域不存在' });
    }
    res.json(region);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取区域失败' });
  }
});

/** POST /api/regions - 创建区域 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const region = await regionService.create(req.body, userId);
    res.status(201).json(region);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '创建区域失败' });
  }
});

/** PUT /api/regions/:id - 更新区域 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const region = await regionService.update(ensureString(req.params.id), req.body, userId);
    res.json(region);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新区域失败' });
  }
});

/** DELETE /api/regions/:id - 删除区域 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await regionService.delete(ensureString(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '删除区域失败' });
  }
});

export default router;
