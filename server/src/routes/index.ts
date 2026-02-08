import { Router } from 'express';
import productRoutes from './products';
import supplierRoutes from './suppliers';
import supplierQuotationRoutes from './supplier-quotations';
import customerRoutes from './customers';
import salesContractRoutes from './sales-contracts';
import purchasePlanRoutes from './purchase-plans';
import approvalRoutes from './approvals';
import menuRoutes from './menus';
import roleRoutes from './roles';
import userRoutes from './users';
import departmentRoutes from './departments';
import dataPermissionRoutes from './data-permissions';
import docPermissionRoutes from './document-permissions';
import categoryRoutes from './categories';
import companyRoutes from './companies';
import countryRoutes from './countries';
import portRoutes from './ports';
import documentRoutes from '../documents/document.routes';

const router = Router();

// ---- 统一单据 API (新) ----
router.use('/documents', documentRoutes);

// ---- 系统管理 API ----
router.use('/menus', menuRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/data-permissions', dataPermissionRoutes);
router.use('/document-permissions', docPermissionRoutes);
router.use('/categories', categoryRoutes);

// ---- 业务配置 API ----
router.use('/companies', companyRoutes);
router.use('/countries', countryRoutes);
router.use('/ports', portRoutes);

// ---- 旧路由 (保留兼容) ----
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/quotations', supplierQuotationRoutes);
router.use('/customers', customerRoutes);
router.use('/sales-contracts', salesContractRoutes);
router.use('/purchase-plans', purchasePlanRoutes);
router.use('/approvals', approvalRoutes);

export default router;
