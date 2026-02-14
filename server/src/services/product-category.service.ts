/**
 * ProductCategoryService
 *
 * 产品分类管理服务，支持树形层级结构。
 * 产品编码前缀取自 codePrefix，序号长度取自 serialLength。
 */

import prisma from '../config/database';
import type { ProductCategory } from '@prisma/client';

export interface ProductCategoryTreeNode {
  id: string;
  code: string;
  name: string;
  level: number;
  codePrefix: string | null;
  serialLength: number;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  children: ProductCategoryTreeNode[];
}

export class ProductCategoryService {
  /** 获取所有产品分类（扁平列表） */
  async findAll(): Promise<ProductCategory[]> {
    return prisma.productCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ code: 'asc' }],
    });
  }

  /** 获取产品分类树 */
  async getTree(): Promise<ProductCategoryTreeNode[]> {
    const categories = await this.findAll();
    return this.buildTree(categories);
  }

  /** 根据 ID 获取单个产品分类 */
  async findById(id: string): Promise<ProductCategory | null> {
    return prisma.productCategory.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 将扁平列表构建为树 */
  private buildTree(categories: ProductCategory[]): ProductCategoryTreeNode[] {
    const map = new Map<string, ProductCategoryTreeNode>();

    for (const cat of categories) {
      map.set(cat.id, {
        id: cat.id,
        code: cat.code,
        name: cat.name,
        level: cat.level,
        codePrefix: cat.codePrefix,
        serialLength: cat.serialLength,
        parentId: cat.parentId,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        children: [],
      });
    }

    const roots: ProductCategoryTreeNode[] = [];
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

export const productCategoryService = new ProductCategoryService();
