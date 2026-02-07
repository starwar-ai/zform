import { Router } from 'express';
import productRoutes from './products';
import supplierRoutes from './suppliers';
import supplierQuotationRoutes from './supplier-quotations';
import customerRoutes from './customers';

const router = Router();

router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/quotations', supplierQuotationRoutes);
router.use('/customers', customerRoutes);

export default router;
