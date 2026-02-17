import { Router, Request, Response, NextFunction } from 'express';
import { CustomerPaymentPlanService } from '../services/customer-payment-plan.service';
import { successResponse } from '../utils/response';
import { ensureString } from '../utils/request';

const router = Router({ mergeParams: true });
const service = new CustomerPaymentPlanService();

// GET /customers/:customerId/payment-plans — 获取客户的所有付款方案
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = ensureString(req.params.customerId);
    const plans = await service.findByCustomerId(customerId);
    res.json(successResponse(plans));
  } catch (error) {
    next(error);
  }
});

// GET /customers/:customerId/payment-plans/:id — 单个方案详情
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await service.findById(ensureString(req.params.id));
    res.json(successResponse(plan));
  } catch (error) {
    next(error);
  }
});

// POST /customers/:customerId/payment-plans — 创建方案
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'system';
    const customerId = ensureString(req.params.customerId);
    const plan = await service.create(customerId, req.body, userId);
    res.status(201).json(successResponse(plan, '付款方案创建成功'));
  } catch (error) {
    next(error);
  }
});

// PUT /customers/:customerId/payment-plans/:id — 更新方案
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'system';
    const plan = await service.update(ensureString(req.params.id), req.body, userId);
    res.json(successResponse(plan, '付款方案更新成功'));
  } catch (error) {
    next(error);
  }
});

// DELETE /customers/:customerId/payment-plans/:id — 删除方案
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.delete(ensureString(req.params.id));
    res.json(successResponse(null, '付款方案删除成功'));
  } catch (error) {
    next(error);
  }
});

// POST /customers/:customerId/payment-plans/:id/set-default — 设置默认方案
router.post('/:id/set-default', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = ensureString(req.params.customerId);
    const plan = await service.setDefault(customerId, ensureString(req.params.id));
    res.json(successResponse(plan, '已设为默认方案'));
  } catch (error) {
    next(error);
  }
});

export default router;
