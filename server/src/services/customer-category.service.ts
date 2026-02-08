/**
 * CustomerCategoryService
 *
 * 客户分类管理服务，支持树形层级结构。
 */

import prisma from '../config/database';
import type { CustomerCategory } from '@prisma/client';

export interface CreateCustomerCategoryInput {
  code: string;
  name: string;
  parentId?: string | null;
}

export interface UpdateCustomerCategoryInput {
  code?: string;
  name?: string;
  parentId?: string | null;
}

/** 客户分类树节点 */
export interface CustomerCategoryTreeNode {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date;
  children: CustomerCategoryTreeNode[];
}

export class CustomerCategoryService {
  /** 获取所有客户分类（扁平列表） */
  async findAll(): Promise<CustomerCategory[]> {
    return prisma.customerCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'asc' }],
    });
  }

  /** 获取客户分类树 */
  async getTree(): Promise<CustomerCategoryTreeNode[]> {
    const categories = await this.findAll();
    return this.buildTree(categories);
  }

  /** 获取单个客户分类 */
  async findById(id: string): Promise<CustomerCategory | null> {
    return prisma.customerCategory.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 创建客户分类 */
  async create(data: CreateCustomerCategoryInput, userId?: string): Promise<CustomerCategory> {
    // 检查编码唯一性
    const existing = await prisma.customerCategory.findFirst({
      where: { code: data.code, deletedAt: null },
    });
    if (existing) {
      throw new Error(`客户分类编码 "${data.code}" 已存在`);
    }

    return prisma.customerCategory.create({
      data: {
        code: data.code,
        name: data.name,
        parentId: data.parentId || null,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新客户分类 */
  async update(id: string, data: UpdateCustomerCategoryInput, userId?: string): Promise<CustomerCategory> {
    // 检查编码唯一性（排除自身）
    if (data.code) {
      const existing = await prisma.customerCategory.findFirst({
        where: { code: data.code, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new Error(`客户分类编码 "${data.code}" 已存在`);
      }
    }

    // 防止设置自身为父节点
    if (data.parentId === id) {
      throw new Error('不能将分类设置为自身的子分类');
    }

    // 防止循环引用
    if (data.parentId) {
      const subIds = await this.getSubCategoryIds(id);
      if (subIds.includes(data.parentId)) {
        throw new Error('不能将分类移动到自身的子分类下');
      }
    }

    return prisma.customerCategory.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除客户分类 */
  async delete(id: string): Promise<void> {
    // 检查是否有子分类
    const childCount = await prisma.customerCategory.count({
      where: { parentId: id, deletedAt: null },
    });
    if (childCount > 0) {
      throw new Error(`该分类下还有 ${childCount} 个子分类，无法删除`);
    }

    await prisma.customerCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** 递归获取所有子分类 ID */
  private async getSubCategoryIds(categoryId: string): Promise<string[]> {
    const all = await prisma.customerCategory.findMany({
      where: { deletedAt: null },
      select: { id: true, parentId: true },
    });

    const result: string[] = [];
    const collect = (parentId: string) => {
      for (const item of all) {
        if (item.parentId === parentId) {
          result.push(item.id);
          collect(item.id);
        }
      }
    };
    collect(categoryId);
    return result;
  }

  /** 将扁平列表构建为树 */
  private buildTree(categories: CustomerCategory[]): CustomerCategoryTreeNode[] {
    const map = new Map<string, CustomerCategoryTreeNode>();

    for (const cat of categories) {
      map.set(cat.id, {
        id: cat.id,
        code: cat.code,
        name: cat.name,
        parentId: cat.parentId,
        createdBy: cat.createdBy,
        createdAt: cat.createdAt,
        updatedBy: cat.updatedBy,
        updatedAt: cat.updatedAt,
        children: [],
      });
    }

    const roots: CustomerCategoryTreeNode[] = [];
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
