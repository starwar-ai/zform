import prisma from '../config/database';
import type { SysRole } from '@prisma/client';

interface CreateRoleInput {
  code: string;
  name: string;
  description?: string;
  status?: string;
}

interface UpdateRoleInput {
  name?: string;
  description?: string;
  status?: string;
}

export class RoleService {
  /** 创建角色 */
  async create(data: CreateRoleInput, userId: string): Promise<SysRole> {
    return prisma.sysRole.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        status: data.status ?? 'active',
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  /** 更新角色 */
  async update(id: string, data: UpdateRoleInput, userId: string): Promise<SysRole> {
    return prisma.sysRole.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  /** 软删除角色 */
  async delete(id: string, userId: string): Promise<void> {
    // 检查是否有用户关联此角色
    const userCount = await prisma.sysUserRole.count({
      where: { roleId: id },
    });
    if (userCount > 0) {
      throw new Error(`该角色下还有 ${userCount} 个用户，无法删除`);
    }

    await prisma.sysRole.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    // 删除角色-菜单关联
    await prisma.sysRoleMenu.deleteMany({
      where: { roleId: id },
    });
  }

  /** 获取角色列表 */
  async findAll(): Promise<SysRole[]> {
    return prisma.sysRole.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** 获取角色详情 */
  async findById(id: string): Promise<SysRole | null> {
    return prisma.sysRole.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 分配菜单权限 */
  async assignMenus(roleId: string, menuIds: string[]): Promise<void> {
    // 先删除旧的关联
    await prisma.sysRoleMenu.deleteMany({
      where: { roleId },
    });

    // 创建新的关联
    if (menuIds.length > 0) {
      await prisma.sysRoleMenu.createMany({
        data: menuIds.map((menuId) => ({
          roleId,
          menuId,
        })),
      });
    }
  }

  /** 获取角色已分配的菜单 ID 列表 */
  async getRoleMenuIds(roleId: string): Promise<string[]> {
    const roleMenus = await prisma.sysRoleMenu.findMany({
      where: { roleId },
      select: { menuId: true },
    });
    return roleMenus.map((rm) => rm.menuId);
  }
}
