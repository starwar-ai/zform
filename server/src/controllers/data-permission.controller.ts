/**
 * DataPermissionController
 *
 * 数据权限管理 REST API 控制器
 */

import { Request, Response, NextFunction } from 'express';
import { DataPermissionService } from '../services/data-permission.service';
import { successResponse } from '../utils/response';

const dataPermissionService = new DataPermissionService();

/** 安全获取路由参数 */
function param(req: Request, name: string): string {
  const v = req.params[name];
  return String(v || '');
}

export const dataPermissionController = {
  /** GET /data-permissions/role/:roleId - 获取角色的数据权限 */
  async getByRoleId(req: Request, res: Response, next: NextFunction) {
    try {
      const roleId = param(req, 'roleId');
      const permissions = await dataPermissionService.getByRoleId(roleId);
      res.json(successResponse(permissions));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /data-permissions/role/:roleId - 批量保存角色的数据权限 */
  async saveForRole(req: Request, res: Response, next: NextFunction) {
    try {
      const roleId = param(req, 'roleId');
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'permissions 必须是数组',
        });
      }

      const result = await dataPermissionService.saveForRole(roleId, permissions);
      res.json(successResponse(result, '数据权限保存成功'));
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /data-permissions/:id - 删除单条数据权限 */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await dataPermissionService.delete(param(req, 'id'));
      res.json(successResponse(null, '数据权限删除成功'));
    } catch (error) {
      next(error);
    }
  },
};
