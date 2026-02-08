/**
 * 统一单据 API —— 路由
 *
 * 所有单据类型共用这一套路由，通过 :typeId 区分。
 *
 * 路由结构:
 *   GET    /documents/types                       - 获取所有已注册类型
 *   GET    /documents/:typeId/list                - 列表查询 (含筛选/排序/聚合)
 *   POST   /documents/:typeId                     - 新建
 *   GET    /documents/:typeId/:id                 - 详情
 *   PUT    /documents/:typeId/:id                 - 更新
 *   DELETE /documents/:typeId/:id                 - 删除
 *   GET    /documents/:typeId/:id/items           - 获取明细行
 *   POST   /documents/:typeId/:id/items           - 添加明细行
 *   PUT    /documents/:typeId/:id/items/:itemId   - 更新明细行
 *   DELETE /documents/:typeId/:id/items/:itemId   - 删除明细行
 *   POST   /documents/:typeId/:id/actions/:action - 执行自定义操作
 */

import { Router } from 'express';
import { documentController } from './document.controller';

const router = Router();

// 元数据
router.get('/types', documentController.listTypes);

// 列表
router.get('/:typeId/list', documentController.list);

// CRUD
router.post('/:typeId', documentController.create);
router.get('/:typeId/:id', documentController.getById);
router.put('/:typeId/:id', documentController.update);
router.delete('/:typeId/:id', documentController.delete);

// 明细行
router.get('/:typeId/:id/items', documentController.getItems);
router.post('/:typeId/:id/items', documentController.addItem);
router.put('/:typeId/:id/items/:itemId', documentController.updateItem);
router.delete('/:typeId/:id/items/:itemId', documentController.deleteItem);

// 自定义操作
router.post('/:typeId/:id/actions/:action', documentController.executeAction);

export default router;
