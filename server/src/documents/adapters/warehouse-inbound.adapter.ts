/**
 * 入库单 Adapter (Warehouse Inbound)
 */

import type { DocumentTypeAdapter } from '../types';
import { Decimal } from '@prisma/client/runtime/library';
import {
  validateStatusTransition,
  executeBatchOperation,
  validateRequiredFields,
  calculateDocumentSummary,
  queryRelatedDocuments,
} from '../../utils/business-utils';

/**
 * 入库单状态流转配置
 */
const INBOUND_ORDER_STATUS_CONFIG = {
  transitions: {
    DRAFT: ['PENDING', 'CANCELLED'],
    PENDING: ['IN_PROGRESS', 'DRAFT', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  },
};

export const warehouseInboundAdapter: DocumentTypeAdapter = {
  typeId: 'warehouse_inbound',
  typeName: '入库单',

  // ---- Prisma 映射 ----
  prismaModel: 'warehouseOrder',
  prismaItemModel: 'warehouseOrderItem',
  parentForeignKey: 'warehouseOrderId',
  itemRelationName: 'items',

  // ---- 基础筛选条件 ----
  baseWhere: { type: 'INBOUND' },

  // ---- 搜索 ----
  searchFields: [
    'code',
    'internalCode',
    'shippingInvoiceNo',
    'sourceCode',
    'noticeCode',
    'salesContractCode',
    'warehouseCode',
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
    },
  },

  // ---- 默认排序 ----
  defaultOrderBy: { createdAt: 'desc' },

  // ---- 字段映射 (前端 columnId → Prisma 字段名) ----
  columnToPrismaField: {
    _docNumber: 'code',
    _status: 'orderStatus',
    _createdAt: 'createdAt',
    internalCode: 'internalCode',
    shippingInvoiceNo: 'shippingInvoiceNo',
    sourceCode: 'sourceCode',
    productCode: 'productCode',
    type: 'type',
    approvalStatus: 'approvalStatus',
    orderStatus: 'orderStatus',
    noticeCode: 'noticeCode',
    salesContractCode: 'salesContractCode',
    orderTime: 'orderTime',
    warehouseId: 'warehouseId',
    warehouseCode: 'warehouseCode',
    warehouseName: 'warehouseName',
    printStatus: 'printStatus',
    companyName: 'companyName',
  },

  // ---- 聚合 ----
  aggregateFields: [],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      id: row.id,
      code: row.code,
      status: row.orderStatus,
      createdAt: row.createdAt,
      // 主数据字段
      internalCode: row.internalCode,
      shippingInvoiceNo: row.shippingInvoiceNo,
      sourceId: row.sourceId,
      sourceCode: row.sourceCode,
      sourceType: row.sourceType,
      productCode: row.productCode,
      thumbnail: row.thumbnail,
      type: row.type,
      approvalStatus: row.approvalStatus,
      orderStatus: row.orderStatus,
      noticeCode: row.noticeCode,
      salesContractId: row.salesContractId,
      salesContractCode: row.salesContractCode,
      orderTime: row.orderTime,
      warehouseId: row.warehouseId,
      warehouseCode: row.warehouseCode,
      warehouseName: row.warehouseName,
      printStatus: row.printStatus,
      printCount: row.printCount,
      companyId: row.companyId,
      companyName: row.companyName,
      remark: row.remark,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
      updatedAt: row.updatedAt,
    };
  },

  // 明细扁平化（用于明细模式列表）
  flattenDetailRow(masterRow: any, detailRow: any) {
    return {
      id: detailRow.id,
      code: masterRow.code,
      status: masterRow.orderStatus,
      createdAt: masterRow.createdAt,
      // 明细字段
      lineNumber: detailRow.lineNumber,
      barcode: detailRow.barcode,
      selfOwnedProductNo: detailRow.selfOwnedProductNo,
      merchandiser: detailRow.merchandiser,
      isSeparateBox: detailRow.isSeparateBox,
      specification: detailRow.specification,
      baseProductCode: detailRow.baseProductCode,
      price: detailRow.price ? Number(detailRow.price) : undefined,
      salesperson: detailRow.salesperson,
      buyerDepartment: detailRow.buyerDepartment,
      buyer: detailRow.buyer,
      purchaseContractCode: detailRow.purchaseContractCode,
      skuCode: detailRow.skuCode,
      skuName: detailRow.skuName,
      customerProductNo: detailRow.customerProductNo,
      supplierCode: detailRow.supplierCode,
      supplierName: detailRow.supplierName,
      customerCode: detailRow.customerCode,
      customerName: detailRow.customerName,
      expectedQuantity: detailRow.expectedQuantity ? Number(detailRow.expectedQuantity) : undefined,
      expectedBoxes: detailRow.expectedBoxes,
      actualQuantity: detailRow.actualQuantity ? Number(detailRow.actualQuantity) : undefined,
      actualBoxes: detailRow.actualBoxes,
      batchNumber: detailRow.batchNumber,
      remark: detailRow.remark,
    };
  },

  // ---- 生命周期钩子 ----
  async onCreate(data, userId, prismaClient) {
    // 设置默认值
    if (!data.orderTime) {
      data.orderTime = new Date();
    }
    if (!data.orderStatus) {
      data.orderStatus = 'DRAFT';
    }
    if (!data.type) {
      data.type = 'INBOUND';
    }
  },

  async onUpdate(id, data, userId, prismaClient) {
    // 验证状态流转
    if (data.orderStatus) {
      const current = await prismaClient.warehouseOrder.findUnique({
        where: { id },
        select: { orderStatus: true },
      });

      if (current && current.orderStatus !== data.orderStatus) {
        validateStatusTransition(
          current.orderStatus,
          data.orderStatus,
          INBOUND_ORDER_STATUS_CONFIG
        );
      }
    }
  },

  async beforeDelete(id: string, prismaClient: any) {
    const order = await prismaClient.warehouseOrder.findUnique({
      where: { id },
      select: { orderStatus: true, code: true },
    });

    if (!order) {
      throw new Error('入库单不存在');
    }

    if (['IN_PROGRESS', 'COMPLETED'].includes(order.orderStatus)) {
      throw new Error(`入库单 ${order.code} 状态为 ${order.orderStatus}，不允许删除`);
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;

      const order = await prisma.warehouseOrder.findUnique({
        where: { id },
        select: { orderStatus: true, code: true },
      });

      if (!order) {
        throw new Error('入库单不存在');
      }

      if (order.orderStatus !== 'PENDING') {
        throw new Error(`入库单 ${order.code} 状态为 ${order.orderStatus}，无法审核`);
      }

      const doc = await prisma.warehouseOrder.update({
        where: { id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          orderStatus: approved ? 'IN_PROGRESS' : 'PENDING',
          updatedBy: userId,
        },
      });

      return {
        data: doc,
        message: `入库单${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const { status } = body;

      validateRequiredFields(body, ['status']);

      const current = await prisma.warehouseOrder.findUnique({
        where: { id },
        select: { orderStatus: true, code: true },
      });

      if (!current) {
        throw new Error('入库单不存在');
      }

      validateStatusTransition(
        current.orderStatus,
        status,
        INBOUND_ORDER_STATUS_CONFIG
      );

      const order = await prisma.warehouseOrder.update({
        where: { id },
        data: {
          orderStatus: status,
          updatedBy: userId,
        },
      });

      return { data: order, message: '状态更新成功' };
    },

    /** 完成入库 */
    async complete({ id, userId, prisma }) {
      const order = await prisma.warehouseOrder.findUnique({
        where: { id },
        select: { 
          orderStatus: true, 
          code: true,
          warehouseId: true,
          warehouseName: true,
          companyId: true,
          companyName: true,
        },
        include: {
          items: {
            where: { deletedAt: null },
          },
        },
      });

      if (!order) {
        throw new Error('入库单不存在');
      }

      if (order.orderStatus !== 'IN_PROGRESS') {
        throw new Error(`入库单 ${order.code} 状态为 ${order.orderStatus}，无法完成`);
      }

      // 【业务逻辑补充】完成入库时更新库存
      if (order.items && order.items.length > 0) {
        await updateInventoryOnInbound(prisma, order, userId);
      }

      const updated = await prisma.warehouseOrder.update({
        where: { id },
        data: {
          orderStatus: 'COMPLETED',
          completedAt: new Date(),
          updatedBy: userId,
        },
      });

      return {
        data: updated,
        message: '入库完成',
      };
    },

    /** 批量审核 */
    async batchApprove({ body, userId, prisma }) {
      const { ids, approved } = body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('请选择要审核的入库单');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          const order = await prisma.warehouseOrder.findUnique({
            where: { id },
            select: { code: true, orderStatus: true },
          });

          if (!order) {
            throw new Error('入库单不存在');
          }

          if (order.orderStatus !== 'PENDING') {
            throw new Error(`状态为 ${order.orderStatus}，无法审核`);
          }

          return await prisma.warehouseOrder.update({
            where: { id },
            data: {
              approvalStatus: approved ? 'APPROVED' : 'REJECTED',
              orderStatus: approved ? 'IN_PROGRESS' : 'PENDING',
              updatedBy: userId,
            },
          });
        },
        { continueOnError: true }
      );

      return {
        data: result,
        message: `批量审核完成：成功 ${result.successCount} 个，失败 ${result.errorCount} 个`,
      };
    },

    /** 打印 */
    async print({ id, prisma }) {
      const order = await prisma.warehouseOrder.update({
        where: { id },
        data: {
          printStatus: 'PRINTED',
          printCount: { increment: 1 },
        },
      });

      return {
        data: order,
        message: '打印成功',
      };
    },

    /** 批量打印 */
    async batchPrint({ body, prisma }) {
      const { ids } = body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('请选择要打印的入库单');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          return await prisma.warehouseOrder.update({
            where: { id },
            data: {
              printStatus: 'PRINTED',
              printCount: { increment: 1 },
            },
          });
        },
        { continueOnError: true }
      );

      return {
        data: result,
        message: `批量打印完成：成功 ${result.successCount} 个`,
      };
    },

    /** 从入库通知单生成 */
    async createFromNotice({ body, userId, prisma }) {
      const { noticeId, itemIds } = body;

      validateRequiredFields(body, ['noticeId']);

      const notice = await prisma.warehouseNotice.findUnique({
        where: { id: noticeId },
        include: {
          items: itemIds
            ? {
                where: {
                  id: { in: itemIds },
                  deletedAt: null,
                },
              }
            : {
                where: { deletedAt: null },
              },
        },
      });

      if (!notice) {
        throw new Error('入库通知单不存在');
      }

      if (notice.items.length === 0) {
        throw new Error('未找到选中的明细项');
      }

      // 生成编号
      const today = new Date();
      const prefix = `WI${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const lastOrder = await prisma.warehouseOrder.findFirst({
        where: { code: { startsWith: prefix }, type: 'INBOUND' },
        orderBy: { code: 'desc' },
      });
      let seq = 1;
      if (lastOrder) {
        seq = parseInt(lastOrder.code.substring(prefix.length)) + 1;
      }
      const orderCode = `${prefix}${String(seq).padStart(4, '0')}`;

      const order = await prisma.warehouseOrder.create({
        data: {
          code: orderCode,
          type: 'INBOUND',
          orderTime: new Date(),
          noticeId: notice.id,
          noticeCode: notice.code,
          shippingInvoiceNo: notice.shippingInvoiceNo,
          orderLinkCode: notice.orderLinkCode,
          companyId: notice.companyId,
          companyName: notice.companyName,
          orderStatus: 'DRAFT',
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: notice.items.map((item: any, index: number) => ({
              lineNumber: index + 1,
              skuCode: item.skuCode,
              skuName: item.skuName,
              specification: item.specification,
              expectedQuantity: item.expectedQuantity,
              expectedBoxes: item.expectedBoxes,
              supplierCode: item.supplierCode,
              supplierName: item.supplierName,
              customerCode: item.customerCode,
              customerName: item.customerName,
              warehouseCode: item.warehouseCode,
              warehouseName: item.warehouseName,
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        },
        include: { items: true },
      });

      return {
        data: order,
        message: '入库单生成成功',
      };
    },
  },
};

/**
 * 辅助函数：入库时更新库存
 * @param prisma Prisma client
 * @param order 入库单信息
 * @param userId 用户ID
 */
async function updateInventoryOnInbound(
  prisma: any,
  order: any,
  userId: string
) {
  for (const item of order.items) {
    // 查找是否已存在该产品在该仓库的库存记录
    const existingStock = await prisma.inventory.findFirst({
      where: {
        skuCode: item.skuCode,
        warehouseId: order.warehouseId,
        batchCode: item.batchCode || 'DEFAULT',
        deletedAt: null,
      },
    });

    if (existingStock) {
      // 更新现有库存：增加可用数量和初始数量
      await prisma.inventory.update({
        where: { id: existingStock.id },
        data: {
          availableQuantity: { increment: item.actualQuantity || item.expectedQuantity || 0 },
          totalQuantity: { increment: item.actualQuantity || item.expectedQuantity || 0 },
          updatedBy: userId,
        },
      });
    } else {
      // 创建新库存记录
      const quantity = item.actualQuantity || item.expectedQuantity || 0;
      await prisma.inventory.create({
        data: {
          skuCode: item.skuCode,
          skuName: item.skuName,
          warehouseId: order.warehouseId,
          warehouseName: order.warehouseName,
          warehouseCode: item.warehouseCode,
          batchCode: item.batchCode || 'DEFAULT',
          batchDate: new Date(),
          companyId: order.companyId,
          companyName: order.companyName,
          totalQuantity: quantity,
          availableQuantity: quantity,
          lockedQuantity: 0,
          allocatedQuantity: 0,
          inboundOrderId: order.id,
          inboundOrderCode: order.code,
          purchaseContractId: item.purchaseContractId,
          purchaseContractCode: item.purchaseContractCode,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    // 更新入库通知单明细的转单标识
    if (item.noticeItemId) {
      await prisma.warehouseNoticeItem.update({
        where: { id: item.noticeItemId },
        data: {
          convertedToOrderFlag: true,
          inboundedQuantity: { increment: item.actualQuantity || item.expectedQuantity || 0 },
          updatedBy: userId,
        },
      });
    }
  }

  // 更新入库通知单状态
  if (order.noticeId) {
    await updateNoticeStatusAfterInbound(prisma, order.noticeId, userId);
  }
}

/**
 * 辅助函数：入库后更新通知单状态
 * @param prisma Prisma client
 * @param noticeId 通知单ID
 * @param userId 用户ID
 */
async function updateNoticeStatusAfterInbound(
  prisma: any,
  noticeId: string,
  userId: string
) {
  const notice = await prisma.warehouseNotice.findUnique({
    where: { id: noticeId },
    include: {
      items: {
        where: { deletedAt: null },
      },
    },
  });

  if (!notice || !notice.items) return;

  // 检查所有明细是否都已转单
  const allConverted = notice.items.every(
    (item: any) => item.convertedToOrderFlag === true
  );

  if (allConverted) {
    await prisma.warehouseNotice.update({
      where: { id: noticeId },
      data: {
        noticeStatus: 'COMPLETED',
        updatedBy: userId,
      },
    });
  } else {
    await prisma.warehouseNotice.update({
      where: { id: noticeId },
      data: {
        noticeStatus: 'IN_PROGRESS',
        updatedBy: userId,
      },
    });
  }
}
