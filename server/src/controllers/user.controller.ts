import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { successResponse } from '../utils/response';

const userService = new UserService();

function getUserId(req: Request): string {
  const raw = req.headers['x-user-id'];
  if (Array.isArray(raw)) return raw[0] || 'system';
  return (raw as string) || 'system';
}

export const userController = {
  /** GET /users - 获取用户列表 */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.findAll();
      res.json(successResponse(users));
    } catch (error) {
      next(error);
    }
  },

  /** POST /users - 创建用户 */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const user = await userService.create(req.body, userId);
      res.status(201).json(successResponse(user, '用户创建成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /users/:id - 更新用户 */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const user = await userService.update(req.params.id, req.body, userId);
      res.json(successResponse(user, '用户更新成功'));
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /users/:id - 删除用户 */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      await userService.delete(req.params.id, userId);
      res.json(successResponse(null, '用户删除成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /users/:id/roles - 分配角色 */
  async assignRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { roleIds } = req.body; // string[]
      await userService.assignRoles(req.params.id, roleIds);
      res.json(successResponse(null, '角色分配成功'));
    } catch (error) {
      next(error);
    }
  },

  /** GET /users/me/permissions - 获取当前用户权限标识列表 */
  async getMyPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      if (userId === 'system') {
        return res.status(401).json({
          success: false,
          message: '未登录',
          timestamp: new Date().toISOString(),
        });
      }
      const permissions = await userService.getPermissions(userId);
      res.json(successResponse(permissions));
    } catch (error) {
      next(error);
    }
  },

  /** POST /users/login - 登录 */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const user = await userService.login(username, password);
      res.json(successResponse(user, '登录成功'));
    } catch (error) {
      // 登录失败返回 401
      if (error instanceof Error) {
        return res.status(401).json({
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
      next(error);
    }
  },
};
