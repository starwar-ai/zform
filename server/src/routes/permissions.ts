import { Router } from 'express';
import { permissionController } from '../controllers/permission.controller';

const router = Router();

// 具名路由放在参数路由前
router.get('/grouped', permissionController.grouped);
router.get('/user/current', permissionController.userCurrent);

router.get('/', permissionController.list);

export default router;
