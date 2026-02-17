/**
 * Supplier Payment Terms Routes
 *
 * 供应商付款条件字典管理 API 路由。
 */

import { Router } from 'express';
import { parameterController } from '../controllers/parameter.controller';

const router = Router();

/** GET /api/parameters/supplier-payment-terms - 获取供应商付款条件列表 */
router.get('/', parameterController.getSupplierPaymentTermList);

/** PUT /api/parameters/supplier-payment-terms/reorder - 批量更新排序 */
router.put('/reorder', parameterController.reorderSupplierPaymentTerms);

/** POST /api/parameters/supplier-payment-terms - 创建供应商付款条件 */
router.post('/', parameterController.createSupplierPaymentTerm);

/** PUT /api/parameters/supplier-payment-terms/:id - 更新供应商付款条件 */
router.put('/:id', parameterController.updateSupplierPaymentTerm);

/** DELETE /api/parameters/supplier-payment-terms/:id - 删除供应商付款条件 */
router.delete('/:id', parameterController.deleteSupplierPaymentTerm);

export default router;
