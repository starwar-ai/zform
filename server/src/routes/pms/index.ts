import { Router } from 'express';
import skuRoutes from './sku.routes';

const router = Router();
router.use('/sku', skuRoutes);

export default router;
