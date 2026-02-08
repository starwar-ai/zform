/**
 * Document Permission Routes
 *
 * 文档级权限管理 API 路由
 */

import { Router } from 'express';
import { documentPermissionController } from '../controllers/document-permission.controller';

const router = Router();

// 获取文档权限列表
router.get('/:docType/:docId', documentPermissionController.list);
// 添加或更新权限
router.post('/:docType/:docId', documentPermissionController.upsert);
// 删除某用户的权限
router.delete('/:docType/:docId/:userId', documentPermissionController.remove);

export default router;
