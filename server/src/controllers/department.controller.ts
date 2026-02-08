/**
 * DepartmentController
 *
 * 部门管理 REST API 控制器
 */

import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/department.service';
import { successResponse } from '../utils/response';

const departmentService = new DepartmentService();

/** 安全获取路由参数 */
function param(req: Request, name: string): string {
  const v = req.params[name];
  return String(v || '');
}

export const departmentController = {
  /** GET /departments - 获取部门树 */
  async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await departmentService.getTree();
      res.json(successResponse(tree));
    } catch (error) {
      next(error);
    }
  },

  /** GET /departments/flat - 获取部门扁平列表 */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await departmentService.findAll();
      res.json(successResponse(departments));
    } catch (error) {
      next(error);
    }
  },

  /** GET /departments/:id - 获取单个部门 */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const dept = await departmentService.findById(param(req, 'id'));
      if (!dept) {
        return res.status(404).json({ success: false, message: '部门不存在' });
      }
      res.json(successResponse(dept));
    } catch (error) {
      next(error);
    }
  },

  /** POST /departments - 创建部门 */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dept = await departmentService.create(req.body);
      res.status(201).json(successResponse(dept, '部门创建成功'));
    } catch (error) {
      next(error);
    }
  },

  /** PUT /departments/:id - 更新部门 */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dept = await departmentService.update(param(req, 'id'), req.body);
      res.json(successResponse(dept, '部门更新成功'));
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /departments/:id - 删除部门 */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await departmentService.delete(param(req, 'id'));
      res.json(successResponse(null, '部门删除成功'));
    } catch (error) {
      next(error);
    }
  },
};
