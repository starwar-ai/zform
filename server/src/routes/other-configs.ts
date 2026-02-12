/**
 * Other Config Routes
 *
 * 其他配置管理 API 路由。
 */

import { Router, Request, Response } from 'express';
import { OtherConfigService } from '../services/other-config.service';

const router = Router();
const otherConfigService = new OtherConfigService();

/** GET /api/other-configs - 获取所有配置 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const configs = await otherConfigService.findAll();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取配置列表失败' });
  }
});

/** GET /api/other-configs/:id - 获取单个配置 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const config = await otherConfigService.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ error: '配置不存在' });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '获取配置失败' });
  }
});

/** PUT /api/other-configs/:id/parameters - 批量更新参数值 */
router.put('/:id/parameters', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { parameters } = req.body;
    
    if (!Array.isArray(parameters)) {
      return res.status(400).json({ error: '参数格式错误' });
    }

    const updated = await otherConfigService.updateParameterValues(
      req.params.id,
      parameters,
      userId
    );
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新参数失败' });
  }
});

/** PUT /api/other-configs/:configId/parameters/:paramId - 更新单个参数值 */
router.put('/:configId/parameters/:paramId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: '缺少参数值' });
    }

    const updated = await otherConfigService.updateParameterValue(
      req.params.configId,
      req.params.paramId,
      value,
      userId
    );
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '更新参数失败' });
  }
});

export default router;
