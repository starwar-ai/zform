import { Router, Request, Response, NextFunction } from 'express';
import { SupplierPaymentPlanService } from '../services/supplier-payment-plan.service';
import { successResponse } from '../utils/response';
import { ensureString } from '../utils/request';

const router = Router({ mergeParams: true });
const service = new SupplierPaymentPlanService();

// GET /suppliers/:supplierId/payment-plans — 获取供应商的所有付款方案
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplierId = ensureString(req.params.supplierId);
    const plans = await service.findBySupplierId(supplierId);
    res.json(successResponse(plans));
  } catch (error) {
    next(error);
  }
});

// GET /suppliers/:supplierId/payment-plans/:id — 单个方案详情
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await service.findById(ensureString(req.params.id));
    res.json(successResponse(plan));
  } catch (error) {
    next(error);
  }
});

// POST /suppliers/:supplierId/payment-plans — 创建方案
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'system';
    const supplierId = ensureString(req.params.supplierId);
    const plan = await service.create(supplierId, req.body, userId);
    res.status(201).json(successResponse(plan, '付款方案创建成功'));
  } catch (error) {
    next(error);
  }
});

// PUT /suppliers/:supplierId/payment-plans/:id — 更新方案
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'system';
    const plan = await service.update(ensureString(req.params.id), req.body, userId);
    res.json(successResponse(plan, '付款方案更新成功'));
  } catch (error) {
    next(error);
  }
});

// DELETE /suppliers/:supplierId/payment-plans/:id — 删除方案
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.delete(ensureString(req.params.id));
    res.json(successResponse(null, '付款方案删除成功'));
  } catch (error) {
    next(error);
  }
});

// POST /suppliers/:supplierId/payment-plans/:id/set-default — 设置默认方案
router.post('/:id/set-default', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplierId = ensureString(req.params.supplierId);
    const plan = await service.setDefault(supplierId, ensureString(req.params.id));
    res.json(successResponse(plan, '已设为默认方案'));
  } catch (error) {
    next(error);
  }
});

export default router;
