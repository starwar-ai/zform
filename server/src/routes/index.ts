import { Router } from 'express';
import productRoutes from './products';
import supplierRoutes from './suppliers';
import supplierQuotationRoutes from './supplier-quotations';
import customerRoutes from './customers';
import salesContractRoutes from './sales-contracts';
import purchasePlanRoutes from './purchase-plans';
import approvalRoutes from './approvals';

const router = Router();

router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/quotations', supplierQuotationRoutes);
router.use('/customers', customerRoutes);
router.use('/sales-contracts', salesContractRoutes);
router.use('/purchase-plans', purchasePlanRoutes);
router.use('/approvals', approvalRoutes);

export default router;
