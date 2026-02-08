/**
 * Category Routes
 *
 * 统一分类管理 API 路由。
 * 各分类类型的路由按子路径分组：
 *   /categories/customer   - 客户分类
 *   /categories/product    - 产品分类（海关编码）
 *   /categories/exhibition - 展会分类
 */

import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';

const router = Router();

// ---- 客户分类（树形）----
router.get('/customer', categoryController.getCustomerTree);
router.post('/customer', categoryController.createCustomer);
router.put('/customer/:id', categoryController.updateCustomer);
router.delete('/customer/:id', categoryController.deleteCustomer);

// ---- 产品分类 / 海关编码（树形）----
router.get('/product', categoryController.getProductTree);
router.post('/product', categoryController.createProduct);
router.put('/product/:id', categoryController.updateProduct);
router.delete('/product/:id', categoryController.deleteProduct);

// ---- 展会分类（扁平列表）----
router.get('/exhibition', categoryController.getExhibitionList);
router.post('/exhibition', categoryController.createExhibition);
router.put('/exhibition/:id', categoryController.updateExhibition);
router.delete('/exhibition/:id', categoryController.deleteExhibition);

export default router;
