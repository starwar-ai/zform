import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service';
import { successResponse } from '../utils/response';

const roleService = new RoleService();

function getUserId(req: Request): string {
  const raw = req.headers['x-user-id'];
  if (Array.isArray(raw)) return raw[0] || 'system';
  return (raw as string) || 'system';
}

export const roleController = {
  /** GET /roles - 获取角色列表 */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await roleService.findAll();
      res.json(successResponse(roles));
    } catch (error) {
      next(error);
    }
  },

  /** POST /roles - 创建角色 */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const role = await roleService.create(req.body, userId);
      res.status(201).json(successResponse(role, '角色创建成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /roles/:id - 更新角色 */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const role = await roleService.update(req.params.id, req.body, userId);
      res.json(successResponse(role, '角色更新成功'));
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /roles/:id - 删除角色 */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      await roleService.delete(req.params.id, userId);
      res.json(successResponse(null, '角色删除成功'));
    } catch (error) {
      next(error);
    }
  },

  /** GET /roles/:id/menus - 获取角色菜单 ID 列表 */
  async getMenus(req: Request, res: Response, next: NextFunction) {
    try {
      const menuIds = await roleService.getRoleMenuIds(req.params.id);
      res.json(successResponse(menuIds));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /roles/:id/menus - 分配菜单权限 */
  async assignMenus(req: Request, res: Response, next: NextFunction) {
    try {
      const { menuIds } = req.body; // string[]
      await roleService.assignMenus(req.params.id, menuIds);
      res.json(successResponse(null, '菜单权限分配成功'));
    } catch (error) {
      next(error);
    }
  },
};
