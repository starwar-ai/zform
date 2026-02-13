/**
 * 结汇单 Adapter
 */

import type { DocumentTypeAdapter } from '../types';

export const exchangeSettlementAdapter: DocumentTypeAdapter = {
  typeId: 'exchange_settlement',
  typeName: '结汇单',

  // ---- Prisma 映射 ----
  prismaModel: 'exchangeSettlement',
  prismaItemModel: 'exchangeSettlementItem',
  parentForeignKey: 'exchangeSettlementId',
  itemRelationName: 'items',

  // ---- 基础筛选条件 ----
  baseWhere: {},

  // ---- 搜索 ----
  searchFields: [
    'code',
    'planCode',
    'invoiceNo',
    'orderLinkCode',
    'sourceCode',
    'shippingOrderNo',
    'tradingCompanyName',
    'salesPerson',
    'buyer',
  ],

  // ---- Includes ----
  listIncludes: {
    items: {
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 5,
    },
  },
  detailIncludes: {
    items: {
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    },
  },

  // ---- 默认排序 ----
  defaultOrderBy: { createdAt: 'desc' },

  // ---- 字段映射 (前端 columnId → Prisma 字段名) ----
  columnToPrismaField: {
    _docNumber: 'code',
    _status: 'status',
    _createdAt: 'createdAt',
    planCode: 'planCode',
    invoiceNo: 'invoiceNo',
    invoiceDate: 'invoiceDate',
    entryDate: 'entryDate',
    shippingDate: 'shippingDate',
    orderLinkCode: 'orderLinkCode',
    sourceCode: 'sourceCode',
    salesPerson: 'salesPerson',
    buyer: 'buyer',
    priceTerms: 'priceTerms',
    transportMethod: 'transportMethod',
    tradeMethod: 'tradeMethod',
    currency: 'currency',
    settlementMethodName: 'settlementMethodName',
    shippingCountryName: 'shippingCountryName',
    departurePortName: 'departurePortName',
    tradeCountryName: 'tradeCountryName',
    destinationPortName: 'destinationPortName',
    tradingCompanyName: 'tradingCompanyName',
    shippingAgentName: 'shippingAgentName',
    expectedPortArrivalDate: 'expectedPortArrivalDate',
    shippingOrderNo: 'shippingOrderNo',
    containerCount: 'containerCount',
    totalQuantity: 'totalQuantity',
    totalBoxes: 'totalBoxes',
    totalGrossWeight: 'totalGrossWeight',
    totalNetWeight: 'totalNetWeight',
    totalVolume: 'totalVolume',
    totalAmount: 'totalAmount',
    totalValue: 'totalValue',
    receivedValue: 'receivedValue',
    unreceivedValue: 'unreceivedValue',
  },

  // ---- 聚合 ----
  aggregateFields: [
    { field: 'totalQuantity', type: 'sum', columnId: 'totalQuantity' },
    { field: 'totalBoxes', type: 'sum', columnId: 'totalBoxes' },
    { field: 'totalGrossWeight', type: 'sum', columnId: 'totalGrossWeight' },
    { field: 'totalNetWeight', type: 'sum', columnId: 'totalNetWeight' },
    { field: 'totalVolume', type: 'sum', columnId: 'totalVolume' },
    { field: 'totalAmount', type: 'sum', columnId: 'totalAmount' },
    { field: 'totalValue', type: 'sum', columnId: 'totalValue' },
    { field: 'receivedValue', type: 'sum', columnId: 'receivedValue' },
    { field: 'unreceivedValue', type: 'sum', columnId: 'unreceivedValue' },
  ],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.status,
      _createdAt: row.createdAt,
      // 主数据字段
      planCode: row.planCode,
      invoiceNo: row.invoiceNo,
      invoiceDate: row.invoiceDate,
      entryDate: row.entryDate,
      shippingDate: row.shippingDate,
      orderLinkCode: row.orderLinkCode,
      sourceCode: row.sourceCode,
      salesPerson: row.salesPerson,
      buyer: row.buyer,
      priceTerms: row.priceTerms,
      transportMethod: row.transportMethod,
      tradeMethod: row.tradeMethod,
      currency: row.currency,
      settlementMethodName: row.settlementMethodName,
      shippingCountryName: row.shippingCountryName,
      departurePortName: row.departurePortName,
      tradeCountryName: row.tradeCountryName,
      destinationPortName: row.destinationPortName,
      tradingCompanyName: row.tradingCompanyName,
      shippingAgentName: row.shippingAgentName,
      expectedPortArrivalDate: row.expectedPortArrivalDate,
      shippingOrderNo: row.shippingOrderNo,
      containerCount: row.containerCount || 0,
      // 汇总统计
      totalQuantity: row.totalQuantity ? Number(row.totalQuantity) : 0,
      totalBoxes: row.totalBoxes || 0,
      totalGrossWeight: row.totalGrossWeight ? Number(row.totalGrossWeight) : 0,
      totalNetWeight: row.totalNetWeight ? Number(row.totalNetWeight) : 0,
      totalVolume: row.totalVolume ? Number(row.totalVolume) : 0,
      totalAmount: row.totalAmount ? Number(row.totalAmount) : 0,
      totalValue: row.totalValue ? Number(row.totalValue) : 0,
      receivedValue: row.receivedValue ? Number(row.receivedValue) : 0,
      unreceivedValue: row.unreceivedValue ? Number(row.unreceivedValue) : 0,
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
      shippingOrderNo: masterRow.shippingOrderNo,
      tradingCompanyName: masterRow.tradingCompanyName,
      // 明细数据
      barcode: detailRow.barcode,
      skuCode: detailRow.skuCode,
      customerProductNo: detailRow.customerProductNo,
      productNameCn: detailRow.productNameCn,
      productNameEn: detailRow.productNameEn,
      specification: detailRow.specification,
      shippingQuantity: detailRow.shippingQuantity ? Number(detailRow.shippingQuantity) : 0,
      exchangeQuantity: detailRow.exchangeQuantity ? Number(detailRow.exchangeQuantity) : 0,
      customsQuantity: detailRow.customsQuantity ? Number(detailRow.customsQuantity) : 0,
      unit: detailRow.unit,
      supplierName: detailRow.supplierName,
      customerName: detailRow.customerName,
      salesContractCode: detailRow.salesContractCode,
      purchaseContractCode: detailRow.purchaseContractCode,
      saleUnitPrice: detailRow.saleUnitPrice ? Number(detailRow.saleUnitPrice) : 0,
      saleAmount: detailRow.saleAmount ? Number(detailRow.saleAmount) : 0,
      customsUnitPrice: detailRow.customsUnitPrice ? Number(detailRow.customsUnitPrice) : 0,
      customsAmount: detailRow.customsAmount ? Number(detailRow.customsAmount) : 0,
      remark: detailRow.remark,
    };
  },

  // ---- 生命周期钩子 ----
  async onCreate(data, userId, prismaClient) {
    // 【业务逻辑补充】创建后更新出运单明细的转结汇标识
    if (data.items && Array.isArray(data.items)) {
      await updateShippingItemSettlementFlag(prismaClient, data.items, true, userId);
    }
  },

  async beforeDelete(id: string, prismaClient: any) {
    // 【业务逻辑补充】删除前回滚出运单明细的转结汇标识
    const settlement = await prismaClient.exchangeSettlement.findUnique({
      where: { id },
      include: {
        items: {
          where: { deletedAt: null },
        },
      },
    });

    if (settlement && settlement.items) {
      await updateShippingItemSettlementFlag(prismaClient, settlement.items, false, null);
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;
      const doc = await prisma.exchangeSettlement.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'CANCELLED',
          updatedBy: userId,
        },
      });
      return {
        data: doc,
        message: `结汇单${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const doc = await prisma.exchangeSettlement.update({
        where: { id },
        data: {
          status: body.status,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '结汇单状态更新成功' };
    },
  },
};

/**
 * 辅助函数：更新出运单明细的转结汇标识
 * @param prisma Prisma client
 * @param items 结汇单明细
 * @param toSettlement 是否转结汇（true: 创建时设置, false: 删除时回滚）
 * @param userId 用户ID
 */
async function updateShippingItemSettlementFlag(
  prisma: any,
  items: any[],
  toSettlement: boolean,
  userId: string | null
) {
  const shippingItemIds = items
    .map((item: any) => item.shippingItemId)
    .filter(Boolean);

  if (shippingItemIds.length === 0) return;

  // 批量更新出运单明细的转结汇标识
  for (const itemId of shippingItemIds) {
    await prisma.shippingOrderItem.update({
      where: { id: itemId },
      data: {
        convertedToSettlement: toSettlement,
        ...(userId && { updatedBy: userId }),
      },
    });
  }
}
