import { Router } from 'express';
import { supplierController } from '../controllers/supplier.controller';
import supplierPaymentPlanRoutes from './supplier-payment-plans';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: 供应商管理
 */

/**
 * @swagger
 * /suppliers:
 *   post:
 *     summary: 创建供应商
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               nameEn:
 *                 type: string
 *     responses:
 *       201:
 *         description: 供应商创建成功
 */
router.post('/', supplierController.create);

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: 获取供应商列表
 *     tags: [Suppliers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: supplierType
 *         schema:
 *           type: string
 *           enum: [MANUFACTURER, SERVICE_PROVIDER, LOGISTICS]
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [POTENTIAL, FORMAL, RETIRED]
 *     responses:
 *       200:
 *         description: 成功获取供应商列表
 */
router.get('/', supplierController.list);

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: 获取供应商详情
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取供应商详情
 */
router.get('/:id', supplierController.getById);

/**
 * @swagger
 * /suppliers/{id}:
 *   put:
 *     summary: 更新供应商
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 供应商更新成功
 */
router.put('/:id', supplierController.update);

/**
 * @swagger
 * /suppliers/{id}:
 *   delete:
 *     summary: 删除供应商
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 供应商删除成功
 */
router.delete('/:id', supplierController.delete);

/**
 * @swagger
 * /suppliers/{id}/approve:
 *   post:
 *     summary: 审核供应商
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 审核成功
 */
router.post('/:id/approve', supplierController.approve);

/**
 * @swagger
 * /suppliers/{id}/make-formal:
 *   post:
 *     summary: 转正供应商
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 供应商转正成功
 */
router.post('/:id/make-formal', supplierController.makeFormal);

/**
 * @swagger
 * /suppliers/{id}/bank-accounts:
 *   get:
 *     summary: 获取供应商的银行账户列表
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取银行账户列表
 */
router.get('/:id/bank-accounts', supplierController.getBankAccounts);

/**
 * @swagger
 * /suppliers/{id}/bank-accounts:
 *   post:
 *     summary: 添加银行账户
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankName
 *               - accountNumber
 *             properties:
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               branchAddress:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 银行账户添加成功
 */
router.post('/:id/bank-accounts', supplierController.addBankAccount);

/**
 * @swagger
 * /suppliers/{id}/bank-accounts/{bankAccountId}:
 *   put:
 *     summary: 更新银行账户
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: bankAccountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 银行账户更新成功
 */
router.put('/:id/bank-accounts/:bankAccountId', supplierController.updateBankAccount);

/**
 * @swagger
 * /suppliers/{id}/bank-accounts/{bankAccountId}:
 *   delete:
 *     summary: 删除银行账户
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: bankAccountId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 银行账户删除成功
 */
router.delete('/:id/bank-accounts/:bankAccountId', supplierController.deleteBankAccount);

// 付款方案管理
router.use('/:supplierId/payment-plans', supplierPaymentPlanRoutes);

export default router;
