import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller';

const router = Router();

// GET /employees - 获取员工列表(排除系统管理员)
router.get('/', employeeController.list);

// GET /employees/:id - 获取员工详情
router.get('/:id', employeeController.getById);

// POST /employees - 创建员工
router.post('/', employeeController.create);

// PUT /employees/:id - 更新员工
router.put('/:id', employeeController.update);

// DELETE /employees/:id - 删除员工
router.delete('/:id', employeeController.delete);

// PUT /employees/:id/roles - 分配角色
router.put('/:id/roles', employeeController.assignRoles);

export default router;
