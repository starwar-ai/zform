/**
 * 统一单据 API —— 通用 Controller
 *
 * 所有单据类型共用一套路由处理逻辑，通过 :typeId 参数分发到对应 adapter。
 */

import { Request, Response, NextFunction } from 'express';
import { DocumentService } from './document.service';
import { successResponse } from '../utils/response';
import type { DocumentListParams } from './types';

const documentService = new DocumentService();

/** 从请求头安全获取用户 ID */
function getUserId(req: Request): string {
  const raw = req.headers['x-user-id'];
  if (Array.isArray(raw)) return raw[0] || 'system';
  return (raw as string) || 'system';
}

/** 安全获取路由参数 (Express 某些版本 params 值可能是 string | string[]) */
function param(req: Request, name: string): string {
  const v = req.params[name];
  return String(v || '');
}

/** 安全获取 query 参数 */
function query(req: Request, name: string): string | undefined {
  const v = req.query[name];
  if (v === undefined || v === null) return undefined;
  return String(v);
}

export const documentController = {
  /**
   * GET /documents/:typeId/list
   *
   * 查询参数:
   *   mode        - 'document' | 'detail'
   *   detailTableId - 明细模式下的明细表 ID
   *   pageIndex   - 页码 (从 0 开始)
   *   pageSize    - 每页条数
   *   filters     - JSON 编码的筛选条件
   *   sorting     - JSON 编码的排序条件
   *   search      - 关键字搜索
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const typeId = param(req, 'typeId');
      const mode = query(req, 'mode') || 'document';
      const detailTableId = query(req, 'detailTableId');
      const pageIndex = query(req, 'pageIndex') || '0';
      const pageSize = query(req, 'pageSize') || '20';
      const filtersJson = query(req, 'filters');
      const sortingJson = query(req, 'sorting');
      const search = query(req, 'search');

      const params: DocumentListParams = {
        mode: mode as 'document' | 'detail',
        detailTableId,
        pagination: {
          pageIndex: Number(pageIndex),
          pageSize: Number(pageSize),
        },
        filters: filtersJson ? JSON.parse(filtersJson) : [],
        sorting: sortingJson ? JSON.parse(sortingJson) : [],
      };

      const result = await documentService.list(typeId, params, search);

      res.json({
        success: true,
        message: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /documents/:typeId/:id
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const typeId = param(req, 'typeId');
      const id = param(req, 'id');
      const doc = await documentService.getById(typeId, id);
      res.json(successResponse(doc));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /documents/:typeId
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const typeId = param(req, 'typeId');
      const userId = getUserId(req);
      const doc = await documentService.create(typeId, req.body, userId);
      res.status(201).json(successResponse(doc, '创建成功'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /documents/:typeId/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const typeId = param(req, 'typeId');
      const id = param(req, 'id');
      const userId = getUserId(req);
      const doc = await documentService.update(typeId, id, req.body, userId);
      res.json(successResponse(doc, '更新成功'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /documents/:typeId/:id
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const typeId = param(req, 'typeId');
      const id = param(req, 'id');
      const userId = getUserId(req);
      await documentService.delete(typeId, id, userId);
      res.json(successResponse(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  },

  // ---- 明细行操作 ----

  /**
   * GET /documents/:typeId/:id/items
   */
  async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const typeId = param(req, 'typeId');
      const id = param(req, 'id');
      const items = await documentService.getItems(typeId, id);
      res.json(successResponse(items));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /documents/:typeId/:id/items
   */
  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const typeId = param(req, 'typeId');
      const id = param(req, 'id');
      const userId = getUserId(req);
      const item = await documentService.addItem(typeId, id, req.body, userId);
      res.status(201).json(successResponse(item, '明细行添加成功'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /documents/:typeId/:id/items/:itemId
   */
  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const typeId = param(req, 'typeId');
      const itemId = param(req, 'itemId');
      const userId = getUserId(req);
      const item = await documentService.updateItem(typeId, itemId, req.body, userId);
      res.json(successResponse(item, '明细行更新成功'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /documents/:typeId/:id/items/:itemId
   */
  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const typeId = param(req, 'typeId');
      const itemId = param(req, 'itemId');
      const userId = getUserId(req);
      await documentService.deleteItem(typeId, itemId, userId);
      res.json(successResponse(null, '明细行删除成功'));
    } catch (error) {
      next(error);
    }
  },

  // ---- 自定义 Action ----

  /**
   * POST /documents/:typeId/:id/actions/:action
   */
  async executeAction(req: Request, res: Response, next: NextFunction) {
    try {
      const typeId = param(req, 'typeId');
      const id = param(req, 'id');
      const action = param(req, 'action');
      const userId = getUserId(req);
      const result = await documentService.executeAction(typeId, id, action, req.body, userId);
      res.json(successResponse(result.data, result.message));
    } catch (error) {
      next(error);
    }
  },

  // ---- 元数据 ----

  /**
   * GET /documents/types
   *
   * 返回所有已注册的单据类型列表
   */
  async listTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentTypeRegistry } = await import('./registry');
      const types = documentTypeRegistry.getAll().map((adapter) => ({
        typeId: adapter.typeId,
        typeName: adapter.typeName,
        hasItems: !!adapter.prismaItemModel,
        actions: adapter.actions ? Object.keys(adapter.actions) : [],
        aggregateFields: adapter.aggregateFields || [],
      }));
      res.json(successResponse(types));
    } catch (error) {
      next(error);
    }
  },
};
