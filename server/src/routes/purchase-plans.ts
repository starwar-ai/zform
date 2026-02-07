import { Router } from 'express';
import purchasePlanController from '../controllers/purchase-plan.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: PurchasePlans
 *   description: 采购计划管理
 */

/**
 * @swagger
 * /api/purchase-plans:
 *   get:
 *     summary: 获取采购计划列表
 *     tags: [PurchasePlans]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: planStatus
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, APPROVED, IN_PROGRESS, COMPLETED, CLOSED, CANCELLED]
 *         description: 计划状态
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: 审核状态
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: 客户ID
 *       - in: query
 *         name: buyer
 *         schema:
 *           type: string
 *         description: 采购员
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/', purchasePlanController.list.bind(purchasePlanController));

/**
 * @swagger
 * /api/purchase-plans/statistics:
 *   get:
 *     summary: 获取采购计划统计
 *     tags: [PurchasePlans]
 *     parameters:
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
 *         description: 成功
 */
router.get('/statistics', purchasePlanController.getStatistics.bind(purchasePlanController));

/**
 * @swagger
 * /api/purchase-plans/{id}:
 *   get:
 *     summary: 获取采购计划详情
 *     tags: [PurchasePlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 采购计划ID
 *     responses:
 *       200:
 *         description: 成功
 *       404:
 *         description: 采购计划不存在
 */
router.get('/:id', purchasePlanController.getById.bind(purchasePlanController));

/**
 * @swagger
 * /api/purchase-plans:
 *   post:
 *     summary: 创建采购计划
 *     tags: [PurchasePlans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - planDate
 *               - expectedDeliveryDate
 *             properties:
 *               code:
 *                 type: string
 *                 description: 计划编号
 *               planDate:
 *                 type: string
 *                 format: date
 *                 description: 计划日期
 *               expectedDeliveryDate:
 *                 type: string
 *                 format: date
 *                 description: 预计交期
 *     responses:
 *       200:
 *         description: 成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/', purchasePlanController.create.bind(purchasePlanController));

/**
 * @swagger
 * /api/purchase-plans/from-sales-contract/{salesContractId}:
 *   post:
 *     summary: 从销售合同生成采购计划
 *     tags: [PurchasePlans]
 *     parameters:
 *       - in: path
 *         name: salesContractId
 *         required: true
 *         schema:
 *           type: string
 *         description: 销售合同ID
 *     responses:
 *       200:
 *         description: 成功
 *       400:
 *         description: 销售合同不存在或已生成采购计划
 */
router.post(
  '/from-sales-contract/:salesContractId',
  purchasePlanController.createFromSalesContract.bind(purchasePlanController)
);

/**
 * @swagger
 * /api/purchase-plans/{id}:
 *   put:
 *     summary: 更新采购计划
 *     tags: [PurchasePlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 采购计划ID
 *     responses:
 *       200:
 *         description: 成功
 *       400:
 *         description: 请求参数错误
 */
router.put('/:id', purchasePlanController.update.bind(purchasePlanController));

/**
 * @swagger
 * /api/purchase-plans/{id}/approve:
 *   post:
 *     summary: 审核通过采购计划
 *     tags: [PurchasePlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 采购计划ID
 *     responses:
 *       200:
 *         description: 成功
 *       400:
 *         description: 采购计划不存在或已审核
 */
router.post('/:id/approve', purchasePlanController.approve.bind(purchasePlanController));

/**
 * @swagger
 * /api/purchase-plans/{id}/reject:
 *   post:
 *     summary: 拒绝采购计划
 *     tags: [PurchasePlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 采购计划ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 拒绝原因
 *     responses:
 *       200:
 *         description: 成功
 */
router.post('/:id/reject', purchasePlanController.reject.bind(purchasePlanController));

/**
 * @swagger
 * /api/purchase-plans/{id}/cancel:
 *   post:
 *     summary: 取消采购计划
 *     tags: [PurchasePlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 采购计划ID
 *     responses:
 *       200:
 *         description: 成功
 *       400:
 *         description: 不能取消已完成或已结案的采购计划
 */
router.post('/:id/cancel', purchasePlanController.cancel.bind(purchasePlanController));

/**
 * @swagger
 * /api/purchase-plans/{id}:
 *   delete:
 *     summary: 删除采购计划
 *     tags: [PurchasePlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 采购计划ID
 *     responses:
 *       200:
 *         description: 成功
 *       400:
 *         description: 只能删除草稿或已取消的采购计划
 */
router.delete('/:id', purchasePlanController.delete.bind(purchasePlanController));

/**
 * @swagger
 * /api/purchase-plans/{planId}/items:
 *   post:
 *     summary: 添加采购计划明细
 *     tags: [PurchasePlans]
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: 采购计划ID
 *     responses:
 *       200:
 *         description: 成功
 */
router.post('/:planId/items', purchasePlanController.addItem.bind(purchasePlanController));

/**
 * @swagger
 * /api/purchase-plans/{planId}/items/{itemId}:
 *   put:
 *     summary: 更新采购计划明细
 *     tags: [PurchasePlans]
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: 采购计划ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: 明细ID
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/:planId/items/:itemId', purchasePlanController.updateItem.bind(purchasePlanController));

/**
 * @swagger
 * /api/purchase-plans/{planId}/items/{itemId}:
 *   delete:
 *     summary: 删除采购计划明细
 *     tags: [PurchasePlans]
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *         description: 采购计划ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: 明细ID
 *     responses:
 *       200:
 *         description: 成功
 */
router.delete('/:planId/items/:itemId', purchasePlanController.deleteItem.bind(purchasePlanController));

export default router;
