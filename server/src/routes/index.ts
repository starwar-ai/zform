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
import regionRoutes from './regions';
import countryRoutes from './countries';
import portRoutes from './ports';
import brandRoutes from './brands';
import warehouseRoutes from './warehouses';
import inventoryRoutes from './inventory';
import orderRouteRoutes from './order-routes';
import otherConfigRoutes from './other-configs';
import documentRoutes from '../documents/document.routes';
import productImageRoutes from './product-images';
import employeeRoutes from './employees';
import codeGeneratorRoutes from './code-generator.routes';
import pmsRoutes from './pms';
import exchangeRateRoutes from './exchange-rate.routes';
import rateSchedulerRoutes from './rate-scheduler.routes';
import transportMethodRoutes from './transport-methods';

const router = Router();

// ---- 统一单据 API (新) ----
router.use('/documents', documentRoutes);

// ---- 产品图片 API ----
router.use('/product-images', productImageRoutes);

// ---- 编码生成 API ----
router.use('/code-generator', codeGeneratorRoutes);

// ---- PMS 产品管理 API ----
router.use('/pms', pmsRoutes);

// ---- 汇率管理 API ----
router.use('/rates', exchangeRateRoutes);

// ---- 汇率调度器 API ----
router.use('/rate-scheduler', rateSchedulerRoutes);

// ---- 系统管理 API ----
router.use('/menus', menuRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/data-permissions', dataPermissionRoutes);
router.use('/document-permissions', docPermissionRoutes);
router.use('/categories', categoryRoutes);

// ---- 业务实体管理 API ----
router.use('/companies', companyRoutes);
router.use('/regions', regionRoutes);
router.use('/countries', countryRoutes);
router.use('/ports', portRoutes);
router.use('/brands', brandRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/order-routes', orderRouteRoutes);
router.use('/other-configs', otherConfigRoutes);
router.use('/transport-methods', transportMethodRoutes);

// ---- 旧路由 (保留兼容) ----
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/supplier-quotations', supplierQuotationRoutes);
router.use('/customers', customerRoutes);
router.use('/sales-contracts', salesContractRoutes);
router.use('/purchase-plans', purchasePlanRoutes);
router.use('/approvals', approvalRoutes);

export default router;
