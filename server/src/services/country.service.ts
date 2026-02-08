/**
 * CountryService
 *
 * 国家管理服务。
 */

import prisma from '../config/database';
import type { Country } from '@prisma/client';

export interface CreateCountryInput {
  name: string;
  code: string;
  regionCode?: string | null;
  regionName?: string | null;
  areaCode?: string | null;
}

export interface UpdateCountryInput {
  name?: string;
  code?: string;
  regionCode?: string | null;
  regionName?: string | null;
  areaCode?: string | null;
}

export class CountryService {
  /** 获取所有国家 */
  async findAll(): Promise<Country[]> {
    return prisma.country.findMany({
      where: { deletedAt: null },
      orderBy: [{ name: 'asc' }],
    });
  }

  /** 获取单个国家 */
  async findById(id: string): Promise<Country | null> {
    return prisma.country.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 创建国家 */
  async create(data: CreateCountryInput, userId?: string): Promise<Country> {
    // 检查编码唯一性
    const existing = await prisma.country.findFirst({
      where: { code: data.code, deletedAt: null },
    });
    if (existing) {
      throw new Error(`国家编码 "${data.code}" 已存在`);
    }

    return prisma.country.create({
      data: {
        ...data,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新国家 */
  async update(id: string, data: UpdateCountryInput, userId?: string): Promise<Country> {
    // 检查编码唯一性（排除自身）
    if (data.code) {
      const existing = await prisma.country.findFirst({
        where: { code: data.code, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new Error(`国家编码 "${data.code}" 已存在`);
      }
    }

    return prisma.country.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除国家 */
  async delete(id: string): Promise<void> {
    // 检查是否有关联的港口
    const portCount = await prisma.port.count({
      where: { countryId: id, deletedAt: null },
    });
    if (portCount > 0) {
      throw new Error(`该国家下还有 ${portCount} 个港口，无法删除`);
    }

    await prisma.country.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
