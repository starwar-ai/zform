/**
 * Department Routes
 *
 * 部门管理 API 路由
 */

import { Router } from 'express';
import { departmentController } from '../controllers/department.controller';

const router = Router();

// 部门树
router.get('/', departmentController.getTree);
// 扁平列表
router.get('/flat', departmentController.getAll);
// 单个部门
router.get('/:id', departmentController.getById);
// 创建
router.post('/', departmentController.create);
// 更新
router.put('/:id', departmentController.update);
// 删除
router.delete('/:id', departmentController.delete);

export default router;
