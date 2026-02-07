import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { successResponse, paginatedResponse } from '../utils/response';

const productService = new ProductService();

export const productController = {
  // 创建产品
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const product = await productService.create(req.body, userId);
      res.status(201).json(successResponse(product, '产品创建成功'));
    } catch (error) {
      next(error);
    }
  },

  // 获取产品列表
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { products, total, page, pageSize } = await productService.findMany(req.query);
      res.json(paginatedResponse(products, total, Number(page), Number(pageSize)));
    } catch (error) {
      next(error);
    }
  },

  // 获取产品详情
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.findById(req.params.id);
      res.json(successResponse(product));
    } catch (error) {
      next(error);
    }
  },

  // 更新产品
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const product = await productService.update(req.params.id, req.body, userId);
      res.json(successResponse(product, '产品更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // 删除产品
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      await productService.delete(req.params.id, userId);
      res.json(successResponse(null, '产品删除成功'));
    } catch (error) {
      next(error);
    }
  },

  // 添加 BOM
  async addBom(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const { childProductId, quantity } = req.body;
      const bom = await productService.addBomItem(
        req.params.id,
        childProductId,
        quantity,
        userId
      );
      res.status(201).json(successResponse(bom, 'BOM 添加成功'));
    } catch (error) {
      next(error);
    }
  },

  // 添加辅料
  async addAccessory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const { accessoryId, productRatio, accessoryRatio } = req.body;
      const accessory = await productService.addAccessory(
        req.params.id,
        accessoryId,
        { productRatio, accessoryRatio },
        userId
      );
      res.status(201).json(successResponse(accessory, '辅料添加成功'));
    } catch (error) {
      next(error);
    }
  },

  // 获取变更历史
  async getChangeLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await productService.getChangeLogs(req.params.id);
      res.json(successResponse(logs));
    } catch (error) {
      next(error);
    }
  },
};
