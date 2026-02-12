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
}

export interface UpdateOrderRouteInput {
  path?: string;
  status?: string;
  description?: string | null;
}

export class OrderRouteService {
  /** 获取所有订单路径 */
  async findAll(): Promise<OrderRoute[]> {
    return prisma.orderRoute.findMany({
      where: { deletedAt: null },
      orderBy: [{ path: 'asc' }],
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
        ...data,
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
        ...data,
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除订单路径 */
  async delete(id: string): Promise<void> {
    await prisma.orderRoute.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
