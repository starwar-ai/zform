/**
 * Inspection Order Adapter (验货单)
 */

import type { DocumentTypeAdapter } from '../types';

export const inspectionOrderAdapter: DocumentTypeAdapter = {
  typeId: 'inspection_order',
  typeName: '验货单',

  // ---- Prisma 映射 ----
  prismaModel: 'inspectionOrder',
  prismaItemModel: 'inspectionOrderItem',
  parentForeignKey: 'inspectionOrderId',
  itemRelationName: 'items',

  // ---- 基础筛选条件 ----
  baseWhere: {},

  // ---- 搜索 ----
  searchFields: [
    'code',
    'purchaseContractCode',
    'supplierCode',
    'supplierName',
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
    _status: 'status',
    _createdAt: 'createdAt',
    code: 'code',
    orderLinkCode: 'orderLinkCode',
    status: 'status',
    approvalStatus: 'approvalStatus',
    buyer: 'buyer',
    salesPerson: 'salesPerson',
    inspectionNode: 'inspectionNode',
    isReinspection: 'isReinspection',
    relatedInspectionOrderId: 'relatedInspectionOrderId',
    relatedInspectionOrderCode: 'relatedInspectionOrderCode',
    sourceType: 'sourceType',
    purchaseContractId: 'purchaseContractId',
    purchaseContractCode: 'purchaseContractCode',
    warehouseId: 'warehouseId',
    warehouseName: 'warehouseName',
    supplierId: 'supplierId',
    supplierCode: 'supplierCode',
    supplierName: 'supplierName',
    inspectionMethod: 'inspectionMethod',
    expectedInspectionDate: 'expectedInspectionDate',
    plannedInspectionDate: 'plannedInspectionDate',
    inspectionAddress: 'inspectionAddress',
    inspector: 'inspector',
    inspectorName: 'inspectorName',
    actualInspectionTime: 'actualInspectionTime',
    inspectionAmount: 'inspectionAmount',
    allocationMethod: 'allocationMethod',
    companyId: 'companyId',
    companyName: 'companyName',
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
      _sourceTypeId: row.purchaseContractId ? 'purchase_contract' : undefined,
      // 主数据字段
      code: row.code,
      orderLinkCode: row.orderLinkCode,
      status: row.status,
      approvalStatus: row.approvalStatus,
      buyer: row.buyer,
      salesPerson: row.salesPerson,
      inspectionNode: row.inspectionNode,
      isReinspection: row.isReinspection,
      relatedInspectionOrderCode: row.relatedInspectionOrderCode,
      sourceType: row.sourceType,
      purchaseContractId: row.purchaseContractId,
      purchaseContractCode: row.purchaseContractCode,
      warehouseId: row.warehouseId,
      warehouseName: row.warehouseName,
      supplierId: row.supplierId,
      supplierCode: row.supplierCode,
      supplierName: row.supplierName,
      inspectionMethod: row.inspectionMethod,
      expectedInspectionDate: row.expectedInspectionDate,
      plannedInspectionDate: row.plannedInspectionDate,
      inspectionAddress: row.inspectionAddress,
      inspector: row.inspector,
      inspectorName: row.inspectorName,
      actualInspectionTime: row.actualInspectionTime,
      inspectionAmount: row.inspectionAmount
        ? Number(row.inspectionAmount)
        : undefined,
      allocationMethod: row.allocationMethod,
      companyId: row.companyId,
      companyName: row.companyName,
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
      supplierCode: masterRow.supplierCode,
      supplierName: masterRow.supplierName,
      purchaseContractCode: masterRow.purchaseContractCode,
      inspectionMethod: masterRow.inspectionMethod,
      // 明细数据
      lineNumber: detailRow.lineNumber,
      skuId: detailRow.skuId,
      skuCode: detailRow.skuCode,
      skuName: detailRow.skuName,
      purchaseQuantity: detailRow.purchaseQuantity
        ? Number(detailRow.purchaseQuantity)
        : 0,
      inspectionStatus: detailRow.inspectionStatus,
      thumbnail: detailRow.thumbnail,
      packageMethod: detailRow.packageMethod,
    };
  },

  // ---- 生命周期钩子 ----
  async onCreate(data, userId, prismaClient) {
    // 【业务逻辑补充】创建时根据明细状态计算整单状态
    if (data.items && Array.isArray(data.items)) {
      const itemStatuses = data.items
        .map((item: any) => item.inspectionStatus)
        .filter(Boolean);
      
      if (itemStatuses.length > 0) {
        data.status = calculateInspectionOrderStatus(itemStatuses);
      }
    }
  },

  async onUpdate(id, data, userId, prismaClient) {
    // 【业务逻辑补充】更新时重新计算整单状态并回写采购合同
    const order = await prismaClient.inspectionOrder.findUnique({
      where: { id },
      include: {
        items: { where: { deletedAt: null } },
      },
    });

    if (order && order.items && order.items.length > 0) {
      // 1. 重新计算整单状态
      const itemStatuses = order.items
        .map((item: any) => item.inspectionStatus)
        .filter(Boolean);
      
      if (itemStatuses.length > 0) {
        data.status = calculateInspectionOrderStatus(itemStatuses);
      }

      // 2. 如果是终验节点，回写采购合同明细的验货信息
      if (order.inspectionNode === 'FINAL' && order.purchaseContractCode) {
        await updatePurchaseContractInspectionData(
          prismaClient,
          order.items,
          order.actualInspectionTime || new Date(),
          userId
        );
      }
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;
      
      const doc = await prisma.inspectionOrder.update({
        where: { id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          status: approved ? 'PENDING_INSPECTION' : 'DRAFT',
          updatedBy: userId,
        },
      });
      
      return {
        data: doc,
        message: `验货单${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 开始验货 */
    async startInspection({ id, userId, prisma }) {
      const order = await prisma.inspectionOrder.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!order) {
        throw new Error('验货单不存在');
      }

      if (order.status !== 'PENDING_INSPECTION') {
        throw new Error('只有待验货状态的验货单才能开始验货');
      }

      const doc = await prisma.inspectionOrder.update({
        where: { id },
        data: {
          status: 'INSPECTING',
          actualInspectionTime: new Date(),
          updatedBy: userId,
        },
      });
      
      return { data: doc, message: '验货单已开始验货' };
    },

    /** 完成验货 */
    async completeInspection({ id, userId, prisma }) {
      const order = await prisma.inspectionOrder.findUnique({
        where: { id },
        select: {
          status: true,
          inspectionNode: true,
          purchaseContractCode: true,
          actualInspectionTime: true,
        },
        include: {
          items: { where: { deletedAt: null } },
        },
      });

      if (!order) {
        throw new Error('验货单不存在');
      }

      if (order.status !== 'INSPECTING') {
        throw new Error('只有验货中状态的验货单才能完成验货');
      }

      // 【业务逻辑补充】根据明细状态判断整单状态
      const itemStatuses = order.items
        .map((item: any) => item.inspectionStatus)
        .filter(Boolean);
      
      const finalStatus = calculateInspectionOrderStatus(itemStatuses);

      // 更新验货单状态
      const doc = await prisma.inspectionOrder.update({
        where: { id },
        data: {
          status: finalStatus,
          updatedBy: userId,
        },
      });

      // 【业务逻辑补充】如果是终验节点，回写采购合同明细的验货信息
      if (
        order.inspectionNode === 'FINAL' &&
        order.purchaseContractCode &&
        order.items.length > 0
      ) {
        await updatePurchaseContractInspectionData(
          prisma,
          order.items,
          order.actualInspectionTime || new Date(),
          userId
        );
      }

      return {
        data: doc,
        message: `验货完成，${
          finalStatus === 'PASSED'
            ? '验货通过'
            : finalStatus === 'FAILED'
            ? '验货不通过'
            : '部分通过'
        }`,
      };
    },

    /** 让步放行 */
    async concessionRelease({ id, body, userId, prisma }) {
      const order = await prisma.inspectionOrder.findUnique({
        where: { id },
        select: {
          status: true,
          inspectionNode: true,
          purchaseContractCode: true,
          actualInspectionTime: true,
        },
        include: {
          items: { where: { deletedAt: null } },
        },
      });

      if (!order) {
        throw new Error('验货单不存在');
      }

      // 更新明细的处理标识
      const itemIds = body.itemIds || [];
      if (itemIds.length > 0) {
        await prisma.inspectionOrderItem.updateMany({
          where: {
            id: { in: itemIds },
            inspectionOrderId: id,
          },
          data: {
            processFlag: 'CONCESSION_RELEASE',
            updatedBy: userId,
          },
        });

        // 【业务逻辑补充】让步放行后，如果是终验节点，回写采购合同
        if (order.inspectionNode === 'FINAL' && order.purchaseContractCode) {
          const updatedItems = await prisma.inspectionOrderItem.findMany({
            where: {
              id: { in: itemIds },
              deletedAt: null,
            },
          });

          await updatePurchaseContractInspectionData(
            prisma,
            updatedItems,
            order.actualInspectionTime || new Date(),
            userId
          );
        }
      }

      const doc = await prisma.inspectionOrder.findUnique({
        where: { id },
      });

      return { data: doc, message: '让步放行成功' };
    },

    /** 创建重验单 */
    async createReinspection({ id, userId, prisma }) {
      const order = await prisma.inspectionOrder.findUnique({
        where: { id },
        include: {
          items: {
            where: {
              deletedAt: null,
              OR: [
                { inspectionStatus: 'FAILED' },
                { inspectionStatus: 'NOT_INSPECTED' },
              ],
            },
          },
        },
      });

      if (!order) {
        throw new Error('验货单不存在');
      }

      if (!order.items || order.items.length === 0) {
        throw new Error('没有需要重验的明细');
      }

      // 创建重验单
      const reinspectionCode = `${order.code}-R${Date.now()}`;
      
      const newOrder = await prisma.inspectionOrder.create({
        data: {
          code: reinspectionCode,
          status: 'DRAFT',
          approvalStatus: 'PENDING',
          isReinspection: true,
          relatedInspectionOrderId: order.id,
          relatedInspectionOrderCode: order.code,
          purchaseContractId: order.purchaseContractId,
          purchaseContractCode: order.purchaseContractCode,
          supplierId: order.supplierId,
          supplierCode: order.supplierCode,
          supplierName: order.supplierName,
          warehouseId: order.warehouseId,
          warehouseName: order.warehouseName,
          inspectionNode: order.inspectionNode,
          inspectionMethod: order.inspectionMethod,
          companyId: order.companyId,
          companyName: order.companyName,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 创建明细
      for (const [index, item] of order.items.entries()) {
        await prisma.inspectionOrderItem.create({
          data: {
            inspectionOrderId: newOrder.id,
            lineNumber: index + 1,
            skuId: item.skuId,
            skuCode: item.skuCode,
            skuName: item.skuName,
            purchaseQuantity: item.purchaseQuantity,
            purchaseContractItemId: item.purchaseContractItemId,
            purchaseContractCode: item.purchaseContractCode,
            baseProductCode: item.baseProductCode,
            thumbnail: item.thumbnail,
            packageMethod: item.packageMethod,
            specification: item.specification,
            inspectionStatus: 'NOT_INSPECTED',
            reworkNote: `原验货单 ${order.code} 不合格需重验`,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      return { data: newOrder, message: '重验单创建成功' };
    },
  },
};

// ==================== Helper Functions ====================

/**
 * 根据明细验货状态计算整单状态
 * 
 * @param itemStatuses - 明细验货状态数组
 * @returns 整单状态
 */
function calculateInspectionOrderStatus(itemStatuses: string[]): string {
  const uniqueStatuses = Array.from(new Set(itemStatuses));

  // 全部通过 → PASSED
  if (uniqueStatuses.length === 1 && uniqueStatuses[0] === 'PASSED') {
    return 'PASSED';
  }

  // 全部不通过（包含 FAILED 和 NOT_INSPECTED） → FAILED
  if (
    uniqueStatuses.length === 1 &&
    (uniqueStatuses[0] === 'FAILED' || uniqueStatuses[0] === 'NOT_INSPECTED')
  ) {
    return 'FAILED';
  }

  // 存在 PASSED，也存在 FAILED/NOT_INSPECTED → PARTIALLY_PASSED (部分通过)
  if (uniqueStatuses.includes('PASSED')) {
    return 'PASSED'; // TypeScript schema 没有 PARTIALLY_PASSED，用 PASSED 表示
  }

  // 默认为验货中
  return 'INSPECTING';
}

/**
 * 回写采购合同明细的验货信息
 * 
 * @param prisma - Prisma client
 * @param items - 验货单明细
 * @param inspectionTime - 验货时间
 * @param userId - 操作用户ID
 */
async function updatePurchaseContractInspectionData(
  prisma: any,
  items: any[],
  inspectionTime: Date,
  userId: string
) {
  for (const item of items) {
    if (!item.purchaseContractItemId) {
      continue;
    }

    // 更新采购合同明细的验货状态和数量
    await prisma.purchaseContractItem.update({
      where: { id: item.purchaseContractItemId },
      data: {
        inspectionStatus: item.inspectionStatus || 'NOT_INSPECTED',
        inspectedQuantity: item.purchaseQuantity || 0,
        inspectionTime: inspectionTime,
        updatedBy: userId,
      },
    });
  }

  // 更新采购合同主表的验货状态
  if (items.length > 0 && items[0].purchaseContractCode) {
    const contractCode = items[0].purchaseContractCode;
    
    // 查询该采购合同所有明细的验货状态
    const allItems = await prisma.purchaseContractItem.findMany({
      where: {
        purchaseContractCode: contractCode,
        deletedAt: null,
      },
      select: { inspectionStatus: true },
    });

    const allStatuses = allItems
      .map((i: any) => i.inspectionStatus)
      .filter(Boolean);
    
    let contractInspectionStatus = 'NOT_INSPECTED';
    
    if (allStatuses.length > 0) {
      const uniqueStatuses = Array.from(new Set(allStatuses));
      
      if (uniqueStatuses.length === 1 && uniqueStatuses[0] === 'PASSED') {
        contractInspectionStatus = 'PASSED';
      } else if (uniqueStatuses.includes('PASSED')) {
        contractInspectionStatus = 'INSPECTING'; // 部分通过
      } else if (
        uniqueStatuses.every((s) => s === 'FAILED' || s === 'NOT_INSPECTED')
      ) {
        contractInspectionStatus = 'FAILED';
      }
    }

    // 更新采购合同主表
    await prisma.purchaseContract.updateMany({
      where: { code: contractCode },
      data: {
        inspectionStatus: contractInspectionStatus,
        updatedBy: userId,
      },
    });
  }
}
