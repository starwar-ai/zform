import { Request, Response, NextFunction } from 'express';
import { SalesContractService } from '../services/sales-contract.service';
import { CollectionPlanService } from '../services/collection-plan.service';
import { successResponse, paginatedResponse } from '../utils/response';
import { ensureString } from '../utils/request';

const salesContractService = new SalesContractService();
const collectionPlanService = new CollectionPlanService();

export const salesContractController = {
  // 创建销售合同
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const salesContract = await salesContractService.create(req.body, userId);
      res.status(201).json(successResponse(salesContract, '销售合同创建成功'));
    } catch (error) {
      next(error);
    }
  },

  // 获取销售合同列表
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { contracts, total, page, pageSize } =
        await salesContractService.findMany(req.query);
      res.json(paginatedResponse(contracts, total, Number(page), Number(pageSize)));
    } catch (error) {
      next(error);
    }
  },

  // 获取销售合同详情
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const salesContract = await salesContractService.findById(ensureString(req.params.id));
      res.json(successResponse(salesContract));
    } catch (error) {
      next(error);
    }
  },

  // 根据编号获取销售合同
  async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const salesContract = await salesContractService.findByCode(
        ensureString(req.params.code)
      );
      res.json(successResponse(salesContract));
    } catch (error) {
      next(error);
    }
  },

  // 更新销售合同
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const salesContract = await salesContractService.update(
        ensureString(req.params.id),
        req.body,
        userId
      );
      res.json(successResponse(salesContract, '销售合同更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // 删除销售合同
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      await salesContractService.delete(ensureString(req.params.id), userId);
      res.json(successResponse(null, '销售合同删除成功'));
    } catch (error) {
      next(error);
    }
  },

  // 审核销售合同
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const { approved } = req.body;
      const salesContract = await salesContractService.approve(
        ensureString(req.params.id),
        approved,
        userId
      );
      res.json(
        successResponse(
          salesContract,
          `销售合同${approved ? '审核通过' : '审核拒绝'}`
        )
      );
    } catch (error) {
      next(error);
    }
  },

  // 确认销售合同
  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const salesContract = await salesContractService.confirm(
        ensureString(req.params.id),
        userId
      );
      res.json(successResponse(salesContract, '销售合同确认成功'));
    } catch (error) {
      next(error);
    }
  },

  // 更新合同状态
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const { status } = req.body;
      const salesContract = await salesContractService.updateStatus(
        ensureString(req.params.id),
        status,
        userId
      );
      res.json(successResponse(salesContract, '合同状态更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // 回签
  async signBack(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const salesContract = await salesContractService.signBack(
        ensureString(req.params.id),
        req.body,
        userId
      );
      res.json(successResponse(salesContract, '回签成功'));
    } catch (error) {
      next(error);
    }
  },

  // 打印
  async print(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const salesContract = await salesContractService.print(
        ensureString(req.params.id),
        userId
      );
      res.json(successResponse(salesContract, '打印成功'));
    } catch (error) {
      next(error);
    }
  },

  // 转采购计划
  async toPurchasePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const salesContract = await salesContractService.toPurchasePlan(
        ensureString(req.params.id),
        userId
      );
      res.json(successResponse(salesContract, '转采购计划成功'));
    } catch (error) {
      next(error);
    }
  },

  // 添加明细行
  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const item = await salesContractService.addItem(
        ensureString(req.params.id),
        req.body,
        userId
      );
      res.status(201).json(successResponse(item, '明细行添加成功'));
    } catch (error) {
      next(error);
    }
  },

  // 更新明细行
  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const item = await salesContractService.updateItem(
        ensureString(req.params.itemId),
        req.body,
        userId
      );
      res.json(successResponse(item, '明细行更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // 删除明细行
  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      await salesContractService.deleteItem(ensureString(req.params.itemId), userId);
      res.json(successResponse(null, '明细行删除成功'));
    } catch (error) {
      next(error);
    }
  },

  // 获取明细列表
  async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await salesContractService.getItems(ensureString(req.params.id));
      res.json(successResponse(items));
    } catch (error) {
      next(error);
    }
  },

  // 获取统计数据
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const statistics = await salesContractService.getStatistics(req.query);
      res.json(successResponse(statistics));
    } catch (error) {
      next(error);
    }
  },

  // ==================== 收款计划 ====================

  async getCollectionPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await collectionPlanService.findBySalesContractId(
        ensureString(req.params.id)
      );
      res.json(successResponse(plans));
    } catch (error) {
      next(error);
    }
  },

  async createCollectionPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const plan = await collectionPlanService.create(
        { ...req.body, salesContractId: ensureString(req.params.id) },
        userId
      );
      res.status(201).json(successResponse(plan, '收款计划创建成功'));
    } catch (error) {
      next(error);
    }
  },

  async updateCollectionPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const plan = await collectionPlanService.update(
        ensureString(req.params.planId),
        req.body,
        userId
      );
      res.json(successResponse(plan, '收款计划更新成功'));
    } catch (error) {
      next(error);
    }
  },

  async deleteCollectionPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      await collectionPlanService.delete(
        ensureString(req.params.planId),
        userId
      );
      res.json(successResponse(null, '收款计划删除成功'));
    } catch (error) {
      next(error);
    }
  },

  async upsertCollectionPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const { receiptPlanItems } = req.body;
      const rawPlans = Array.isArray(receiptPlanItems) ? receiptPlanItems : [];
      const plans = await collectionPlanService.upsertBySalesContractId(
        ensureString(req.params.id),
        rawPlans.map((p: any) => ({ ...(p.data ?? p), id: p.id })),
        userId
      );
      res.json(successResponse(plans, '收款计划保存成功'));
    } catch (error) {
      next(error);
    }
  },
};
