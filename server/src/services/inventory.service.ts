/**
 * InventoryService
 *
 * 库存查询服务。
 */

import prisma from '../config/database';
import type { InventoryDetail, Prisma } from '@prisma/client';

export interface InventoryQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  warehouseId?: string;
  skuCode?: string;
  skuId?: string;
  supplierId?: string;
  customerId?: string;
  batchNumber?: string;
}

export interface InventoryListResult {
  data: InventoryDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export class InventoryService {
  /** 分页查询库存列表 */
  async findAll(params: InventoryQueryParams): Promise<InventoryListResult> {
    const {
      page = 1,
      pageSize = 20,
      search,
      warehouseId,
      skuCode,
      skuId,
      supplierId,
      customerId,
      batchNumber,
    } = params;

    // 构建查询条件
    const where: Prisma.InventoryDetailWhereInput = {
      deletedAt: null,
    };

    // 关键词搜索
    if (search) {
      where.OR = [
        { skuCode: { contains: search, mode: 'insensitive' } },
        { skuName: { contains: search, mode: 'insensitive' } },
        { selfOwnedProductNo: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { warehouseName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 筛选条件
    if (warehouseId) where.warehouseId = warehouseId;
    if (skuCode) where.skuCode = skuCode;
    if (skuId) where.skuId = skuId;
    if (supplierId) where.supplierId = supplierId;
    if (customerId) where.customerId = customerId;
    if (batchNumber) where.batchNumber = batchNumber;

    // 计算分页
    const skip = (page - 1) * pageSize;

    // 并行查询总数和数据
    const [total, data] = await Promise.all([
      prisma.inventoryDetail.count({ where }),
      prisma.inventoryDetail.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /** 获取单条库存明细 */
  async findById(id: string): Promise<InventoryDetail | null> {
    return prisma.inventoryDetail.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 库存汇总统计（可选功能） */
  async getSummary(params: InventoryQueryParams) {
    const where: Prisma.InventoryDetailWhereInput = {
      deletedAt: null,
    };

    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.skuId) where.skuId = params.skuId;
    if (params.supplierId) where.supplierId = params.supplierId;
    if (params.customerId) where.customerId = params.customerId;

    const result = await prisma.inventoryDetail.aggregate({
      where,
      _sum: {
        initialQuantity: true,
        usedQuantity: true,
        lockedQuantity: true,
        availableQuantity: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalRecords: result._count.id,
      totalInitialQuantity: result._sum.initialQuantity || 0,
      totalUsedQuantity: result._sum.usedQuantity || 0,
      totalLockedQuantity: result._sum.lockedQuantity || 0,
      totalAvailableQuantity: result._sum.availableQuantity || 0,
    };
  }
}
