import { Router } from 'express';
import { supplierQuotationController } from '../controllers/supplier-quotation.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: SupplierQuotations
 *   description: 供应商报价管理
 */

/**
 * @swagger
 * /quotations:
 *   post:
 *     summary: 创建供应商报价
 *     tags: [SupplierQuotations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *               - productName
 *               - quotationNo
 *               - quotationDate
 *               - validFrom
 *               - validTo
 *               - unitPrice
 *             properties:
 *               supplierId:
 *                 type: string
 *               productName:
 *                 type: string
 *               quotationNo:
 *                 type: string
 *               quotationDate:
 *                 type: string
 *                 format: date
 *               validFrom:
 *                 type: string
 *                 format: date
 *               validTo:
 *                 type: string
 *                 format: date
 *               unitPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: 报价创建成功
 */
router.post('/', supplierQuotationController.create);

/**
 * @swagger
 * /quotations:
 *   get:
 *     summary: 获取供应商报价列表
 *     tags: [SupplierQuotations]
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
 *         name: supplierId
 *         schema:
 *           type: string
 *       - in: query
 *         name: productCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: 成功获取报价列表
 */
router.get('/', supplierQuotationController.list);

/**
 * @swagger
 * /quotations/valid:
 *   get:
 *     summary: 获取有效报价（在有效期内且已审核）
 *     tags: [SupplierQuotations]
 *     parameters:
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
 *       - in: query
 *         name: productCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: asOfDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: 成功获取有效报价
 */
router.get('/valid', supplierQuotationController.getValidQuotations);

/**
 * @swagger
 * /quotations/compare/{productCode}:
 *   get:
 *     summary: 比价 - 获取同一产品的所有有效报价（按价格排序）
 *     tags: [SupplierQuotations]
 *     parameters:
 *       - in: path
 *         name: productCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: asOfDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: 成功获取比价结果
 */
router.get('/compare/:productCode', supplierQuotationController.compareQuotations);

/**
 * @swagger
 * /quotations/by-quotation-no/{quotationNo}:
 *   get:
 *     summary: 根据报价单号查询
 *     tags: [SupplierQuotations]
 *     parameters:
 *       - in: path
 *         name: quotationNo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取报价详情
 */
router.get('/by-quotation-no/:quotationNo', supplierQuotationController.getByQuotationNo);

/**
 * @swagger
 * /quotations/by-supplier/{supplierId}:
 *   get:
 *     summary: 获取供应商的所有报价
 *     tags: [SupplierQuotations]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取供应商报价列表
 */
router.get('/by-supplier/:supplierId', supplierQuotationController.getBySupplier);

/**
 * @swagger
 * /quotations/{id}:
 *   get:
 *     summary: 获取报价详情
 *     tags: [SupplierQuotations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取报价详情
 */
router.get('/:id', supplierQuotationController.getById);

/**
 * @swagger
 * /quotations/{id}:
 *   put:
 *     summary: 更新报价
 *     tags: [SupplierQuotations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 报价更新成功
 */
router.put('/:id', supplierQuotationController.update);

/**
 * @swagger
 * /quotations/{id}:
 *   delete:
 *     summary: 删除报价
 *     tags: [SupplierQuotations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 报价删除成功
 */
router.delete('/:id', supplierQuotationController.delete);

/**
 * @swagger
 * /quotations/{id}/approve:
 *   post:
 *     summary: 审核报价
 *     tags: [SupplierQuotations]
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
router.post('/:id/approve', supplierQuotationController.approve);

/**
 * @swagger
 * /quotations/{id}/set-active:
 *   post:
 *     summary: 激活/停用报价
 *     tags: [SupplierQuotations]
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
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 操作成功
 */
router.post('/:id/set-active', supplierQuotationController.setActive);

export default router;
