/**
 * CustomerSourceTagService
 *
 * 客户来源管理服务，扁平列表结构。
 */

import prisma from '../config/database';
import type { CustomerSourceTag } from '@prisma/client';

export interface CreateCustomerSourceTagInput {
  code: string;
  name: string;
  isCommon?: boolean;
  sortOrder?: number;
}

export interface UpdateCustomerSourceTagInput {
  code?: string;
  name?: string;
  isCommon?: boolean;
  sortOrder?: number;
}

export class CustomerSourceTagService {
  /** 获取所有客户来源 */
  async findAll(): Promise<CustomerSourceTag[]> {
    return prisma.customerSourceTag.findMany({
      where: { deletedAt: null },
      orderBy: [{ isCommon: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** 获取单个客户来源 */
  async findById(id: string): Promise<CustomerSourceTag | null> {
    return prisma.customerSourceTag.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 创建客户来源 */
  async create(data: CreateCustomerSourceTagInput, userId?: string): Promise<CustomerSourceTag> {
    const existingCode = await prisma.customerSourceTag.findFirst({
      where: { code: data.code, deletedAt: null },
    });
    if (existingCode) {
      throw new Error(`客户来源编码 "${data.code}" 已存在`);
    }

    const existing = await prisma.customerSourceTag.findFirst({
      where: { name: data.name, deletedAt: null },
    });
    if (existing) {
      throw new Error(`客户来源 "${data.name}" 已存在`);
    }

    return prisma.customerSourceTag.create({
      data: {
        code: data.code,
        name: data.name,
        isCommon: data.isCommon ?? false,
        sortOrder: data.sortOrder ?? 0,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新客户来源 */
  async update(id: string, data: UpdateCustomerSourceTagInput, userId?: string): Promise<CustomerSourceTag> {
    if (data.code) {
      const existingCode = await prisma.customerSourceTag.findFirst({
        where: { code: data.code, deletedAt: null, id: { not: id } },
      });
      if (existingCode) {
        throw new Error(`客户来源编码 "${data.code}" 已存在`);
      }
    }

    if (data.name) {
      const existing = await prisma.customerSourceTag.findFirst({
        where: { name: data.name, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new Error(`客户来源 "${data.name}" 已存在`);
      }
    }

    return prisma.customerSourceTag.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isCommon !== undefined && { isCommon: data.isCommon }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        updatedBy: userId || undefined,
      },
    });
  }

  /** 批量更新排序 */
  async reorder(items: { id: string; sortOrder: number }[], userId?: string): Promise<void> {
    const updates = items.map((item) =>
      prisma.customerSourceTag.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder, updatedBy: userId || undefined },
      })
    );
    await prisma.$transaction(updates);
  }

  /** 软删除客户来源 */
  async delete(id: string): Promise<void> {
    await prisma.customerSourceTag.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
