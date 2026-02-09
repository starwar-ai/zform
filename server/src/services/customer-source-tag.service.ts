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
}

export interface UpdateCustomerSourceTagInput {
  code?: string;
  name?: string;
  isCommon?: boolean;
}

export class CustomerSourceTagService {
  /** 获取所有客户来源 */
  async findAll(): Promise<CustomerSourceTag[]> {
    return prisma.customerSourceTag.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'asc' }],
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
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除客户来源 */
  async delete(id: string): Promise<void> {
    await prisma.customerSourceTag.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
