/**
 * Processing Order Adapter (加工单)
 */

import type { DocumentTypeAdapter } from '../types';

export const processingOrderAdapter: DocumentTypeAdapter = {
  typeId: 'processing_order',
  typeName: '加工单',

  // ---- Prisma 映射 ----
  prismaModel: 'processingOrder',
  prismaItemModel: 'processingOrderItem',
  parentForeignKey: 'processingOrderId',
  itemRelationName: 'items',

  // ---- 基础筛选条件 ----
  baseWhere: {},

  // ---- 搜索 ----
  searchFields: [
    'code',
    'salesContractCode',
    'customerCode',
    'customerName',
    'warehouseName',
  ],

  // ---- Includes ----
  listIncludes: {
    items: {
      where: { deletedAt: null },
      orderBy: { lineNumber: 'asc' },
      take: 5,
    },
  },
  detailIncludes: {
    items: {
      where: { deletedAt: null },
      orderBy: { lineNumber: 'asc' },
      include: {
        subItems: {
          where: { deletedAt: null },
          orderBy: { lineNumber: 'asc' as const },
        },
      },
    },
    subItems: {
      where: { deletedAt: null },
      orderBy: { lineNumber: 'asc' },
    },
  },

  // ---- 默认排序 ----
  defaultOrderBy: { createdAt: 'desc' },

  // ---- 字段映射 (前端 columnId → Prisma 字段名) ----
  columnToPrismaField: {
    _docNumber: 'code',
    _status: 'status',
    _createdAt: 'createdAt',
    salesContractId: 'salesContractId',
    salesContractCode: 'salesContractCode',
    customerId: 'customerId',
    customerCode: 'customerCode',
    customerName: 'customerName',
    warehouseId: 'warehouseId',
    warehouseName: 'warehouseName',
    entityId: 'entityId',
    entityName: 'entityName',
    entryUserId: 'entryUserId',
    entryUserName: 'entryUserName',
    entryDate: 'entryDate',
    status: 'status',
    approvalStatus: 'approvalStatus',
    autoCreated: 'autoCreated',
    completedTime: 'completedTime',
    closedTime: 'closedTime',
    closedReason: 'closedReason',
  },

  // ---- 聚合 ----
  aggregateFields: [],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.status,
      _createdAt: row.createdAt,
      _sourceTypeId: row.salesContractId ? 'sales_contract' : undefined,
      // 主数据字段
      salesContractId: row.salesContractId,
      salesContractCode: row.salesContractCode,
      customerId: row.customerId,
      customerCode: row.customerCode,
      customerName: row.customerName,
      warehouseId: row.warehouseId,
      warehouseName: row.warehouseName,
      entityId: row.entityId,
      entityName: row.entityName,
      entryUserId: row.entryUserId,
      entryUserName: row.entryUserName,
      entryDate: row.entryDate,
      status: row.status,
      approvalStatus: row.approvalStatus,
      autoCreated: row.autoCreated,
      completedTime: row.completedTime,
      closedTime: row.closedTime,
      closedReason: row.closedReason,
      remark: row.remark,
    };
  },

  flattenDetailRow(masterRow: any, detailRow: any) {
    return {
      _id: masterRow.id,
      _docNumber: masterRow.code,
      _status: masterRow.status,
      _createdAt: masterRow.createdAt,
      _detailRowId: detailRow.id,
      // 主数据
      customerCode: masterRow.customerCode,
      customerName: masterRow.customerName,
      warehouseName: masterRow.warehouseName,
      // 明细数据
      lineNumber: detailRow.lineNumber,
      productId: detailRow.productId,
      productCode: detailRow.productCode,
      customerProductNo: detailRow.customerProductNo,
      productName: detailRow.productName,
      quantity: detailRow.quantity ? Number(detailRow.quantity) : 0,
      productImage: detailRow.productImage,
      salesContractId: detailRow.salesContractId,
      salesContractCode: detailRow.salesContractCode,
    };
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;
      const doc = await prisma.processingOrder.update({
        where: { id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          status: approved ? 'APPROVED' : 'PENDING',
          updatedBy: userId,
        },
      });
      return {
        data: doc,
        message: `加工单${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 开始加工 */
    async startProcessing({ id, userId, prisma }) {
      const doc = await prisma.processingOrder.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          updatedBy: userId,
        },
      });
      return { data: doc, message: '加工单已开始加工' };
    },

    /** 完成加工 */
    async complete({ id, userId, prisma }) {
      // 查询加工单及明细
      const order = await prisma.processingOrder.findUnique({
        where: { id },
        select: {
          id: true,
          code: true,
          status: true,
          warehouseId: true,
          warehouseName: true,
        },
        include: {
          items: {
            where: { deletedAt: null },
            include: {
              subItems: { where: { deletedAt: null } },
            },
          },
        },
      });

      if (!order) {
        throw new Error('加工单不存在');
      }

      if (order.status !== 'IN_PROGRESS') {
        throw new Error('只有加工中状态的加工单才能完成');
      }

      // 【业务逻辑补充】完成加工时的库存处理：子产品出库 + 主产品入库
      if (order.items && order.items.length > 0) {
        await handleProcessingOrderInventory(prisma, order, userId);
      }

      const doc = await prisma.processingOrder.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedTime: new Date(),
          updatedBy: userId,
        },
      });
      return { data: doc, message: '加工单已完成，库存已更新' };
    },

    /** 结案 */
    async close({ id, body, userId, prisma }) {
      const order = await prisma.processingOrder.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!order) {
        throw new Error('加工单不存在');
      }

      if (order.status !== 'COMPLETED') {
        throw new Error('只有已完成状态的加工单才能结案');
      }

      const doc = await prisma.processingOrder.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedTime: new Date(),
          closedReason: body.closedReason,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '加工单已结案' };
    },

    /** 取消结案（重新打开） */
    async reopen({ id, userId, prisma }) {
      const order = await prisma.processingOrder.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!order) {
        throw new Error('加工单不存在');
      }

      if (order.status !== 'CLOSED') {
        throw new Error('只有已结案状态的加工单才能重新打开');
      }

      const doc = await prisma.processingOrder.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          closedTime: null,
          closedReason: null,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '加工单已重新打开' };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const doc = await prisma.processingOrder.update({
        where: { id },
        data: {
          status: body.status,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '加工单状态更新成功' };
    },
  },
};

// ==================== Helper Functions ====================

/**
 * 加工单完成时的库存处理
 * 业务逻辑：子产品（原材料）出库 + 主产品（成品）入库
 *
 * @param prisma - Prisma client
 * @param order - 加工单数据（包含 items 和 subItems）
 * @param userId - 操作用户ID
 */
async function handleProcessingOrderInventory(
  prisma: any,
  order: any,
  userId: string
) {
  const { warehouseId, items } = order;

  if (!warehouseId) {
    throw new Error('加工单未指定仓库');
  }

  // 1. 处理子产品出库（原材料消耗）
  for (const item of items) {
    if (item.subItems && item.subItems.length > 0) {
      for (const subItem of item.subItems) {
        await processSubItemOutbound(prisma, warehouseId, subItem, userId);
      }
    }
  }

  // 2. 处理主产品入库（成品入库）
  for (const item of items) {
    await processMainItemInbound(prisma, warehouseId, item, order.code, userId);
  }
}

/**
 * 处理子产品（原材料）出库
 */
async function processSubItemOutbound(
  prisma: any,
  warehouseId: string,
  subItem: any,
  userId: string
) {
  const { skuCode, batchCode, quantity } = subItem;

  if (!quantity || quantity <= 0) {
    return; // 数量为0则跳过
  }

  // 查找库存
  const inventory = await prisma.inventory.findFirst({
    where: {
      skuCode,
      warehouseId,
      batchCode: batchCode || 'DEFAULT',
      deletedAt: null,
    },
  });

  if (!inventory) {
    throw new Error(
      `子产品 ${skuCode} 在仓库中无库存记录${
        batchCode ? `（批次：${batchCode}）` : ''
      }`
    );
  }

  // 校验可用库存
  if (inventory.availableQuantity < quantity) {
    throw new Error(
      `子产品 ${skuCode} 可用库存不足：需要 ${quantity}，当前可用 ${inventory.availableQuantity}${
        batchCode ? `（批次：${batchCode}）` : ''
      }`
    );
  }

  // 扣减库存
  await prisma.inventory.update({
    where: { id: inventory.id },
    data: {
      availableQuantity: { decrement: Number(quantity) },
      totalQuantity: { decrement: Number(quantity) },
      updatedBy: userId,
    },
  });
}

/**
 * 处理主产品（成品）入库
 */
async function processMainItemInbound(
  prisma: any,
  warehouseId: string,
  item: any,
  orderCode: string,
  userId: string
) {
  const { productCode: skuCode, quantity } = item;

  if (!quantity || quantity <= 0) {
    return; // 数量为0则跳过
  }

  // 生成批次号（使用加工单编号作为批次标识）
  const batchCode = `${orderCode}-${new Date().getTime()}`;

  // 查找是否已存在该批次的库存
  const existingInventory = await prisma.inventory.findFirst({
    where: {
      skuCode,
      warehouseId,
      batchCode,
      deletedAt: null,
    },
  });

  if (existingInventory) {
    // 更新现有库存
    await prisma.inventory.update({
      where: { id: existingInventory.id },
      data: {
        availableQuantity: { increment: Number(quantity) },
        totalQuantity: { increment: Number(quantity) },
        updatedBy: userId,
      },
    });
  } else {
    // 创建新库存记录
    await prisma.inventory.create({
      data: {
        skuCode,
        warehouseId,
        batchCode,
        totalQuantity: Number(quantity),
        availableQuantity: Number(quantity),
        lockedQuantity: 0,
        allocatedQuantity: 0,
        inTransitQuantity: 0,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }
}
