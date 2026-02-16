import { Request, Response, NextFunction } from 'express';
import { SupplierQuotationService } from '../services/supplier-quotation.service';
import { successResponse, paginatedResponse } from '../utils/response';
import { ensureString } from '../utils/request';

const quotationService = new SupplierQuotationService();

export const supplierQuotationController = {
  // 创建报价
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const quotation = await quotationService.create(req.body, userId);
      res.status(201).json(successResponse(quotation, '报价创建成功'));
    } catch (error) {
      next(error);
    }
  },

  // 获取报价列表
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { quotations, total, page, pageSize } = await quotationService.findMany(req.query);
      res.json(paginatedResponse(quotations, total, Number(page), Number(pageSize)));
    } catch (error) {
      next(error);
    }
  },

  // 获取报价详情
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationService.findById(ensureString(req.params.id));
      res.json(successResponse(quotation));
    } catch (error) {
      next(error);
    }
  },

  // 根据报价单号查询
  async getByQuotationNo(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationService.findByQuotationNo(ensureString(req.params.quotationNo));
      res.json(successResponse(quotation));
    } catch (error) {
      next(error);
    }
  },

  // 更新报价
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const quotation = await quotationService.update(ensureString(req.params.id), req.body, userId);
      res.json(successResponse(quotation, '报价更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // 删除报价
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      await quotationService.delete(ensureString(req.params.id), userId);
      res.json(successResponse(null, '报价删除成功'));
    } catch (error) {
      next(error);
    }
  },

  // 审核报价
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const { approved } = req.body;
      const quotation = await quotationService.approve(ensureString(req.params.id), approved, userId);
      res.json(successResponse(quotation, `报价${approved ? '审核通过' : '审核拒绝'}`));
    } catch (error) {
      next(error);
    }
  },

  // 激活/停用报价
  async setActive(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const { isActive } = req.body;
      const quotation = await quotationService.setActive(ensureString(req.params.id), isActive, userId);
      res.json(successResponse(quotation, `报价${isActive ? '已激活' : '已停用'}`));
    } catch (error) {
      next(error);
    }
  },

  // 获取供应商的所有报价
  async getBySupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const quotations = await quotationService.getBySupplier(ensureString(req.params.supplierId));
      res.json(successResponse(quotations));
    } catch (error) {
      next(error);
    }
  },

  // 获取有效报价
  async getValidQuotations(req: Request, res: Response, next: NextFunction) {
    try {
      const { supplierId, productCode, asOfDate } = req.query;
      const quotations = await quotationService.getValidQuotations({
        supplierId: ensureString(supplierId),
        productCode: ensureString(productCode),
        asOfDate: asOfDate ? new Date(asOfDate as string) : undefined,
      });
      res.json(successResponse(quotations));
    } catch (error) {
      next(error);
    }
  },

  // 比价
  async compareQuotations(req: Request, res: Response, next: NextFunction) {
    try {
      const productCode = ensureString(req.params.productCode);
      const { asOfDate } = req.query;
      const quotations = await quotationService.compareQuotations(
        productCode,
        asOfDate ? new Date(asOfDate as string) : undefined
      );
      res.json(successResponse(quotations));
    } catch (error) {
      next(error);
    }
  },
};
