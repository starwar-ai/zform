/**
 * DataPermissionService
 *
 * 数据权限管理服务。
 * 核心能力：
 *   1. CRUD 管理角色-单据类型的数据权限配置
 *   2. 计算用户的有效数据权限（多角色取最高级别，特殊授权取合并集）
 *   3. 生成 Prisma where 条件，供 DocumentService.list() 使用
 */

import prisma from '../config/database';
import { DepartmentService } from './department.service';
import type { SysDataPermission } from '@prisma/client';

/** 数据权限级别 */
export type DataPermissionLevel = 'all' | 'department' | 'personal';

/** 数据权限级别优先级 (数值越大权限越大) */
const LEVEL_PRIORITY: Record<DataPermissionLevel, number> = {
  personal: 1,
  department: 2,
  all: 3,
};

/** 有效数据权限 */
export interface EffectiveDataPermission {
  level: DataPermissionLevel;
  /** 特殊授权的部门 ID 合并集 */
  extraDepartmentIds: string[];
  /** 特殊授权的用户 ID 合并集 */
  extraUserIds: string[];
}

/** 保存数据权限的输入 */
export interface SaveDataPermissionInput {
  typeId: string;
  level: DataPermissionLevel;
  extraDepartmentIds?: string[];
  extraUserIds?: string[];
}

const departmentService = new DepartmentService();

export class DataPermissionService {
  /**
   * 获取角色的所有数据权限配置
   */
  async getByRoleId(roleId: string): Promise<SysDataPermission[]> {
    return prisma.sysDataPermission.findMany({
      where: { roleId },
      orderBy: { typeId: 'asc' },
    });
  }

  /**
   * 批量保存角色的数据权限（全量覆盖）
   */
  async saveForRole(roleId: string, permissions: SaveDataPermissionInput[]): Promise<SysDataPermission[]> {
    // 先删除旧的
    await prisma.sysDataPermission.deleteMany({
      where: { roleId },
    });

    // 创建新的
    if (permissions.length === 0) return [];

    const created = await Promise.all(
      permissions.map((p) =>
        prisma.sysDataPermission.create({
          data: {
            roleId,
            typeId: p.typeId,
            level: p.level,
            extraDepartmentIds: p.extraDepartmentIds ?? [],
            extraUserIds: p.extraUserIds ?? [],
          },
        })
      )
    );

    return created;
  }

  /**
   * 单条 upsert
   */
  async upsert(
    roleId: string,
    typeId: string,
    level: DataPermissionLevel,
    extraDepartmentIds?: string[],
    extraUserIds?: string[]
  ): Promise<SysDataPermission> {
    return prisma.sysDataPermission.upsert({
      where: { roleId_typeId: { roleId, typeId } },
      create: {
        roleId,
        typeId,
        level,
        extraDepartmentIds: extraDepartmentIds ?? [],
        extraUserIds: extraUserIds ?? [],
      },
      update: {
        level,
        extraDepartmentIds: extraDepartmentIds ?? [],
        extraUserIds: extraUserIds ?? [],
      },
    });
  }

  /**
   * 删除单条数据权限
   */
  async delete(id: string): Promise<void> {
    await prisma.sysDataPermission.delete({ where: { id } });
  }

