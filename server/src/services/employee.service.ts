import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import type { SysUser } from '@prisma/client';

interface CreateEmployeeInput {
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

interface UpdateEmployeeInput {
  name?: string;
  password?: string;
  email?: string;
  phone?: string;
  department?: string;
  departmentId?: string | null;
  status?: string;
}

interface ListQueryParams {
  status?: 'active' | 'inactive';
  search?: string;
  departmentId?: string;
  page?: number;
  pageSize?: number;
}

/** 排除密码字段的员工信息 */
type SafeEmployee = Omit<SysUser, 'password'> & { roleIds: string[] };

/** 分页结果 */
interface PaginatedResult<T> {
  records: T[];
  total: number;
  page: number;
  pageSize: number;
}

export class EmployeeService {
  /** 创建员工 */
  async create(data: CreateEmployeeInput, userId: string): Promise<SafeEmployee> {
    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);

    const employee = await prisma.sysUser.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        departmentId: data.departmentId || null,
        status: data.status ?? 'active',
        isAdmin: false, // 员工默认不是管理员
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // 分配角色
    if (data.roleIds && data.roleIds.length > 0) {
      await prisma.sysUserRole.createMany({
        data: data.roleIds.map((roleId) => ({
          userId: employee.id,
          roleId,
        })),
      });
    }

    return this.toSafeEmployee(employee, data.roleIds || []);
  }

  /** 更新员工 */
  async update(id: string, data: UpdateEmployeeInput, userId: string): Promise<SafeEmployee> {
    // 先检查是否是员工(非管理员)
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('员工不存在');
    }
    if (existing.isAdmin) {
      throw new Error('无法更新系统管理员');
    }

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

    const employee = await prisma.sysUser.update({
      where: { id },
      data: updateData,
    });

    const roleIds = await this.getEmployeeRoleIds(id);
    return this.toSafeEmployee(employee, roleIds);
  }

  /** 软删除员工 */
  async delete(id: string, userId: string): Promise<void> {
    // 先检查是否是员工(非管理员)
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('员工不存在');
    }
    if (existing.isAdmin) {
      throw new Error('无法删除系统管理员');
    }

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

  /** 获取员工列表(排除系统管理员) */
  async findAll(params: ListQueryParams = {}): Promise<PaginatedResult<SafeEmployee>> {
    const {
      status,
      search,
      departmentId,
      page = 1,
      pageSize = 20,
    } = params;

    // 构建查询条件 - 排除管理员和已删除的
    const where: any = {
      isAdmin: false,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 获取总数
    const total = await prisma.sysUser.count({ where });

    // 获取分页数据
    const employees = await prisma.sysUser.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        userRoles: {
          select: { roleId: true },
        },
      },
    });

    const records = employees.map((employee) => {
      const roleIds = employee.userRoles.map((ur) => ur.roleId);
      const { userRoles, password, ...rest } = employee;
      return { ...rest, roleIds };
    });

    return {
      records,
      total,
      page,
      pageSize,
    };
  }

  /** 获取员工详情 */
  async findById(id: string): Promise<SafeEmployee | null> {
    const employee = await prisma.sysUser.findFirst({
      where: { id, deletedAt: null },
      include: {
        userRoles: {
          select: { roleId: true },
        },
      },
    });

    if (!employee) return null;

    const roleIds = employee.userRoles.map((ur) => ur.roleId);
    const { userRoles, password, ...rest } = employee;
    return { ...rest, roleIds };
  }

  /** 分配角色 */
  async assignRoles(employeeId: string, roleIds: string[]): Promise<void> {
    // 先检查是否是员工(非管理员)
    const existing = await this.findById(employeeId);
    if (!existing) {
      throw new Error('员工不存在');
    }
    if (existing.isAdmin) {
      throw new Error('无法为系统管理员分配角色');
    }

    // 先删除旧的关联
    await prisma.sysUserRole.deleteMany({
      where: { userId: employeeId },
    });

    // 创建新的关联
    if (roleIds.length > 0) {
      await prisma.sysUserRole.createMany({
        data: roleIds.map((roleId) => ({
          userId: employeeId,
          roleId,
        })),
      });
    }
  }

  /** 获取员工角色 ID 列表 */
  private async getEmployeeRoleIds(employeeId: string): Promise<string[]> {
    const userRoles = await prisma.sysUserRole.findMany({
      where: { userId: employeeId },
      select: { roleId: true },
    });
    return userRoles.map((ur) => ur.roleId);
  }

  /** 转换为安全员工对象（不含密码） */
  private toSafeEmployee(employee: SysUser, roleIds: string[]): SafeEmployee {
    const { password, ...rest } = employee;
    return { ...rest, roleIds };
  }
}
