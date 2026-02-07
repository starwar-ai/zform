import { Router } from 'express';
import { approvalController } from '../controllers/approval.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Approvals
 *   description: 审核流程管理
 */

/**
 * @swagger
 * /approvals/submit:
 *   post:
 *     summary: 提交审核
 *     tags: [Approvals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - docType
 *               - docId
 *             properties:
 *               docType:
 *                 type: string
 *                 description: 单据类型（如 sales_contract）
 *               docId:
 *                 type: string
 *                 description: 单据 ID
 *               docNumber:
 *                 type: string
 *                 description: 单据编号
 *     responses:
 *       201:
 *         description: 审核提交成功
 */
router.post('/submit', approvalController.submit);

/**
 * @swagger
 * /approvals/rules:
 *   get:
 *     summary: 查询审核规则列表
 *     tags: [Approvals]
 *     parameters:
 *       - in: query
 *         name: docType
 *         schema:
 *           type: string
 *         description: 按单据类型筛选
 *     responses:
 *       200:
 *         description: 成功获取审核规则列表
 */
router.get('/rules', approvalController.getRules);

/**
 * @swagger
 * /approvals/pending:
 *   get:
 *     summary: 查询我的待审批列表
 *     tags: [Approvals]
 *     responses:
 *       200:
 *         description: 成功获取待审批列表
 */
router.get('/pending', approvalController.getPending);

/**
 * @swagger
 * /approvals/history/{docType}/{docId}:
 *   get:
 *     summary: 查询单据审核历史
 *     tags: [Approvals]
 *     parameters:
 *       - in: path
 *         name: docType
 *         required: true
 *         schema:
 *           type: string
 *         description: 单据类型
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *         description: 单据 ID
 *     responses:
 *       200:
 *         description: 成功获取审核历史
 */
router.get('/history/:docType/:docId', approvalController.getHistory);

/**
 * @swagger
 * /approvals/check/{docType}/{docId}:
 *   get:
 *     summary: 检查单据是否需要审核
 *     tags: [Approvals]
 *     parameters:
 *       - in: path
 *         name: docType
 *         required: true
 *         schema:
 *           type: string
 *         description: 单据类型
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *         description: 单据 ID
 *     responses:
 *       200:
 *         description: 返回是否需要审核
 */
router.get('/check/:docType/:docId', approvalController.checkRequired);

/**
 * @swagger
 * /approvals/{instanceId}/process:
 *   post:
 *     summary: 审批（通过/拒绝）
 *     tags: [Approvals]
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: 审核实例 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: 审批动作
 *               comment:
 *                 type: string
 *                 description: 审批意见
 *     responses:
 *       200:
 *         description: 审批成功
 */
router.post('/:instanceId/process', approvalController.process);

/**
 * @swagger
 * /approvals/{instanceId}/withdraw:
 *   post:
 *     summary: 撤回审核
 *     tags: [Approvals]
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: 审核实例 ID
 *     responses:
 *       200:
 *         description: 撤回成功
 */
router.post('/:instanceId/withdraw', approvalController.withdraw);

export default router;
