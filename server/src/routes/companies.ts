/**
 * Company Routes
 *
 * 子公司管理 API 路由。
 */

import { Router, Request, Response } from 'express';
import { CompanyService } from '../services/company.service';
import { ensureString } from '../utils/request';

const router = Router();
const companyService = new CompanyService();

// ==================== 子公司管理 ====================

/** GET /api/companies - 获取所有子公司 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const companies = await companyService.findAll();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取子公司列表失败' });
  }
});

/** GET /api/companies/:id - 获取单个子公司（含银行账号） */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const company = await companyService.findById(ensureString(req.params.id));
    if (!company) {
      return res.status(404).json({ error: '子公司不存在' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取子公司失败' });
  }
});

/** POST /api/companies - 创建子公司 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const company = await companyService.create(req.body, userId);
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '创建子公司失败' });
  }
});

/** PUT /api/companies/:id - 更新子公司 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const company = await companyService.update(ensureString(req.params.id), req.body, userId);
    res.json(company);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新子公司失败' });
  }
});

/** DELETE /api/companies/:id - 删除子公司 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await companyService.delete(ensureString(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '删除子公司失败' });
  }
});

// ==================== 银行账号管理 ====================

/** POST /api/companies/:companyId/bank-accounts - 创建银行账号 */
router.post('/:companyId/bank-accounts', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const bankAccount = await companyService.createBankAccount(
      ensureString(req.params.companyId),
      req.body,
      userId
    );
    res.status(201).json(bankAccount);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '创建银行账号失败' });
  }
});

/** PUT /api/companies/:companyId/bank-accounts/:id - 更新银行账号 */
router.put('/:companyId/bank-accounts/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const bankAccount = await companyService.updateBankAccount(
      ensureString(req.params.id),
      req.body,
      userId
    );
    res.json(bankAccount);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新银行账号失败' });
  }
});

/** DELETE /api/companies/:companyId/bank-accounts/:id - 删除银行账号 */
router.delete('/:companyId/bank-accounts/:id', async (req: Request, res: Response) => {
  try {
    await companyService.deleteBankAccount(ensureString(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '删除银行账号失败' });
  }
});

export default router;
