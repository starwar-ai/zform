/**
 * Order Route Routes
 *
 * 订单路径管理 API 路由。
 */

import { Router, Request, Response } from 'express';
import { OrderRouteService } from '../services/order-route.service';
import { ensureString } from '../utils/request';
import { successResponse } from '../utils/response';

const router = Router();
const orderRouteService = new OrderRouteService();

/** GET /api/parameters/order-routes - 获取所有订单路径 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const orderRoutes = await orderRouteService.findAll();
    res.json(successResponse(orderRoutes));
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : '获取订单路径列表失败' });
  }
});

/** GET /api/parameters/order-routes/:id - 获取单个订单路径 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const orderRoute = await orderRouteService.findById(ensureString(req.params.id));
    if (!orderRoute) {
      return res.status(404).json({ success: false, message: '订单路径不存在' });
    }
    res.json(successResponse(orderRoute));
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : '获取订单路径失败' });
  }
});

/** POST /api/parameters/order-routes - 创建订单路径 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const orderRoute = await orderRouteService.create(req.body, userId);
    res.status(201).json(successResponse(orderRoute, '订单路径创建成功'));
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : '创建订单路径失败' });
  }
});

/** PUT /api/parameters/order-routes/reorder - 批量更新排序 */
router.put('/reorder', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { items } = req.body;
    await orderRouteService.reorder(items, userId);
    res.json(successResponse(null, '排序更新成功'));
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : '排序更新失败' });
  }
});

/** PUT /api/parameters/order-routes/:id - 更新订单路径 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const orderRoute = await orderRouteService.update(ensureString(req.params.id), req.body, userId);
    res.json(successResponse(orderRoute, '订单路径更新成功'));
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : '更新订单路径失败' });
  }
});

/** DELETE /api/order-routes/:id - 删除订单路径 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await orderRouteService.delete(ensureString(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '删除订单路径失败' });
  }
});

export default router;
