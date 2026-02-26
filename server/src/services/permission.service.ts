import prisma from '../config/database';

interface PermissionGroupWithPermissions {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  permissions: {
    id: string;
    code: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
  }[];
}

export class PermissionService {
  /** 获取全部权限列表 */
  async findAll() {
    return prisma.sysPermission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  /** 获取权限组 + 嵌套权限（按分类排序） */
  async findGrouped(search?: string): Promise<PermissionGroupWithPermissions[]> {
    const permissionWhere: any = {};
    if (search && search.trim()) {
      permissionWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }

    const groups = await prisma.sysPermissionGroup.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          where: permissionWhere,
          orderBy: { action: 'asc' },
        },
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    // 过滤掉没有权限的组（搜索时可能为空）
    return groups
      .filter((g) => g.permissions.length > 0)
      .map((g) => ({
        id: g.id,
        code: g.code,
        name: g.name,
        category: g.category,
        description: g.description,
        icon: g.icon,
        sortOrder: g.sortOrder,
        permissions: g.permissions.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          resource: p.resource,
          action: p.action,
          description: p.description,
        })),
      }));
  }

  /** 获取用户所有操作权限码 (userId -> roles -> rolePermissions -> permission.code) */
  async getUserPermissions(userId: string): Promise<string[]> {
    const rolePermissions = await prisma.sysRolePermission.findMany({
      where: {
        role: {
          userRoles: { some: { userId } },
          status: 'active',
          deletedAt: null,
        },
      },
      include: {
        permission: { select: { code: true } },
      },
    });

    const codes = rolePermissions.map((rp) => rp.permission.code);
    return [...new Set(codes)];
  }
}
