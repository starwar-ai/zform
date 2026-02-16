import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: 客户管理
 */

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: 创建客户
 *     tags: [Customers]
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
 *                 description: 客户编号
 *               name:
 *                 type: string
 *                 description: 企业名称
 *               shortName:
 *                 type: string
 *                 description: 简称
 *               countryCode:
 *                 type: string
 *                 description: 国家编码
 *               website:
 *                 type: string
 *                 description: 官网
 *               email:
 *                 type: string
 *                 description: 电子邮件
 *               stage:
 *                 type: string
 *                 enum: [POTENTIAL, FORMAL, RETIRED]
 *                 description: 客户阶段
 *               isForeign:
 *                 type: boolean
 *                 description: 国外客户标志
 *               isAgent:
 *                 type: boolean
 *                 description: 是否是代理
 *     responses:
 *       201:
 *         description: 客户创建成功
 */
router.post('/', customerController.create);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: 获取客户列表
 *     tags: [Customers]
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
 *         description: 搜索关键词（客户编号、名称、简称）
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [POTENTIAL, FORMAL, RETIRED]
 *         description: 客户阶段
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: 审核状态
 *       - in: query
 *         name: isEnabled
 *         schema:
 *           type: boolean
 *         description: 是否启用
 *       - in: query
 *         name: isAgent
 *         schema:
 *           type: boolean
 *         description: 是否代理
 *       - in: query
 *         name: isForeign
 *         schema:
 *           type: boolean
 *         description: 是否国外客户
 *     responses:
 *       200:
 *         description: 成功获取客户列表
 */
router.get('/', customerController.list);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: 获取客户详情
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *     responses:
 *       200:
 *         description: 成功获取客户详情
 */
router.get('/:id', customerController.getById);

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: 更新客户
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               shortName:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: 客户更新成功
 */
router.put('/:id', customerController.update);

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: 删除客户
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *     responses:
 *       200:
 *         description: 客户删除成功
 */
router.delete('/:id', customerController.delete);

/**
 * @swagger
 * /customers/{id}/approve:
 *   post:
 *     summary: 审核客户
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
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
router.post('/:id/approve', customerController.approve);

/**
 * @swagger
 * /customers/{id}/make-formal:
 *   post:
 *     summary: 转正客户
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *     responses:
 *       200:
 *         description: 客户转正成功
 */
router.post('/:id/make-formal', customerController.makeFormal);

/**
 * @swagger
 * /customers/{id}/bank-accounts:
 *   get:
 *     summary: 获取客户的银行账户列表
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *     responses:
 *       200:
 *         description: 成功获取银行账户列表
 */
router.get('/:id/bank-accounts', customerController.getBankAccounts);

/**
 * @swagger
 * /customers/{id}/bank-accounts:
 *   post:
 *     summary: 添加银行账户
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
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
 *                 description: 开户行
 *               bankAccount:
 *                 type: string
 *                 description: 银行账户
 *               accountNumber:
 *                 type: string
 *                 description: 银行账号
 *               branchAddress:
 *                 type: string
 *                 description: 开户行地址
 *               branchContact:
 *                 type: string
 *                 description: 开户行联系人
 *               isDefault:
 *                 type: boolean
 *                 description: 是否默认账户
 *     responses:
 *       201:
 *         description: 银行账户添加成功
 */
router.post('/:id/bank-accounts', customerController.addBankAccount);

/**
 * @swagger
 * /customers/{id}/bank-accounts/{bankAccountId}:
 *   put:
 *     summary: 更新银行账户
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *       - in: path
 *         name: bankAccountId
 *         required: true
 *         schema:
 *           type: string
 *         description: 银行账户ID
 *     responses:
 *       200:
 *         description: 银行账户更新成功
 */
router.put('/:id/bank-accounts/:bankAccountId', customerController.updateBankAccount);

/**
 * @swagger
 * /customers/{id}/bank-accounts/{bankAccountId}:
 *   delete:
 *     summary: 删除银行账户
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *       - in: path
 *         name: bankAccountId
 *         required: true
 *         schema:
 *           type: string
 *         description: 银行账户ID
 *     responses:
 *       200:
 *         description: 银行账户删除成功
 */
router.delete('/:id/bank-accounts/:bankAccountId', customerController.deleteBankAccount);

/**
 * @swagger
 * /customers/{id}/contacts:
 *   get:
 *     summary: 获取客户的联系人列表
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *     responses:
 *       200:
 *         description: 成功获取联系人列表
 */
router.get('/:id/contacts', customerController.getContacts);

/**
 * @swagger
 * /customers/{id}/contacts:
 *   post:
 *     summary: 添加联系人
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: 联系人姓名
 *               position:
 *                 type: string
 *                 description: 联系人职位
 *               email:
 *                 type: string
 *                 description: 电子邮件
 *               mobile:
 *                 type: string
 *                 description: 手机
 *               phone:
 *                 type: string
 *                 description: 座机
 *               address:
 *                 type: string
 *                 description: 住宅地址
 *               wechat:
 *                 type: string
 *                 description: 微信
 *               qq:
 *                 type: string
 *                 description: QQ
 *               isDefault:
 *                 type: boolean
 *                 description: 是否默认联系人
 *               remark:
 *                 type: string
 *                 description: 备注
 *     responses:
 *       201:
 *         description: 联系人添加成功
 */
router.post('/:id/contacts', customerController.addContact);

/**
 * @swagger
 * /customers/{id}/contacts/{contactId}:
 *   put:
 *     summary: 更新联系人
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: 联系人ID
 *     responses:
 *       200:
 *         description: 联系人更新成功
 */
router.put('/:id/contacts/:contactId', customerController.updateContact);

/**
 * @swagger
 * /customers/{id}/contacts/{contactId}:
 *   delete:
 *     summary: 删除联系人
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: 联系人ID
 *     responses:
 *       200:
 *         description: 联系人删除成功
 */
router.delete('/:id/contacts/:contactId', customerController.deleteContact);

/**
 * @swagger
 * /customers/{id}/payment-terms:
 *   get:
 *     summary: 获取客户的付款方式列表
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客户ID
 *     responses:
 *       200:
 *         description: 成功获取付款方式列表
 */
router.get('/:id/payment-terms', customerController.getPaymentTerms);

export default router;
