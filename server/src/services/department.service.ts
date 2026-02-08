/**
 * DepartmentService
 *
 * 部门管理服务，支持树形层级结构。
 */

import prisma from '../config/database';
import type { Department } from '@prisma/client';

interface CreateDepartmentInput {
  code: string;
  name: string;
  parentId?: string | null;
  orderNum?: number;
}

interface UpdateDepartmentInput {
  code?: string;
  name?: string;
  parentId?: string | null;
  orderNum?: number;
}

/** 部门树节点 */
export interface DepartmentTreeNode {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  orderNum: number;
  createdAt: Date;
  updatedAt: Date;
  children: DepartmentTreeNode[];
}

export class DepartmentService {
  /** 获取所有部门（扁平列表） */
  async findAll(): Promise<Department[]> {
    return prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: [{ orderNum: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** 获取部门树 */
  async getTree(): Promise<DepartmentTreeNode[]> {
    const departments = await this.findAll();
    return this.buildTree(departments);
  }

  /** 获取单个部门 */
  async findById(id: string): Promise<Department | null> {
    return prisma.department.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 创建部门 */
  async create(data: CreateDepartmentInput): Promise<Department> {
    // 检查编码唯一性
    const existing = await prisma.department.findFirst({
      where: { code: data.code, deletedAt: null },
    });
    if (existing) {
      throw new Error(`部门编码 "${data.code}" 已存在`);
    }

    return prisma.department.create({
      data: {
        code: data.code,
        name: data.name,
        parentId: data.parentId || null,
        orderNum: data.orderNum ?? 0,
      },
    });
  }

  /** 更新部门 */
  async update(id: string, data: UpdateDepartmentInput): Promise<Department> {
    // 检查编码唯一性（排除自身）
    if (data.code) {
      const existing = await prisma.department.findFirst({
        where: { code: data.code, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new Error(`部门编码 "${data.code}" 已存在`);
      }
    }

    // 防止设置自身为父部门
    if (data.parentId === id) {
      throw new Error('不能将部门设置为自身的子部门');
    }

    // 防止循环引用：检查新父部门不是当前部门的后代
    if (data.parentId) {
      const subIds = await this.getSubDepartmentIds(id);
      if (subIds.includes(data.parentId)) {
        throw new Error('不能将部门移动到自身的子部门下');
      }
    }

    return prisma.department.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.orderNum !== undefined && { orderNum: data.orderNum }),
      },
    });
  }

  /** 软删除部门 */
  async delete(id: string): Promise<void> {
    // 检查是否有子部门
    const childCount = await prisma.department.count({
      where: { parentId: id, deletedAt: null },
    });
    if (childCount > 0) {
      throw new Error(`该部门下还有 ${childCount} 个子部门，无法删除`);
    }

    // 检查是否有用户关联
    const userCount = await prisma.sysUser.count({
      where: { departmentId: id, deletedAt: null },
    });
    if (userCount > 0) {
      throw new Error(`该部门下还有 ${userCount} 个用户，无法删除`);
    }

    await prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * 递归获取所有下属部门 ID（不含自身）
   */
  async getSubDepartmentIds(departmentId: string): Promise<string[]> {
    const allDepts = await prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true, parentId: true },
    });

    const result: string[] = [];
    const collect = (parentId: string) => {
      for (const dept of allDepts) {
        if (dept.parentId === parentId) {
          result.push(dept.id);
          collect(dept.id);
        }
      }
    };
    collect(departmentId);
    return result;
  }

  /**
   * 获取部门及其所有下属部门 ID（含自身）
   */
  async getDepartmentAndSubIds(departmentId: string): Promise<string[]> {
    const subIds = await this.getSubDepartmentIds(departmentId);
    return [departmentId, ...subIds];
  }

  /** 将扁平列表构建为树 */
  private buildTree(departments: Department[]): DepartmentTreeNode[] {
    const map = new Map<string, DepartmentTreeNode>();

    // 创建所有节点
    for (const dept of departments) {
      map.set(dept.id, {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        parentId: dept.parentId,
        orderNum: (dept as any).orderNum ?? 0,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt,
        children: [],
      });
    }

    // 构建父子关系
    const roots: DepartmentTreeNode[] = [];
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
