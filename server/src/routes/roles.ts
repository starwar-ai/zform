import { Router } from 'express';
import { roleController } from '../controllers/role.controller';

const router = Router();

router.get('/', roleController.list);
router.post('/', roleController.create);
router.put('/:id', roleController.update);
router.delete('/:id', roleController.delete);
router.get('/:id/menus', roleController.getMenus);
router.put('/:id/menus', roleController.assignMenus);
router.get('/:id/permissions', roleController.getPermissions);
router.put('/:id/permissions', roleController.assignPermissions);

export default router;
