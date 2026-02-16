/**
 * Brand Routes
 *
 * 品牌管理 API 路由。
 */

import { Router, Request, Response } from 'express';
import { BrandService } from '../services/brand.service';
import { ensureString } from '../utils/request';

const router = Router();
const brandService = new BrandService();

/** GET /api/brands - 获取所有品牌 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const brands = await brandService.findAll();
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取品牌列表失败' });
  }
});

/** GET /api/brands/:id - 获取单个品牌 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const brand = await brandService.findById(ensureString(req.params.id));
    if (!brand) {
      return res.status(404).json({ error: '品牌不存在' });
    }
    res.json(brand);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取品牌失败' });
  }
});

/** POST /api/brands - 创建品牌 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const brand = await brandService.create(req.body, userId);
    res.status(201).json(brand);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '创建品牌失败' });
  }
});

/** PUT /api/brands/:id - 更新品牌 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const brand = await brandService.update(ensureString(req.params.id), req.body, userId);
    res.json(brand);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新品牌失败' });
  }
});

/** DELETE /api/brands/:id - 删除品牌 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await brandService.delete(ensureString(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '删除品牌失败' });
  }
});

export default router;
