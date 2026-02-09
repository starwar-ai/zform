/**
 * BrandService
 *
 * 品牌管理服务。
 */

import prisma from '../config/database';
import type { Brand } from '@prisma/client';

export interface CreateBrandInput {
  code: string;
  name: string;
  nameEn?: string | null;
  customerId?: string | null;
  customerCode?: string | null;
  customerName?: string | null;
  type?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  isCommon?: boolean;
  isSelfOwned?: boolean;
}

export interface UpdateBrandInput {
  code?: string;
  name?: string;
  nameEn?: string | null;
  customerId?: string | null;
  customerCode?: string | null;
  customerName?: string | null;
  type?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  isCommon?: boolean;
  isSelfOwned?: boolean;
}

export class BrandService {
  /** 获取所有品牌 */
  async findAll(): Promise<Brand[]> {
    return prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: [{ name: 'asc' }],
    });
  }

  /** 获取单个品牌 */
  async findById(id: string): Promise<Brand | null> {
    return prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 创建品牌 */
  async create(data: CreateBrandInput, userId?: string): Promise<Brand> {
    const existing = await prisma.brand.findFirst({
      where: { code: data.code, deletedAt: null },
    });
    if (existing) {
      throw new Error(`品牌编码 "${data.code}" 已存在`);
    }

    return prisma.brand.create({
      data: {
        ...data,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新品牌 */
  async update(id: string, data: UpdateBrandInput, userId?: string): Promise<Brand> {
    if (data.code) {
      const existing = await prisma.brand.findFirst({
        where: { code: data.code, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new Error(`品牌编码 "${data.code}" 已存在`);
      }
    }

    return prisma.brand.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除品牌 */
  async delete(id: string): Promise<void> {
    const productCount = await prisma.product.count({
      where: { brandId: id, deletedAt: null },
    });
    if (productCount > 0) {
      throw new Error(`该品牌已被 ${productCount} 个产品引用，无法删除`);
    }

    await prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
