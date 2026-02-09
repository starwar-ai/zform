/**
 * RegionService
 *
 * 区域管理服务。
 */

import prisma from '../config/database';
import type { Region } from '@prisma/client';

export interface CreateRegionInput {
  name: string;
  code: string;
}

export interface UpdateRegionInput {
  name?: string;
  code?: string;
}

export class RegionService {
  /** 获取所有区域 */
  async findAll(): Promise<Region[]> {
    return prisma.region.findMany({
      where: { deletedAt: null },
      orderBy: [{ name: 'asc' }],
    });
  }

  /** 获取单个区域 */
  async findById(id: string): Promise<Region | null> {
    return prisma.region.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 创建区域 */
  async create(data: CreateRegionInput, userId?: string): Promise<Region> {
    // 检查编码唯一性
    const existing = await prisma.region.findFirst({
      where: { code: data.code, deletedAt: null },
    });
    if (existing) {
      throw new Error(`区域编码 "${data.code}" 已存在`);
    }

    return prisma.region.create({
      data: {
        ...data,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新区域 */
  async update(id: string, data: UpdateRegionInput, userId?: string): Promise<Region> {
    // 检查编码唯一性（排除自身）
    if (data.code) {
      const existing = await prisma.region.findFirst({
        where: { code: data.code, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new Error(`区域编码 "${data.code}" 已存在`);
      }
    }

    return prisma.region.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除区域 */
  async delete(id: string): Promise<void> {
    // 检查是否有关联的国家
    const countryCount = await prisma.country.count({
      where: { regionId: id, deletedAt: null },
    });
    if (countryCount > 0) {
      throw new Error(`该区域下还有 ${countryCount} 个国家，无法删除`);
    }

    await prisma.region.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
