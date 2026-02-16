/**
 * Parameters Routes
 *
 * 统一业务属性配置 API 路由。
 * 各分类类型的路由按子路径分组：
 *   /parameters/customer   - 客户分类
 *   /parameters/product    - 产品分类（海关编码）
 *   /parameters/exhibition - 展会分类
 *   /parameters/customer-source - 客户来源
 */

import { Router } from 'express';
import { parameterController} from '../controllers/parameter.controller';

const router = Router();

// ---- 客户分类（树形）----
router.get('/customer', parameterController.getCustomerTree);
router.post('/customer', parameterController.createCustomer);
router.put('/customer/reorder', parameterController.reorderCustomer);
router.put('/customer/:id', parameterController.updateCustomer);
router.delete('/customer/:id', parameterController.deleteCustomer);

// ---- 产品分类（树形，用于产品表单 categoryId）----
router.get('/product-category', parameterController.getProductCategoryTree);

// ---- 海关编码（扁平列表）----
router.get('/product', parameterController.getProductTree);
router.post('/product', parameterController.createProduct);
router.put('/product/reorder', parameterController.reorderProduct);
router.put('/product/:id', parameterController.updateProduct);
router.delete('/product/:id', parameterController.deleteProduct);

// ---- 展会分类（扁平列表）----
router.get('/exhibition', parameterController.getExhibitionList);
router.post('/exhibition', parameterController.createExhibition);
router.put('/exhibition/reorder', parameterController.reorderExhibition);
router.put('/exhibition/:id', parameterController.updateExhibition);
router.delete('/exhibition/:id', parameterController.deleteExhibition);

// ---- 客户来源（扁平列表）----
router.get('/customer-source', parameterController.getCustomerSourceList);
router.post('/customer-source', parameterController.createCustomerSource);
router.put('/customer-source/reorder', parameterController.reorderCustomerSource);
router.put('/customer-source/:id', parameterController.updateCustomerSource);
router.delete('/customer-source/:id', parameterController.deleteCustomerSource);

export default router;