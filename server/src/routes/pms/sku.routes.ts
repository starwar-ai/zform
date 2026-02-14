/**
 * SKU / 产品编号 API
 *
 * GET /pms/sku/generate-code?categoryId=xxx
 */

import { Router, Request } from 'express';
import { skuService } from '../../services/sku.service';
import { successResponse } from '../../utils/response';

const router = Router();

router.get('/generate-code', async (req: Request, res, next) => {
  try {
    const categoryId = String(req.query.categoryId || '').trim();
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: '缺少 categoryId 参数',
        data: null,
      });
    }

    const result = await skuService.generateCode(categoryId);
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
});

export default router;
