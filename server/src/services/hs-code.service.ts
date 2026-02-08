/**
 * HsCodeService
 *
 * 产品分类（海关编码）管理服务，支持树形层级结构。
 */

import prisma from '../config/database';
import type { HsCode } from '@prisma/client';

export interface CreateHsCodeInput {
  code: string;
  name: string;
  hsCode: string;
  categoryCode?: string | null;
  parentId?: string | null;
  type?: string | null;
  level?: number;
  serialLength?: number;
}

export interface UpdateHsCodeInput {
  code?: string;
  name?: string;
  hsCode?: string;
  categoryCode?: string | null;
  parentId?: string | null;
  type?: string | null;
  level?: number;
  serialLength?: number;
}

/** 产品分类树节点 */
export interface HsCodeTreeNode {
  id: string;
  code: string;
  name: string;
  hsCode: string;
  categoryCode: string | null;
  parentId: string | null;
  type: string | null;
  level: number;
  serialLength: number;
  createdBy: string | null;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date;
  children: HsCodeTreeNode[];
}

export class HsCodeService {
  /** 获取所有产品分类（扁平列表） */
  async findAll(): Promise<HsCode[]> {
    return prisma.hsCode.findMany({
      where: { deletedAt: null },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });
  }

  /** 获取产品分类树 */
  async getTree(): Promise<HsCodeTreeNode[]> {
    const items = await this.findAll();
    return this.buildTree(items);
  }

  /** 获取单个产品分类 */
  async findById(id: string): Promise<HsCode | null> {
    return prisma.hsCode.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 创建产品分类 */
  async create(data: CreateHsCodeInput, userId?: string): Promise<HsCode> {
    // 检查编码唯一性
    const existing = await prisma.hsCode.findFirst({
      where: { code: data.code, deletedAt: null },
    });
    if (existing) {
      throw new Error(`海关编码编号 "${data.code}" 已存在`);
    }

    return prisma.hsCode.create({
      data: {
        code: data.code,
        name: data.name,
        hsCode: data.hsCode,
        categoryCode: data.categoryCode || null,
        parentId: data.parentId || null,
        type: data.type || null,
        level: data.level ?? 1,
        serialLength: data.serialLength ?? 6,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新产品分类 */
  async update(id: string, data: UpdateHsCodeInput, userId?: string): Promise<HsCode> {
    if (data.code) {
      const existing = await prisma.hsCode.findFirst({
        where: { code: data.code, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new Error(`海关编码编号 "${data.code}" 已存在`);
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

    return prisma.hsCode.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.hsCode !== undefined && { hsCode: data.hsCode }),
        ...(data.categoryCode !== undefined && { categoryCode: data.categoryCode }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.level !== undefined && { level: data.level }),
        ...(data.serialLength !== undefined && { serialLength: data.serialLength }),
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除产品分类 */
  async delete(id: string): Promise<void> {
    const childCount = await prisma.hsCode.count({
      where: { parentId: id, deletedAt: null },
    });
    if (childCount > 0) {
      throw new Error(`该分类下还有 ${childCount} 个子分类，无法删除`);
    }

    // 检查是否有产品关联
    const productCount = await prisma.product.count({
      where: { hsCodeId: id },
    });
    if (productCount > 0) {
      throw new Error(`该分类下还有 ${productCount} 个产品关联，无法删除`);
    }

    await prisma.hsCode.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** 递归获取所有子分类 ID */
  private async getSubCategoryIds(categoryId: string): Promise<string[]> {
    const all = await prisma.hsCode.findMany({
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
  private buildTree(items: HsCode[]): HsCodeTreeNode[] {
    const map = new Map<string, HsCodeTreeNode>();

    for (const item of items) {
      map.set(item.id, {
        id: item.id,
        code: item.code,
        name: item.name,
        hsCode: item.hsCode,
        categoryCode: item.categoryCode,
        parentId: item.parentId,
        type: item.type,
        level: item.level,
        serialLength: item.serialLength,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedBy: item.updatedBy,
        updatedAt: item.updatedAt,
        children: [],
      });
    }

    const roots: HsCodeTreeNode[] = [];
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
