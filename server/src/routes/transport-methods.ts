/**
 * 运输方式路由
 */

import { Router } from 'express';
import {
  getTransportMethods,
  createTransportMethod,
  updateTransportMethod,
  deleteTransportMethod
} from '../controllers/transport-method.controller';

const router = Router();

// 获取所有运输方式
router.get('/', getTransportMethods);

// 创建运输方式
router.post('/', createTransportMethod);

// 更新运输方式
router.put('/:id', updateTransportMethod);

// 删除运输方式
router.delete('/:id', deleteTransportMethod);

export default router;