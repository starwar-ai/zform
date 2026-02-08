/**
 * ExhibitionCategoryService
 *
 * 展会分类管理服务，扁平列表结构。
 */

import prisma from '../config/database';
import type { ExhibitionCategory } from '@prisma/client';

export interface CreateExhibitionCategoryInput {
  name: string;
  isDomestic?: boolean;
}

export interface UpdateExhibitionCategoryInput {
  name?: string;
  isDomestic?: boolean;
}

export class ExhibitionCategoryService {
  /** 获取所有展会分类 */
  async findAll(): Promise<ExhibitionCategory[]> {
    return prisma.exhibitionCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'asc' }],
    });
  }

  /** 获取单个展会分类 */
  async findById(id: string): Promise<ExhibitionCategory | null> {
    return prisma.exhibitionCategory.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 创建展会分类 */
  async create(data: CreateExhibitionCategoryInput, userId?: string): Promise<ExhibitionCategory> {
    // 检查名称唯一性
    const existing = await prisma.exhibitionCategory.findFirst({
      where: { name: data.name, deletedAt: null },
    });
    if (existing) {
      throw new Error(`展会分类名称 "${data.name}" 已存在`);
    }

    return prisma.exhibitionCategory.create({
      data: {
        name: data.name,
        isDomestic: data.isDomestic ?? false,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新展会分类 */
  async update(id: string, data: UpdateExhibitionCategoryInput, userId?: string): Promise<ExhibitionCategory> {
    if (data.name) {
      const existing = await prisma.exhibitionCategory.findFirst({
        where: { name: data.name, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new Error(`展会分类名称 "${data.name}" 已存在`);
      }
    }

    return prisma.exhibitionCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isDomestic !== undefined && { isDomestic: data.isDomestic }),
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除展会分类 */
  async delete(id: string): Promise<void> {
    await prisma.exhibitionCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
