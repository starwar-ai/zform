import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { successResponse, paginatedResponse } from '../utils/response';

const customerService = new CustomerService();

export const customerController = {
  // 创建客户
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const customer = await customerService.create(req.body, userId);
      res.status(201).json(successResponse(customer, '客户创建成功'));
    } catch (error) {
      next(error);
    }
  },

  // 获取客户列表
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { customers, total, page, pageSize } = await customerService.findMany(req.query);
      res.json(paginatedResponse(customers, total, Number(page), Number(pageSize)));
    } catch (error) {
      next(error);
    }
  },

  // 获取客户详情
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.findById(req.params.id);
      res.json(successResponse(customer));
    } catch (error) {
      next(error);
    }
  },

  // 更新客户
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const customer = await customerService.update(req.params.id, req.body, userId);
      res.json(successResponse(customer, '客户更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // 删除客户
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      await customerService.delete(req.params.id, userId);
      res.json(successResponse(null, '客户删除成功'));
    } catch (error) {
      next(error);
    }
  },

  // 审核客户
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const { approved } = req.body;
      const customer = await customerService.approve(req.params.id, approved, userId);
      res.json(successResponse(customer, `客户${approved ? '审核通过' : '审核拒绝'}`));
    } catch (error) {
      next(error);
    }
  },

  // 转正客户
  async makeFormal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const customer = await customerService.makeFormal(req.params.id, userId);
      res.json(successResponse(customer, '客户转正成功'));
    } catch (error) {
      next(error);
    }
  },

  // 添加银行账户
  async addBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const bankAccount = await customerService.addBankAccount(
        req.params.id,
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
      const bankAccount = await customerService.updateBankAccount(
        req.params.bankAccountId,
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
      await customerService.deleteBankAccount(req.params.bankAccountId, userId);
      res.json(successResponse(null, '银行账户删除成功'));
    } catch (error) {
      next(error);
    }
  },

  // 获取客户的银行账户列表
  async getBankAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const bankAccounts = await customerService.getBankAccounts(req.params.id);
      res.json(successResponse(bankAccounts));
    } catch (error) {
      next(error);
    }
  },

  // 添加联系人
  async addContact(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const contact = await customerService.addContact(
        req.params.id,
        req.body,
        userId
      );
      res.status(201).json(successResponse(contact, '联系人添加成功'));
    } catch (error) {
      next(error);
    }
  },

  // 更新联系人
  async updateContact(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const contact = await customerService.updateContact(
        req.params.contactId,
        req.body,
        userId
      );
      res.json(successResponse(contact, '联系人更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // 删除联系人
  async deleteContact(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      await customerService.deleteContact(req.params.contactId, userId);
      res.json(successResponse(null, '联系人删除成功'));
    } catch (error) {
      next(error);
    }
  },

  // 获取客户的联系人列表
  async getContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const contacts = await customerService.getContacts(req.params.id);
      res.json(successResponse(contacts));
    } catch (error) {
      next(error);
    }
  },
};
