/**
 * WarehouseService
 *
 * 仓库管理服务。
 */

import prisma from '../config/database';
import type { Warehouse, WarehouseType } from '@prisma/client';

export interface CreateWarehouseInput {
  code: string;
  name: string;
  type?: WarehouseType;
  address?: string | null;
  keeperIds?: any;
  keeperId?: string | null;
  isDefault?: boolean;
  isEnabled?: boolean;
  supplierCode?: string | null;
  supplierName?: string | null;
  remark?: string | null;
}

export interface UpdateWarehouseInput {
  code?: string;
  name?: string;
  type?: WarehouseType;
  address?: string | null;
  keeperIds?: any;
  keeperId?: string | null;
  isDefault?: boolean;
  isEnabled?: boolean;
  supplierCode?: string | null;
  supplierName?: string | null;
  remark?: string | null;
}

export class WarehouseService {
  /** 获取所有仓库 */
  async findAll(): Promise<Warehouse[]> {
    return prisma.warehouse.findMany({
      where: { deletedAt: null },
      orderBy: [{ code: 'asc' }],
    });
  }

  /** 获取单个仓库 */
  async findById(id: string): Promise<Warehouse | null> {
    return prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 创建仓库 */
  async create(data: CreateWarehouseInput, userId?: string): Promise<Warehouse> {
    const existing = await prisma.warehouse.findFirst({
      where: { code: data.code, deletedAt: null },
    });
    if (existing) {
      throw new Error(`仓库编码 "${data.code}" 已存在`);
    }

    return prisma.warehouse.create({
      data: {
        ...data,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新仓库 */
  async update(id: string, data: UpdateWarehouseInput, userId?: string): Promise<Warehouse> {
    if (data.code) {
      const existing = await prisma.warehouse.findFirst({
        where: { code: data.code, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new Error(`仓库编码 "${data.code}" 已存在`);
      }
    }

    return prisma.warehouse.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除仓库 */
  async delete(id: string): Promise<void> {
    // 可以在这里检查是否有关联的出入库单或库存
    // 暂时简单实现
    await prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
