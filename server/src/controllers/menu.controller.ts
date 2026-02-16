import { Request, Response, NextFunction } from 'express';
import { MenuService } from '../services/menu.service';
import { successResponse } from '../utils/response';
import { ensureString } from '../utils/request';
import prisma from '../config/database';

const menuService = new MenuService();

/** 从请求头安全获取用户 ID */
function getUserId(req: Request): string {
  const raw = req.headers['x-user-id'];
  if (Array.isArray(raw)) return raw[0] || 'system';
  return (raw as string) || 'system';
}

export const menuController = {
  /** GET /menus - 获取全部菜单（扁平列表） */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const menus = await menuService.findAll();
      res.json(successResponse(menus));
    } catch (error) {
      next(error);
    }
  },

  /** GET /menus/tree - 获取菜单树 */
  async tree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await menuService.getTree();
      res.json(successResponse(tree));
    } catch (error) {
      next(error);
    }
  },

  /** GET /menus/user-menus - 获取当前用户可见菜单树 */
  async userMenus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);

      // 从请求头获取角色 ID 列表
      const rolesHeader = req.headers['x-user-roles'];
      const roleIds = rolesHeader
        ? String(rolesHeader).split(',').filter(Boolean)
        : [];

      // 如果是 admin 用户（通过查询用户角色），返回全部可见菜单
      // 简化处理：如果有角色，按角色过滤；没有角色返回空
      if (roleIds.length === 0) {
        // 尝试从数据库获取用户角色
        const userRoles = await prisma.sysUserRole.findMany({
          where: { userId },
          select: { roleId: true },
        });
        roleIds.push(...userRoles.map((ur) => ur.roleId));
      }

      const tree = await menuService.getMenusByRoleIds(roleIds);
      res.json(successResponse(tree));
    } catch (error) {
      next(error);
    }
  },

  /** POST /menus - 创建菜单 */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const menu = await menuService.create(req.body, userId);
      res.status(201).json(successResponse(menu, '菜单创建成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /menus/:id - 更新菜单 */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const menu = await menuService.update(ensureString(req.params.id), req.body, userId);
      res.json(successResponse(menu, '菜单更新成功'));
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /menus/:id - 删除菜单（递归） */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      await menuService.delete(ensureString(req.params.id), userId);
      res.json(successResponse(null, '菜单删除成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /menus/reorder - 批量更新排序 */
  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const { items } = req.body; // [{ id, orderNum }]
      await menuService.reorder(items, userId);
      res.json(successResponse(null, '排序更新成功'));
    } catch (error) {
      next(error);
    }
  },
};
