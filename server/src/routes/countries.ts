/**
 * Country Routes
 *
 * 国家管理 API 路由。
 */

import { Router, Request, Response } from 'express';
import { CountryService } from '../services/country.service';

const router = Router();
const countryService = new CountryService();

/** GET /api/countries - 获取所有国家 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const countries = await countryService.findAll();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取国家列表失败' });
  }
});

/** GET /api/countries/:id - 获取单个国家 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const country = await countryService.findById(req.params.id);
    if (!country) {
      return res.status(404).json({ error: '国家不存在' });
    }
    res.json(country);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取国家失败' });
  }
});

/** POST /api/countries - 创建国家 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const country = await countryService.create(req.body, userId);
    res.status(201).json(country);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '创建国家失败' });
  }
});

/** PUT /api/countries/:id - 更新国家 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const country = await countryService.update(req.params.id, req.body, userId);
    res.json(country);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新国家失败' });
  }
});

/** DELETE /api/countries/:id - 删除国家 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await countryService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '删除国家失败' });
  }
});

export default router;
