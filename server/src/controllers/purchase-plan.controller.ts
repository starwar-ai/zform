import { Request, Response } from 'express';
import { PurchasePlanService } from '../services/purchase-plan.service';
import { success, error } from '../utils/response';

const purchasePlanService = new PurchasePlanService();

export class PurchasePlanController {
  /**
   * 创建采购计划
   * POST /api/purchase-plans
   */
  async create(req: Request, res: Response) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const plan = await purchasePlanService.create(req.body, userId);
      res.json(success(plan, '采购计划创建成功'));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }

  /**
   * 从销售合同生成采购计划
   * POST /api/purchase-plans/from-sales-contract/:salesContractId
   */
  async createFromSalesContract(req: Request, res: Response) {
    try {
      const { salesContractId } = req.params;
      const userId = req.headers['x-user-id'] as string || 'system';
      const plan = await purchasePlanService.createFromSalesContract(salesContractId, userId);
      res.json(success(plan, '从销售合同生成采购计划成功'));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }

  /**
   * 获取采购计划列表
   * GET /api/purchase-plans
   */
  async list(req: Request, res: Response) {
    try {
      const result = await purchasePlanService.findMany(req.query);
      res.json(success(result));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }

  /**
   * 获取采购计划详情
   * GET /api/purchase-plans/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const plan = await purchasePlanService.findById(id);
      res.json(success(plan));
    } catch (err: any) {
      res.status(404).json(error(err.message));
    }
  }

  /**
   * 更新采购计划
   * PUT /api/purchase-plans/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string || 'system';
      const plan = await purchasePlanService.update(id, req.body, userId);
      res.json(success(plan, '采购计划更新成功'));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }

  /**
   * 更新采购计划明细
   * PUT /api/purchase-plans/:planId/items/:itemId
   */
  async updateItem(req: Request, res: Response) {
    try {
      const { planId, itemId } = req.params;
      const userId = req.headers['x-user-id'] as string || 'system';
      const item = await purchasePlanService.updateItem(planId, itemId, req.body, userId);
      res.json(success(item, '采购计划明细更新成功'));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }

  /**
   * 添加采购计划明细
   * POST /api/purchase-plans/:planId/items
   */
  async addItem(req: Request, res: Response) {
    try {
      const { planId } = req.params;
      const userId = req.headers['x-user-id'] as string || 'system';
      const item = await purchasePlanService.addItem(planId, req.body, userId);
      res.json(success(item, '采购计划明细添加成功'));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }

  /**
   * 删除采购计划明细
   * DELETE /api/purchase-plans/:planId/items/:itemId
   */
  async deleteItem(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const result = await purchasePlanService.deleteItem(itemId);
      res.json(success(result, '采购计划明细删除成功'));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }

  /**
   * 审核采购计划
   * POST /api/purchase-plans/:id/approve
   */
  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string || 'system';
      const plan = await purchasePlanService.approve(id, userId);
      res.json(success(plan, '采购计划审核通过'));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }

  /**
   * 拒绝采购计划
   * POST /api/purchase-plans/:id/reject
   */
  async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.headers['x-user-id'] as string || 'system';
      const plan = await purchasePlanService.reject(id, reason, userId);
      res.json(success(plan, '采购计划已拒绝'));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }

  /**
   * 取消采购计划
   * POST /api/purchase-plans/:id/cancel
   */
  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string || 'system';
      const plan = await purchasePlanService.cancel(id, userId);
      res.json(success(plan, '采购计划已取消'));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }

  /**
   * 删除采购计划
   * DELETE /api/purchase-plans/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.headers['x-user-id'] as string || 'system';
      const result = await purchasePlanService.delete(id, userId);
      res.json(success(result, '采购计划删除成功'));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }

  /**
   * 获取采购计划统计
   * GET /api/purchase-plans/statistics
   */
  async getStatistics(req: Request, res: Response) {
    try {
      const stats = await purchasePlanService.getStatistics(req.query);
      res.json(success(stats));
    } catch (err: any) {
      res.status(400).json(error(err.message));
    }
  }
}

export default new PurchasePlanController();