  /**
   * 计算用户的有效数据权限
   *
   * 规则：
   *   1. 先查精确匹配的 typeId，再查通配符 "*"
   *   2. 多角色取最高级别 (all > department > personal)
   *   3. 特殊授权取合并集
   *   4. 未配置任何权限时默认为 personal
   */
  async getEffectivePermission(
    roleIds: string[],
    typeId: string
  ): Promise<EffectiveDataPermission> {
    if (roleIds.length === 0) {
      return { level: 'personal', extraDepartmentIds: [], extraUserIds: [] };
    }

    // 查询所有匹配的权限配置（精确 typeId + 通配符 "*"）
    const permissions = await prisma.sysDataPermission.findMany({
      where: {
        roleId: { in: roleIds },
        typeId: { in: [typeId, '*'] },
      },
    });

    if (permissions.length === 0) {
      return { level: 'personal', extraDepartmentIds: [], extraUserIds: [] };
    }

    // 合并：取最高级别，特殊授权取并集
    let maxLevel: DataPermissionLevel = 'personal';
    const extraDeptIds = new Set<string>();
    const extraUserIds = new Set<string>();

    for (const perm of permissions) {
      const level = perm.level as DataPermissionLevel;
      if (LEVEL_PRIORITY[level] > LEVEL_PRIORITY[maxLevel]) {
        maxLevel = level;
      }

      // 合并特殊授权
      const deptIds = perm.extraDepartmentIds as string[] | null;
      if (deptIds && Array.isArray(deptIds)) {
        for (const id of deptIds) extraDeptIds.add(id);
      }

      const userIds = perm.extraUserIds as string[] | null;
      if (userIds && Array.isArray(userIds)) {
        for (const id of userIds) extraUserIds.add(id);
      }
    }

    return {
      level: maxLevel,
      extraDepartmentIds: [...extraDeptIds],
      extraUserIds: [...extraUserIds],
    };
  }

  /**
   * 生成数据权限的 Prisma where 条件
   *
   * @param userId      当前用户 ID
   * @param departmentId 当前用户的部门 ID
   * @param permission  有效数据权限
   * @returns Prisma where 条件对象（直接 merge 到查询 where 中）
   */
  async buildDataPermissionWhere(
    userId: string,
    departmentId: string | null,
    permission: EffectiveDataPermission
  ): Promise<Record<string, any>> {
    // level = all: 不添加额外条件
    if (permission.level === 'all') {
      // 但如果有特殊授权，all 已经涵盖了全部，无需额外条件
      return {};
    }

    const orConditions: Record<string, any>[] = [];

    if (permission.level === 'personal') {
      // 个人：只看自己创建的
      orConditions.push({ createdBy: userId });
    } else if (permission.level === 'department') {
      // 部门：看本部门及下属部门所有用户创建的
      if (departmentId) {
        const deptIds = await departmentService.getDepartmentAndSubIds(departmentId);

        // 加上特殊授权的部门
        const allDeptIds = [...new Set([...deptIds, ...permission.extraDepartmentIds])];

        // 查出这些部门下的所有用户
        const users = await prisma.sysUser.findMany({
          where: {
            departmentId: { in: allDeptIds },
            deletedAt: null,
          },
          select: { id: true },
        });
        const userIds = users.map((u) => u.id);

        // 加上特殊授权的用户
        const allUserIds = [...new Set([...userIds, ...permission.extraUserIds, userId])];

        orConditions.push({ createdBy: { in: allUserIds } });
      } else {
        // 用户未分配部门，只能看自己的
        const allUserIds = [...new Set([userId, ...permission.extraUserIds])];
        orConditions.push({ createdBy: { in: allUserIds } });
      }
    }

    // 附加特殊授权（personal 级别也需要）
    if (permission.level === 'personal') {
      // 特殊授权部门的所有用户
      if (permission.extraDepartmentIds.length > 0) {
        // 获取这些部门及其子部门
        const allExtraDeptIds: string[] = [];
        for (const deptId of permission.extraDepartmentIds) {
          const ids = await departmentService.getDepartmentAndSubIds(deptId);
          allExtraDeptIds.push(...ids);
        }

        if (allExtraDeptIds.length > 0) {
          const users = await prisma.sysUser.findMany({
            where: {
              departmentId: { in: [...new Set(allExtraDeptIds)] },
              deletedAt: null,
            },
            select: { id: true },
          });
          const extraUserIdsFromDept = users.map((u) => u.id);
          if (extraUserIdsFromDept.length > 0) {
            orConditions.push({ createdBy: { in: extraUserIdsFromDept } });
          }
        }
      }

      // 特殊授权的用户
      if (permission.extraUserIds.length > 0) {
        orConditions.push({ createdBy: { in: permission.extraUserIds } });
      }
    }

    if (orConditions.length === 0) {
      // 安全兜底：只看自己的
      return { createdBy: userId };
    }

    if (orConditions.length === 1) {
      return orConditions[0];
    }

    return { OR: orConditions };
  }
}
