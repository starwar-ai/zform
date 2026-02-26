 /**
 * PermissionController
 *
 * 操作权限管理 REST API 控制器
 */

import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../services/permission.service';
import { successResponse } from '../utils/response';

const permissionService = new PermissionService();

/** 从请求头安全获取用户 ID */
function getUserId(req: Request): string {
  const raw = req.headers['x-user-id'];
  if (Array.isArray(raw)) return raw[0] || 'system';
  return (raw as string) || 'system';
}

export const permissionController = {
  /** GET /permissions - 获取全部权限列表 */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await permissionService.findAll();
      res.json(successResponse(permissions));
    } catch (error) {
      next(error);
    }
  },

  /** GET /permissions/grouped - 获取按组分类的权限列表 */
  async grouped(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const groups = await permissionService.findGrouped(search);
      res.json(successResponse(groups));
    } catch (error) {
      next(error);
    }
  },

  /** GET /permissions/user/current - 获取当前用户的操作权限码列表 */
  async userCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      if (userId === 'system') {
        return res.status(401).json({
          success: false,
          message: '未登录',
        });
      }
      const codes = await permissionService.getUserPermissions(userId);
      res.json(successResponse(codes));
    } catch (error) {
      next(error);
    }
  },
};
