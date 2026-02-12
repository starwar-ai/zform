import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import type { SysUser } from '@prisma/client';

interface CreateUserInput {
  username: string;
  password?: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  departmentId?: string;
  status?: string;
  roleIds?: string[];
}

interface UpdateUserInput {
  name?: string;
  password?: string;
  email?: string;
  phone?: string;
  department?: string;
  departmentId?: string | null;
  status?: string;
}

/** 排除密码字段的用户信息 */
type SafeUser = Omit<SysUser, 'password'> & { roleIds: string[] };

export class UserService {
  /** 创建用户 */
  async create(data: CreateUserInput, userId: string): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);

    const user = await prisma.sysUser.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        departmentId: data.departmentId || null,
        status: data.status ?? 'active',
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // 分配角色
    if (data.roleIds && data.roleIds.length > 0) {
      await prisma.sysUserRole.createMany({
        data: data.roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
        })),
      });
    }

    return this.toSafeUser(user, data.roleIds || []);
  }

  /** 更新用户 */
  async update(id: string, data: UpdateUserInput, userId: string): Promise<SafeUser> {
    const updateData: any = {
      ...data,
      updatedBy: userId,
    };

    // 如果更新了密码，加密
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
    }

    const user = await prisma.sysUser.update({
      where: { id },
      data: updateData,
    });

    const roleIds = await this.getUserRoleIds(id);
    return this.toSafeUser(user, roleIds);
  }

  /** 软删除用户 */
  async delete(id: string, userId: string): Promise<void> {
    await prisma.sysUser.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    // 删除用户-角色关联
    await prisma.sysUserRole.deleteMany({
      where: { userId: id },
    });
  }

  /** 获取用户列表 */
  async findAll(): Promise<SafeUser[]> {
    const users = await prisma.sysUser.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        userRoles: {
          select: { roleId: true },
        },
      },
    });

    return users.map((user) => {
      const roleIds = user.userRoles.map((ur) => ur.roleId);
      const { userRoles, password, ...rest } = user;
      return { ...rest, roleIds };
    });
  }

  /** 获取用户详情 */
  async findById(id: string): Promise<SafeUser | null> {
    const user = await prisma.sysUser.findFirst({
      where: { id, deletedAt: null },
      include: {
        userRoles: {
          select: { roleId: true },
        },
      },
    });

    if (!user) return null;

    const roleIds = user.userRoles.map((ur) => ur.roleId);
    const { userRoles, password, ...rest } = user;
    return { ...rest, roleIds };
  }

  /** 分配角色 */
  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    // 先删除旧的关联
    await prisma.sysUserRole.deleteMany({
      where: { userId },
    });

    // 创建新的关联
    if (roleIds.length > 0) {
      await prisma.sysUserRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
        })),
      });
    }
  }

  /** 登录验证 */
  async login(username: string, password: string): Promise<SafeUser> {
    const user = await prisma.sysUser.findFirst({
      where: { username, deletedAt: null },
      include: {
        userRoles: {
          select: { roleId: true },
        },
      },
    });

    if (!user) {
      throw new Error('用户名不存在');
    }

    if (user.status !== 'active') {
      throw new Error('用户已被停用');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('密码错误');
    }

    const roleIds = user.userRoles.map((ur) => ur.roleId);
    const { userRoles, password: _, ...rest } = user;
    return { ...rest, roleIds };
  }

  /** 获取用户所有权限标识 (userId -> roles -> menus -> permission) */
  async getPermissions(userId: string): Promise<string[]> {
    const roleMenus = await prisma.sysRoleMenu.findMany({
      where: {
        role: {
          userRoles: { some: { userId } },
          status: 'active',
        },
      },
      include: {
        menu: {
          select: { permission: true, status: true },
        },
      },
    });

    const permissions = roleMenus
      .filter((rm) => rm.menu.status === 'visible' && rm.menu.permission)
      .map((rm) => rm.menu.permission!);

    return [...new Set(permissions)];
  }

  /** 修改密码 */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.sysUser.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('当前密码错误');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.sysUser.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /** 获取用户角色 ID 列表 */
  private async getUserRoleIds(userId: string): Promise<string[]> {
    const userRoles = await prisma.sysUserRole.findMany({
      where: { userId },
      select: { roleId: true },
    });
    return userRoles.map((ur) => ur.roleId);
  }

  /** 转换为安全用户对象（不含密码） */
  private toSafeUser(user: SysUser, roleIds: string[]): SafeUser {
    const { password, ...rest } = user;
    return { ...rest, roleIds };
  }
}
