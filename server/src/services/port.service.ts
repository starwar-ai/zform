/**
 * PortService
 *
 * 港口管理服务。
 */

import prisma from '../config/database';
import type { Port, PortStatus, Country } from '@prisma/client';

export interface CreatePortInput {
  code: string;
  name: string;
  nameEn?: string | null;
  countryId: string;
  city?: string | null;
  address?: string | null;
  isCommon?: boolean;
  status?: PortStatus;
}

export interface UpdatePortInput {
  code?: string;
  name?: string;
  nameEn?: string | null;
  countryId?: string;
  city?: string | null;
  address?: string | null;
  isCommon?: boolean;
  status?: PortStatus;
}

export interface PortWithCountry extends Port {
  country: Country;
}

export class PortService {
  /** 获取所有港口 */
  async findAll(): Promise<PortWithCountry[]> {
    return prisma.port.findMany({
      where: { deletedAt: null },
      include: { country: true },
      orderBy: [{ isCommon: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /** 获取单个港口 */
  async findById(id: string): Promise<PortWithCountry | null> {
    return prisma.port.findFirst({
      where: { id, deletedAt: null },
      include: { country: true },
    });
  }

  /** 创建港口 */
  async create(data: CreatePortInput, userId?: string): Promise<Port> {
    // 检查编码唯一性
    const existing = await prisma.port.findFirst({
      where: { code: data.code, deletedAt: null },
    });
    if (existing) {
      throw new Error(`港口编码 "${data.code}" 已存在`);
    }

    // 检查国家是否存在
    const country = await prisma.country.findFirst({
      where: { id: data.countryId, deletedAt: null },
    });
    if (!country) {
      throw new Error('所选国家不存在');
    }

    return prisma.port.create({
      data: {
        ...data,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新港口 */
  async update(id: string, data: UpdatePortInput, userId?: string): Promise<Port> {
    // 检查编码唯一性（排除自身）
    if (data.code) {
      const existing = await prisma.port.findFirst({
        where: { code: data.code, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new Error(`港口编码 "${data.code}" 已存在`);
      }
    }

    // 检查国家是否存在
    if (data.countryId) {
      const country = await prisma.country.findFirst({
        where: { id: data.countryId, deletedAt: null },
      });
      if (!country) {
        throw new Error('所选国家不存在');
      }
    }

    return prisma.port.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除港口 */
  async delete(id: string): Promise<void> {
    await prisma.port.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
