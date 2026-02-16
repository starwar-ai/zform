/**
 * Inventory Routes
 *
 * 库存查询 API 路由。
 */

import { Router, Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { ensureString } from '../utils/request';

const router = Router();
const inventoryService = new InventoryService();

/** GET /api/inventory - 分页查询库存列表 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
      search: req.query.search as string | undefined,
      warehouseId: req.query.warehouseId as string | undefined,
      skuCode: req.query.skuCode as string | undefined,
      skuId: req.query.skuId as string | undefined,
      supplierId: req.query.supplierId as string | undefined,
      customerId: req.query.customerId as string | undefined,
      batchNumber: req.query.batchNumber as string | undefined,
    };

    const result = await inventoryService.findAll(params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '查询库存列表失败' });
  }
});

/** GET /api/inventory/summary - 库存汇总统计 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const params = {
      warehouseId: req.query.warehouseId as string | undefined,
      skuId: req.query.skuId as string | undefined,
      supplierId: req.query.supplierId as string | undefined,
      customerId: req.query.customerId as string | undefined,
    };

    const summary = await inventoryService.getSummary(params);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取库存汇总失败' });
  }
});

/** GET /api/inventory/:id - 获取单条库存明细 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.findById(ensureString(req.params.id));
    if (!inventory) {
      return res.status(404).json({ error: '库存明细不存在' });
    }
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取库存明细失败' });
  }
});

export default router;
