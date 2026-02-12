import { Router } from 'express';
import { userController } from '../controllers/user.controller';

const router = Router();

// 登录路由和 /me 路由放在参数路由之前
router.post('/login', userController.login);
router.get('/me/permissions', userController.getMyPermissions);

router.get('/', userController.list);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.put('/:id/password', userController.changePassword);
router.delete('/:id', userController.delete);
router.put('/:id/roles', userController.assignRoles);

export default router;
