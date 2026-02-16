/**
 * Payment Terms Routes
 *
 * 客户付款方式（收款方式）字典管理 API 路由。
 */

import { Router } from 'express';
import { parameterController } from '../controllers/parameter.controller';

const router = Router();

/** GET /api/parameters/payment-terms - 获取付款方式列表 */
router.get('/', parameterController.getPaymentTermList);

/** POST /api/parameters/payment-terms - 创建付款方式 */
router.post('/', parameterController.createPaymentTerm);

/** PUT /api/parameters/payment-terms/:id - 更新付款方式 */
router.put('/:id', parameterController.updatePaymentTerm);

/** DELETE /api/parameters/payment-terms/:id - 删除付款方式 */
router.delete('/:id', parameterController.deletePaymentTerm);

export default router;
