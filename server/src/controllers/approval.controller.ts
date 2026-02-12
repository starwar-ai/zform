import { Request, Response, NextFunction } from 'express';
import { ApprovalService } from '../services/approval.service';
import { successResponse } from '../utils/response';

const approvalService = new ApprovalService();

export const approvalController = {
  // 提交审核
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const userName = (req.headers['x-user-name'] as string) || '系统';
      const roleIds = ((req.headers['x-user-roles'] as string) || '')
        .split(',')
        .filter(Boolean);

      const { docType, docId, docNumber } = req.body;

      const result = await approvalService.submit({
        docType,
        docId,
        docNumber,
        user: { userId, userName, roleIds },
      });

      res.status(201).json(successResponse(result, result.message));
    } catch (error) {
      next(error);
    }
  },

  // 审批（通过/拒绝）
  async process(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const userName = (req.headers['x-user-name'] as string) || '系统';
      const roleIds = ((req.headers['x-user-roles'] as string) || '')
        .split(',')
        .filter(Boolean);

      const { instanceId } = req.params;
      const { action, comment } = req.body;

      const result = await approvalService.process({
        instanceId,
        user: { userId, userName, roleIds },
        action,
        comment,
      });

      res.json(successResponse(result, result.message));
    } catch (error) {
      next(error);
    }
  },

  // 撤回审核
  async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const userName = (req.headers['x-user-name'] as string) || '系统';
      const roleIds = ((req.headers['x-user-roles'] as string) || '')
        .split(',')
        .filter(Boolean);

      const { instanceId } = req.params;

      const result = await approvalService.withdraw({
        instanceId,
        user: { userId, userName, roleIds },
      });

      res.json(successResponse(result, result.message));
    } catch (error) {
      next(error);
    }
  },

  // 查询单据审核历史
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { docType, docId } = req.params;
      const instances = await approvalService.getHistory(docType, docId);
      res.json(successResponse(instances));
    } catch (error) {
      next(error);
    }
  },

  // 查询待审批列表
  async getPending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'system';
      const userName = (req.headers['x-user-name'] as string) || '系统';
      const roleIds = ((req.headers['x-user-roles'] as string) || '')
        .split(',')
        .filter(Boolean);

      const instances = await approvalService.getPending({
        userId,
        userName,
        roleIds,
      });

      res.json(successResponse(instances));
    } catch (error) {
      next(error);
    }
  },

  // 查询审核规则列表
  async getRules(req: Request, res: Response, next: NextFunction) {
    try {
      const { docType } = req.query;
      const rules = await approvalService.getRules(docType as string);
      res.json(successResponse(rules));
    } catch (error) {
      next(error);
    }
  },

  // 创建审核规则
  async createRule(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, docType, levels, condition, enabled } = req.body;
      const rule = await approvalService.createRule({
        code,
        name,
        docType,
        levels,
        condition,
        enabled,
      });
      res.status(201).json(successResponse(rule, '规则创建成功'));
    } catch (error) {
      next(error);
    }
  },

  // 更新审核规则
  async updateRule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, docType, levels, condition, enabled } = req.body;
      const result = await approvalService.updateRule(id, {
        name,
        docType,
        levels,
        condition,
        enabled,
      });
      res.json(successResponse(result, result.warning || '规则更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // 删除审核规则
  async deleteRule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await approvalService.deleteRule(id);
      res.json(successResponse(result, result.message));
    } catch (error) {
      next(error);
    }
  },

  // 检查单据是否需要审核
  async checkRequired(req: Request, res: Response, next: NextFunction) {
    try {
      const { docType, docId } = req.params;
      const required = await approvalService.requiresApproval(docType, docId);
      res.json(successResponse({ required }));
    } catch (error) {
      next(error);
    }
  },
};
