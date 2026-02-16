/**
 * OrderRouteService
 *
 * 订单路径管理服务。
 */

import prisma from '../config/database';
import type { OrderRoute } from '@prisma/client';

export interface CreateOrderRouteInput {
  path: string;
  status: string;
  description?: string | null;
  isCommon?: boolean;
  sortOrder?: number;
}

export interface UpdateOrderRouteInput {
  path?: string;
  status?: string;
  description?: string | null;
  isCommon?: boolean;
  sortOrder?: number;
}

export class OrderRouteService {
  /** 获取所有订单路径 */
  async findAll(): Promise<OrderRoute[]> {
    return prisma.orderRoute.findMany({
      where: { deletedAt: null },
      orderBy: [{ isCommon: 'desc' }, { sortOrder: 'asc' }, { path: 'asc' }],
    });
  }

  /** 获取单个订单路径 */
  async findById(id: string): Promise<OrderRoute | null> {
    return prisma.orderRoute.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 创建订单路径 */
  async create(data: CreateOrderRouteInput, userId?: string): Promise<OrderRoute> {
    return prisma.orderRoute.create({
      data: {
        path: data.path,
        status: data.status,
        description: data.description ?? null,
        isCommon: data.isCommon ?? false,
        sortOrder: data.sortOrder ?? 0,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新订单路径 */
  async update(id: string, data: UpdateOrderRouteInput, userId?: string): Promise<OrderRoute> {
    return prisma.orderRoute.update({
      where: { id },
      data: {
        ...(data.path !== undefined && { path: data.path }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isCommon !== undefined && { isCommon: data.isCommon }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        updatedBy: userId || undefined,
      },
    });
  }

  /** 批量更新排序 */
  async reorder(items: { id: string; sortOrder: number }[], userId?: string): Promise<void> {
    const updates = items.map((item) =>
      prisma.orderRoute.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder, updatedBy: userId || undefined },
      })
    );
    await prisma.$transaction(updates);
  }

  /** 软删除订单路径 */
  async delete(id: string): Promise<void> {
    await prisma.orderRoute.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
