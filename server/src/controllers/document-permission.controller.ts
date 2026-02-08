/**
 * DocumentPermissionController
 *
 * 文档级权限管理 REST API 控制器
 */

import { Request, Response, NextFunction } from 'express';
import { DocumentPermissionService } from '../services/document-permission.service';
import { successResponse } from '../utils/response';

const docPermService = new DocumentPermissionService();

/** 安全获取路由参数 */
function param(req: Request, name: string): string {
  const v = req.params[name];
  return String(v || '');
}

/** 从请求头获取当前用户 ID */
function getCurrentUserId(req: Request): string {
  return (req.headers['x-user-id'] as string) || '';
}

export const documentPermissionController = {
  /**
   * GET /document-permissions/:docType/:docId
   * 获取文档权限列表
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const docType = param(req, 'docType');
      const docId = param(req, 'docId');
      const permissions = await docPermService.list(docType, docId);
      res.json(successResponse(permissions));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /document-permissions/:docType/:docId
   * 添加或更新权限
   * Body: { userId, userName, permission }
   */
  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const docType = param(req, 'docType');
      const docId = param(req, 'docId');
      const currentUserId = getCurrentUserId(req);

      // 校验所有者权限
      const isOwner = await docPermService.checkOwnership(docType, docId, currentUserId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: '仅文档所有者可以管理权限',
        });
      }

      const { userId, userName, permission } = req.body;

      if (!userId || !userName || !permission) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数: userId, userName, permission',
        });
      }

      if (!['read', 'write'].includes(permission)) {
        return res.status(400).json({
          success: false,
          message: 'permission 必须为 "read" 或 "write"',
        });
      }

      const result = await docPermService.upsert(docType, docId, userId, userName, permission);
      res.json(successResponse(result, '权限设置成功'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /document-permissions/:docType/:docId/:userId
   * 删除某用户的权限
   */
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const docType = param(req, 'docType');
      const docId = param(req, 'docId');
      const userId = param(req, 'userId');
      const currentUserId = getCurrentUserId(req);

      // 校验所有者权限
      const isOwner = await docPermService.checkOwnership(docType, docId, currentUserId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: '仅文档所有者可以管理权限',
        });
      }

      await docPermService.remove(docType, docId, userId);
      res.json(successResponse(null, '权限已删除'));
    } catch (error) {
      next(error);
    }
  },
};
