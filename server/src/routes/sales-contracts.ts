import { Router } from 'express';
import { salesContractController } from '../controllers/sales-contract.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: SalesContracts
 *   description: 销售合同管理
 */

/**
 * @swagger
 * /sales-contracts:
 *   post:
 *     summary: 创建销售合同
 *     tags: [SalesContracts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - customerId
 *               - customerCode
 *             properties:
 *               code:
 *                 type: string
 *                 description: 合同编号
 *               customerId:
 *                 type: string
 *                 description: 客户ID
 *               customerCode:
 *                 type: string
 *                 description: 客户编号
 *               customerPoNo:
 *                 type: string
 *                 description: 客户PO号
 *               currency:
 *                 type: string
 *                 description: 交易币别
 *               totalAmount:
 *                 type: number
 *                 description: 销售总金额
 *               items:
 *                 type: array
 *                 description: 明细行
 *                 items:
 *                   type: object
 *                   properties:
 *                     productName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *                     amount:
 *                       type: number
 *     responses:
 *       201:
 *         description: 销售合同创建成功
 */
router.post('/', salesContractController.create);

/**
 * @swagger
 * /sales-contracts:
 *   get:
 *     summary: 获取销售合同列表
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（编号、客户编号、客户名称、PO号）
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: 客户ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: 合同状态
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: 审核状态
 *       - in: query
 *         name: contractType
 *         schema:
 *           type: string
 *           enum: [EXPORT, DOMESTIC, JOINT_VENTURE]
 *         description: 合同类型
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取销售合同列表
 */
router.get('/', salesContractController.list);

/**
 * @swagger
 * /sales-contracts/statistics:
 *   get:
 *     summary: 获取销售合同统计数据
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: 客户ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取统计数据
 */
router.get('/statistics', salesContractController.getStatistics);

/**
 * @swagger
 * /sales-contracts/{id}:
 *   get:
 *     summary: 获取销售合同详情
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *     responses:
 *       200:
 *         description: 成功获取销售合同详情
 */
router.get('/:id', salesContractController.getById);

/**
 * @swagger
 * /sales-contracts/code/{code}:
 *   get:
 *     summary: 根据编号获取销售合同
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同编号
 *     responses:
 *       200:
 *         description: 成功获取销售合同详情
 */
router.get('/code/:code', salesContractController.getByCode);

/**
 * @swagger
 * /sales-contracts/{id}:
 *   put:
 *     summary: 更新销售合同
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalAmount:
 *                 type: number
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: 销售合同更新成功
 */
router.put('/:id', salesContractController.update);

/**
 * @swagger
 * /sales-contracts/{id}:
 *   delete:
 *     summary: 删除销售合同
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *     responses:
 *       200:
 *         description: 销售合同删除成功
 */
router.delete('/:id', salesContractController.delete);

/**
 * @swagger
 * /sales-contracts/{id}/approve:
 *   post:
 *     summary: 审核销售合同
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
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
 *                 description: 是否审核通过
 *     responses:
 *       200:
 *         description: 审核成功
 */
router.post('/:id/approve', salesContractController.approve);

/**
 * @swagger
 * /sales-contracts/{id}/confirm:
 *   post:
 *     summary: 确认销售合同
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *     responses:
 *       200:
 *         description: 确认成功
 */
router.post('/:id/confirm', salesContractController.confirm);

/**
 * @swagger
 * /sales-contracts/{id}/status:
 *   put:
 *     summary: 更新合同状态
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PENDING, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED]
 *                 description: 合同状态
 *     responses:
 *       200:
 *         description: 状态更新成功
 */
router.put('/:id/status', salesContractController.updateStatus);

/**
 * @swagger
 * /sales-contracts/{id}/sign-back:
 *   post:
 *     summary: 回签销售合同
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signBackDate:
 *                 type: string
 *                 format: date-time
 *               signBackDescription:
 *                 type: string
 *               signBackAttachments:
 *                 type: array
 *     responses:
 *       200:
 *         description: 回签成功
 */
router.post('/:id/sign-back', salesContractController.signBack);

/**
 * @swagger
 * /sales-contracts/{id}/print:
 *   post:
 *     summary: 打印销售合同
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *     responses:
 *       200:
 *         description: 打印成功
 */
router.post('/:id/print', salesContractController.print);

/**
 * @swagger
 * /sales-contracts/{id}/to-purchase-plan:
 *   post:
 *     summary: 转采购计划
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *     responses:
 *       200:
 *         description: 转采购计划成功
 */
router.post('/:id/to-purchase-plan', salesContractController.toPurchasePlan);

/**
 * @swagger
 * /sales-contracts/{id}/items:
 *   get:
 *     summary: 获取销售合同明细列表
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *     responses:
 *       200:
 *         description: 成功获取明细列表
 */
/**
 * @swagger
 * /sales-contracts/{id}/collection-plans:
 *   get:
 *     summary: 获取销售合同收款计划列表
 *     tags: [SalesContracts]
 */
router.get('/:id/collection-plans', salesContractController.getCollectionPlans);

/**
 * @swagger
 * /sales-contracts/{id}/collection-plans:
 *   post:
 *     summary: '批量保存收款计划（替换模式，body: { receiptPlanItems: [...] }）'
 *     tags: [SalesContracts]
 */
router.post('/:id/collection-plans', salesContractController.upsertCollectionPlans);

/**
 * @swagger
 * /sales-contracts/{id}/collection-plans/{planId}:
 *   put:
 *     summary: 更新收款计划
 *     tags: [SalesContracts]
 */
router.put('/:id/collection-plans/:planId', salesContractController.updateCollectionPlan);

/**
 * @swagger
 * /sales-contracts/{id}/collection-plans/{planId}:
 *   delete:
 *     summary: 删除收款计划
 *     tags: [SalesContracts]
 */
router.delete('/:id/collection-plans/:planId', salesContractController.deleteCollectionPlan);

router.get('/:id/items', salesContractController.getItems);

/**
 * @swagger
 * /sales-contracts/{id}/items:
 *   post:
 *     summary: 添加销售合同明细行
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - quantity
 *               - unitPrice
 *               - amount
 *             properties:
 *               productId:
 *                 type: string
 *               productCode:
 *                 type: string
 *               productName:
 *                 type: string
 *               productSpec:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *               currency:
 *                 type: string
 *               amount:
 *                 type: number
 *               boxes:
 *                 type: integer
 *               grossWeight:
 *                 type: number
 *               netWeight:
 *                 type: number
 *               volume:
 *                 type: number
 *               deliveryDate:
 *                 type: string
 *                 format: date
 *               remark:
 *                 type: string
 *     responses:
 *       201:
 *         description: 明细行添加成功
 */
router.post('/:id/items', salesContractController.addItem);

/**
 * @swagger
 * /sales-contracts/{id}/items/{itemId}:
 *   put:
 *     summary: 更新销售合同明细行
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: 明细行ID
 *     responses:
 *       200:
 *         description: 明细行更新成功
 */
router.put('/:id/items/:itemId', salesContractController.updateItem);

/**
 * @swagger
 * /sales-contracts/{id}/items/{itemId}:
 *   delete:
 *     summary: 删除销售合同明细行
 *     tags: [SalesContracts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: 明细行ID
 *     responses:
 *       200:
 *         description: 明细行删除成功
 */
router.delete('/:id/items/:itemId', salesContractController.deleteItem);

export default router;
