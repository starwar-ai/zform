import { Request, Response, NextFunction } from 'express';
import { SupplierService } from '../services/supplier.service';
import { successResponse, paginatedResponse } from '../utils/response';
import { ensureString } from '../utils/request';

const supplierService = new SupplierService();

export const supplierController = {
  // 创建供应商
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const supplier = await supplierService.create(req.body, userId);
      res.status(201).json(successResponse(supplier, '供应商创建成功'));
    } catch (error) {
      next(error);
    }
  },

  // 获取供应商列表
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { suppliers, total, page, pageSize } = await supplierService.findMany(req.query);
      res.json(paginatedResponse(suppliers, total, Number(page), Number(pageSize)));
    } catch (error) {
      next(error);
    }
  },

  // 获取供应商详情
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.findById(ensureString(req.params.id));
      res.json(successResponse(supplier));
    } catch (error) {
      next(error);
    }
  },

  // 更新供应商
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const supplier = await supplierService.update(ensureString(req.params.id), req.body, userId);
      res.json(successResponse(supplier, '供应商更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // 删除供应商
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      await supplierService.delete(ensureString(req.params.id), userId);
      res.json(successResponse(null, '供应商删除成功'));
    } catch (error) {
      next(error);
    }
  },

  // 审核供应商
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const { approved } = req.body;
      const supplier = await supplierService.approve(ensureString(req.params.id), approved, userId);
      res.json(successResponse(supplier, `供应商${approved ? '审核通过' : '审核拒绝'}`));
    } catch (error) {
      next(error);
    }
  },

  // 转正供应商
  async makeFormal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const supplier = await supplierService.makeFormal(ensureString(req.params.id), userId);
      res.json(successResponse(supplier, '供应商转正成功'));
    } catch (error) {
      next(error);
    }
  },

  // 添加银行账户
  async addBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const bankAccount = await supplierService.addBankAccount(
        ensureString(req.params.id),
        req.body,
        userId
      );
      res.status(201).json(successResponse(bankAccount, '银行账户添加成功'));
    } catch (error) {
      next(error);
    }
  },

  // 更新银行账户
  async updateBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const bankAccount = await supplierService.updateBankAccount(
        ensureString(req.params.bankAccountId),
        req.body,
        userId
      );
      res.json(successResponse(bankAccount, '银行账户更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // 删除银行账户
  async deleteBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      await supplierService.deleteBankAccount(ensureString(req.params.bankAccountId), userId);
      res.json(successResponse(null, '银行账户删除成功'));
    } catch (error) {
      next(error);
    }
  },

  // 获取供应商的银行账户列表
  async getBankAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const bankAccounts = await supplierService.getBankAccounts(ensureString(req.params.id));
      res.json(successResponse(bankAccounts));
    } catch (error) {
      next(error);
    }
  },
};
