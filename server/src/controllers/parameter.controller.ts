/**
 * ParameterController
 *
 * 统一业务属性配置 REST API 控制器。
 * 通过 :type 路径参数分发到不同的 Service。
 */

import { Request, Response, NextFunction } from 'express';
import { CustomerCategoryService } from '../services/customer-category.service';
import { ProductCategoryService } from '../services/product-category.service';
import { HsCodeService } from '../services/hs-code.service';
import { ExhibitionCategoryService } from '../services/exhibition-category.service';
import { CustomerSourceTagService } from '../services/customer-source-tag.service';
import { successResponse } from '../utils/response';

const customerCategoryService = new CustomerCategoryService();
const productCategoryService = new ProductCategoryService();
const hsCodeService = new HsCodeService();
const exhibitionCategoryService = new ExhibitionCategoryService();
const customerSourceTagService = new CustomerSourceTagService();

/** 获取请求中的用户 ID */
function getUserId(req: Request): string | undefined {
  return req.headers['x-user-id'] as string | undefined;
}

/** 安全获取路由参数 */
function param(req: Request, name: string): string {
  return String(req.params[name] || '');
}

export const parameterController = {
  // ==================== 客户分类 ====================

  /** GET /categories/customer - 获取客户分类树 */
  async getCustomerTree(_req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await customerCategoryService.getTree();
      res.json(successResponse(tree));
    } catch (error) {
      next(error);
    }
  },

  /** POST /categories/customer - 创建客户分类 */
  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerCategoryService.create(req.body, getUserId(req));
      res.status(201).json(successResponse(result, '客户分类创建成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /categories/customer/:id - 更新客户分类 */
  async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerCategoryService.update(param(req, 'id'), req.body, getUserId(req));
      res.json(successResponse(result, '客户分类更新成功'));
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /categories/customer/:id - 删除客户分类 */
  async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      await customerCategoryService.delete(param(req, 'id'));
      res.json(successResponse(null, '客户分类删除成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /parameters/customer/reorder - 批量更新客户分类排序 */
  async reorderCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { items } = req.body;
      await customerCategoryService.reorder(items, getUserId(req));
      res.json(successResponse(null, '排序更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // ==================== 产品分类（树形，用于产品表单） ====================

  /** GET /categories/product-category - 获取产品分类树 */
  async getProductCategoryTree(_req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await productCategoryService.getTree();
      res.json(successResponse(tree));
    } catch (error) {
      next(error);
    }
  },

  // ==================== 海关编码 ====================

  /** GET /categories/product - 获取海关编码列表 */
  async getProductTree(_req: Request, res: Response, next: NextFunction) {
    try {
      const list = await hsCodeService.findAll();
      res.json(successResponse(list));
    } catch (error) {
      next(error);
    }
  },

  /** POST /categories/product - 创建海关编码 */
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await hsCodeService.create(req.body, getUserId(req));
      res.status(201).json(successResponse(result, '海关编码创建成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /categories/product/:id - 更新海关编码 */
  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await hsCodeService.update(param(req, 'id'), req.body, getUserId(req));
      res.json(successResponse(result, '海关编码更新成功'));
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /categories/product/:id - 删除海关编码 */
  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await hsCodeService.delete(param(req, 'id'));
      res.json(successResponse(null, '海关编码删除成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /parameters/product/reorder - 批量更新海关编码排序 */
  async reorderProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { items } = req.body;
      await hsCodeService.reorder(items, getUserId(req));
      res.json(successResponse(null, '排序更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // ==================== 展会分类 ====================

  /** GET /categories/exhibition - 获取展会分类列表 */
  async getExhibitionList(_req: Request, res: Response, next: NextFunction) {
    try {
      const list = await exhibitionCategoryService.findAll();
      res.json(successResponse(list));
    } catch (error) {
      next(error);
    }
  },

  /** POST /categories/exhibition - 创建展会分类 */
  async createExhibition(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await exhibitionCategoryService.create(req.body, getUserId(req));
      res.status(201).json(successResponse(result, '展会分类创建成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /categories/exhibition/:id - 更新展会分类 */
  async updateExhibition(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await exhibitionCategoryService.update(param(req, 'id'), req.body, getUserId(req));
      res.json(successResponse(result, '展会分类更新成功'));
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /categories/exhibition/:id - 删除展会分类 */
  async deleteExhibition(req: Request, res: Response, next: NextFunction) {
    try {
      await exhibitionCategoryService.delete(param(req, 'id'));
      res.json(successResponse(null, '展会分类删除成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /parameters/exhibition/reorder - 批量更新展会分类排序 */
  async reorderExhibition(req: Request, res: Response, next: NextFunction) {
    try {
      const { items } = req.body;
      await exhibitionCategoryService.reorder(items, getUserId(req));
      res.json(successResponse(null, '排序更新成功'));
    } catch (error) {
      next(error);
    }
  },

  // ==================== 客户来源 ====================

  /** GET /categories/customer-source - 获取客户来源列表 */
  async getCustomerSourceList(_req: Request, res: Response, next: NextFunction) {
    try {
      const list = await customerSourceTagService.findAll();
      res.json(successResponse(list));
    } catch (error) {
      next(error);
    }
  },

  /** POST /categories/customer-source - 创建客户来源 */
  async createCustomerSource(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerSourceTagService.create(req.body, getUserId(req));
      res.status(201).json(successResponse(result, '客户来源创建成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /categories/customer-source/:id - 更新客户来源 */
  async updateCustomerSource(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerSourceTagService.update(param(req, 'id'), req.body, getUserId(req));
      res.json(successResponse(result, '客户来源更新成功'));
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /categories/customer-source/:id - 删除客户来源 */
  async deleteCustomerSource(req: Request, res: Response, next: NextFunction) {
    try {
      await customerSourceTagService.delete(param(req, 'id'));
      res.json(successResponse(null, '客户来源删除成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /parameters/customer-source/reorder - 批量更新客户来源排序 */
  async reorderCustomerSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { items } = req.body;
      await customerSourceTagService.reorder(items, getUserId(req));
      res.json(successResponse(null, '排序更新成功'));
    } catch (error) {
      next(error);
    }
  },
};