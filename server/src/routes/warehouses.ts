/**
 * Warehouse Routes
 *
 * 仓库管理 API 路由。
 */

import { Router, Request, Response } from 'express';
import { WarehouseService } from '../services/warehouse.service';
import { ensureString } from '../utils/request';

const router = Router();
const warehouseService = new WarehouseService();

/** GET /api/warehouses - 获取所有仓库 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const warehouses = await warehouseService.findAll();
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取仓库列表失败' });
  }
});

/** GET /api/warehouses/:id - 获取单个仓库 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const warehouse = await warehouseService.findById(ensureString(req.params.id));
    if (!warehouse) {
      return res.status(404).json({ error: '仓库不存在' });
    }
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取仓库失败' });
  }
});

/** POST /api/warehouses - 创建仓库 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const warehouse = await warehouseService.create(req.body, userId);
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '创建仓库失败' });
  }
});

/** PUT /api/warehouses/:id - 更新仓库 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const warehouse = await warehouseService.update(ensureString(req.params.id), req.body, userId);
    res.json(warehouse);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新仓库失败' });
  }
});

/** DELETE /api/warehouses/:id - 删除仓库 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await warehouseService.delete(ensureString(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '删除仓库失败' });
  }
});

export default router;
