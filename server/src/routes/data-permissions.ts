/**
 * Data Permission Routes
 *
 * 数据权限管理 API 路由
 */

import { Router } from 'express';
import { dataPermissionController } from '../controllers/data-permission.controller';

const router = Router();

// 获取角色的数据权限
router.get('/role/:roleId', dataPermissionController.getByRoleId);
// 批量保存角色的数据权限
router.put('/role/:roleId', dataPermissionController.saveForRole);
// 删除单条数据权限
router.delete('/:id', dataPermissionController.delete);

export default router;
