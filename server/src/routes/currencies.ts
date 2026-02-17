/**
 * Currency Routes
 *
 * 币种管理 API 路由。
 */

import { Router, Request, Response } from 'express';
import { CurrencyService } from '../services/currency.service';
import { ensureString } from '../utils/request';

function ensureNumber(value: unknown, defaultValue: number = 0): number {
  if (value === undefined || value === null) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

const router = Router();
const currencyService = new CurrencyService();

/** GET /api/currencies - 获取所有币种 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const currencies = await currencyService.findAll();
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取币种列表失败' });
  }
});

/** GET /api/currencies/:id - 获取单个币种 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const currency = await currencyService.findById(ensureString(req.params.id));
    if (!currency) {
      return res.status(404).json({ error: '币种不存在' });
    }
    res.json(currency);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取币种失败' });
  }
});

/** POST /api/currencies - 创建币种 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const data = req.body;
    
    // 验证必填字段
    if (!data.code?.trim()) {
      return res.status(400).json({ error: '币种代码不能为空' });
    }
    if (!data.name?.trim()) {
      return res.status(400).json({ error: '币种名称不能为空' });
    }
    if (!data.symbol?.trim()) {
      return res.status(400).json({ error: '货币符号不能为空' });
    }
    
    // 检查币种代码是否已存在
    const existing = await currencyService.findByCode(data.code.trim().toUpperCase());
    if (existing) {
      return res.status(400).json({ error: '币种代码已存在' });
    }
    
    const created = await currencyService.create({
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      symbol: data.symbol.trim(),
      isCommon: Boolean(data.isCommon),
      isEnabled: data.isEnabled !== undefined ? Boolean(data.isEnabled) : true,
      orderNum: ensureNumber(data.orderNum, 0),
      remark: data.remark?.trim() || '',
    }, userId);
    
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '创建币种失败' });
  }
});

/** PUT /api/currencies/:id - 更新币种 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const id = ensureString(req.params.id);
    const data = req.body;
    
    // 如果提供了code，检查是否重复（排除自己）
    if (data.code) {
      const existing = await currencyService.findByCode(data.code.trim().toUpperCase());
      if (existing && existing.id !== id) {
        return res.status(400).json({ error: '币种代码已存在' });
      }
    }
    
    const updated = await currencyService.update(id, {
      ...(data.code && { code: data.code.trim().toUpperCase() }),
      ...(data.name && { name: data.name.trim() }),
      ...(data.symbol && { symbol: data.symbol.trim() }),
      ...(data.isCommon !== undefined && { isCommon: Boolean(data.isCommon) }),
      ...(data.isEnabled !== undefined && { isEnabled: Boolean(data.isEnabled) }),
      ...(data.orderNum !== undefined && { orderNum: ensureNumber(data.orderNum, 0) }),
      ...(data.remark !== undefined && { remark: data.remark?.trim() || '' }),
    }, userId);
    
    if (!updated) {
      return res.status(404).json({ error: '币种不存在' });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新币种失败' });
  }
});

/** DELETE /api/currencies/:id - 删除币种 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const id = ensureString(req.params.id);
    
    // 检查是否有相关数据引用此币种
    const hasReferences = await currencyService.checkReferences(id);
    if (hasReferences) {
      return res.status(400).json({ 
        error: '该币种已被使用，无法删除。请先解除相关引用后再尝试删除。' 
      });
    }
    
    const deleted = await currencyService.delete(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: '币种不存在' });
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '删除币种失败' });
  }
});

/** PUT /api/currencies/order - 批量更新排序 */
router.put('/order', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: '参数格式错误' });
    }
    
    await currencyService.updateOrder(updates, userId);
    res.json({ message: '排序更新成功' });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新排序失败' });
  }
});

export default router;