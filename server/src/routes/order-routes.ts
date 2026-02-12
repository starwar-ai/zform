/**
 * Order Route Routes
 *
 * 订单路径管理 API 路由。
 */

import { Router, Request, Response } from 'express';
import { OrderRouteService } from '../services/order-route.service';

const router = Router();
const orderRouteService = new OrderRouteService();

/** GET /api/order-routes - 获取所有订单路径 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const orderRoutes = await orderRouteService.findAll();
    res.json(orderRoutes);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取订单路径列表失败' });
  }
});

/** GET /api/order-routes/:id - 获取单个订单路径 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const orderRoute = await orderRouteService.findById(req.params.id);
    if (!orderRoute) {
      return res.status(404).json({ error: '订单路径不存在' });
    }
    res.json(orderRoute);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取订单路径失败' });
  }
});

/** POST /api/order-routes - 创建订单路径 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const orderRoute = await orderRouteService.create(req.body, userId);
    res.status(201).json(orderRoute);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '创建订单路径失败' });
  }
});

/** PUT /api/order-routes/:id - 更新订单路径 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const orderRoute = await orderRouteService.update(req.params.id, req.body, userId);
    res.json(orderRoute);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新订单路径失败' });
  }
});

/** DELETE /api/order-routes/:id - 删除订单路径 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await orderRouteService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '删除订单路径失败' });
  }
});

export default router;
