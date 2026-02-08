import prisma from '../config/database';
import type { SysMenu } from '@prisma/client';

interface CreateMenuInput {
  title: string;
  icon?: string;
  path?: string;
  parentId?: string | null;
  orderNum?: number;
  menuType?: string;
  permission?: string;
  status?: string;
}

interface UpdateMenuInput {
  title?: string;
  icon?: string;
  path?: string;
  parentId?: string | null;
  orderNum?: number;
  menuType?: string;
  permission?: string;
  status?: string;
}

interface MenuTreeNode extends SysMenu {
  children: MenuTreeNode[];
}

export class MenuService {
  /** 创建菜单 */
  async create(data: CreateMenuInput, userId: string): Promise<SysMenu> {
    // 自动计算 orderNum：同级菜单最大值 + 1
    if (data.orderNum === undefined || data.orderNum === null) {
      const maxOrder = await prisma.sysMenu.aggregate({
        _max: { orderNum: true },
        where: {
          parentId: data.parentId ?? null,
          deletedAt: null,
        },
      });
      data.orderNum = (maxOrder._max.orderNum ?? 0) + 1;
    }

    return prisma.sysMenu.create({
      data: {
        title: data.title,
        icon: data.icon,
        path: data.path,
        parentId: data.parentId ?? null,
        orderNum: data.orderNum,
        menuType: data.menuType ?? 'menu',
        permission: data.permission,
        status: data.status ?? 'visible',
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  /** 更新菜单 */
  async update(id: string, data: UpdateMenuInput, userId: string): Promise<SysMenu> {
    return prisma.sysMenu.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  /** 递归软删除菜单及所有子菜单 */
  async delete(id: string, userId: string): Promise<void> {
    const now = new Date();

    // 递归获取所有子菜单 ID
    const allIds = await this.getAllChildIds(id);
    allIds.push(id);

    // 批量软删除
    await prisma.sysMenu.updateMany({
      where: { id: { in: allIds } },
      data: {
        deletedAt: now,
        updatedBy: userId,
      },
    });

    // 同时删除关联的角色-菜单关系
    await prisma.sysRoleMenu.deleteMany({
      where: { menuId: { in: allIds } },
    });
  }

  /** 递归获取所有子菜单 ID */
  private async getAllChildIds(parentId: string): Promise<string[]> {
    const children = await prisma.sysMenu.findMany({
      where: { parentId, deletedAt: null },
      select: { id: true },
    });

    const ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      const grandChildIds = await this.getAllChildIds(child.id);
      ids.push(...grandChildIds);
    }
    return ids;
  }

  /** 获取全部菜单（扁平列表） */
  async findAll(): Promise<SysMenu[]> {
    return prisma.sysMenu.findMany({
      where: { deletedAt: null },
      orderBy: [{ orderNum: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** 获取菜单树 */
  async getTree(): Promise<MenuTreeNode[]> {
    const menus = await this.findAll();
    return this.buildTree(menus);
  }

  /** 批量更新排序 */
  async reorder(items: { id: string; orderNum: number }[], userId: string): Promise<void> {
    const updates = items.map((item) =>
      prisma.sysMenu.update({
        where: { id: item.id },
        data: { orderNum: item.orderNum, updatedBy: userId },
      })
    );
    await prisma.$transaction(updates);
  }

  /** 根据角色 ID 列表获取可见菜单（去重） */
  async getMenusByRoleIds(roleIds: string[]): Promise<MenuTreeNode[]> {
    if (roleIds.length === 0) return [];

    // 查询角色关联的菜单 ID
    const roleMenus = await prisma.sysRoleMenu.findMany({
      where: { roleId: { in: roleIds } },
      select: { menuId: true },
    });

    const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId))];
    if (menuIds.length === 0) return [];

    // 获取这些菜单（仅可见的）
    const menus = await prisma.sysMenu.findMany({
      where: {
        id: { in: menuIds },
        status: 'visible',
        deletedAt: null,
      },
      orderBy: [{ orderNum: 'asc' }, { createdAt: 'asc' }],
    });

    // 补全父菜单（确保树结构完整）
    const menuMap = new Map(menus.map((m) => [m.id, m]));
    const parentIdsToFetch = new Set<string>();

    for (const menu of menus) {
      let currentParentId = menu.parentId;
      while (currentParentId && !menuMap.has(currentParentId)) {
        parentIdsToFetch.add(currentParentId);
        // 查询父菜单获取它的 parentId
        const parent = await prisma.sysMenu.findFirst({
          where: { id: currentParentId, deletedAt: null },
        });
        if (parent) {
          menuMap.set(parent.id, parent);
          currentParentId = parent.parentId;
        } else {
          break;
        }
      }
    }

    return this.buildTree(Array.from(menuMap.values()));
  }

  /** 构建菜单树 */
  private buildTree(menus: SysMenu[], parentId: string | null = null): MenuTreeNode[] {
    return menus
      .filter((menu) => menu.parentId === parentId)
      .sort((a, b) => a.orderNum - b.orderNum)
      .map((menu) => ({
        ...menu,
        children: this.buildTree(menus, menu.id),
      }));
  }
}
