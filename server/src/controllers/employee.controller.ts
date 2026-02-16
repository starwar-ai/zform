import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service';
import { successResponse } from '../utils/response';
import { ensureString } from '../utils/request';

const employeeService = new EmployeeService();

function getUserId(req: Request): string {
  const raw = req.headers['x-user-id'];
  if (Array.isArray(raw)) return raw[0] || 'system';
  return (raw as string) || 'system';
}

export const employeeController = {
  /** GET /employees - 获取员工列表(排除系统管理员) */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        status,
        search,
        departmentId,
        page,
        pageSize,
      } = req.query as {
        status?: string;
        search?: string;
        departmentId?: string;
        page?: string;
        pageSize?: string;
      };

      const result = await employeeService.findAll({
        status: status as 'active' | 'inactive' | undefined,
        search,
        departmentId,
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      });

      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  },

  /** GET /employees/:id - 获取员工详情 */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.findById(ensureString(req.params.id));
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: '员工不存在',
          timestamp: new Date().toISOString(),
        });
      }
      res.json(successResponse(employee));
    } catch (error) {
      next(error);
    }
  },

  /** POST /employees - 创建员工 */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const employee = await employeeService.create(req.body, userId);
      res.status(201).json(successResponse(employee, '员工创建成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /employees/:id - 更新员工 */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const employee = await employeeService.update(ensureString(req.params.id), req.body, userId);
      res.json(successResponse(employee, '员工更新成功'));
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /employees/:id - 删除员工 */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      await employeeService.delete(ensureString(req.params.id), userId);
      res.json(successResponse(null, '员工删除成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /employees/:id/roles - 分配角色 */
  async assignRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { roleIds } = req.body;
      await employeeService.assignRoles(ensureString(req.params.id), roleIds);
      res.json(successResponse(null, '角色分配成功'));
    } catch (error) {
      next(error);
    }
  },
};
