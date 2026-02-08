import { Router } from 'express';
import { menuController } from '../controllers/menu.controller';

const router = Router();

// 注意：有具体路径的路由要放在参数路由之前
router.get('/tree', menuController.tree);
router.get('/user-menus', menuController.userMenus);
router.put('/reorder', menuController.reorder);

router.get('/', menuController.list);
router.post('/', menuController.create);
router.put('/:id', menuController.update);
router.delete('/:id', menuController.delete);

export default router;
