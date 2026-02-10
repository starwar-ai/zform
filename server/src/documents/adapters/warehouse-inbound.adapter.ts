/**
 * 入库单 Adapter
 */

import type { DocumentTypeAdapter } from '../types';

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
      _id: row.id,
      _docNumber: row.code,
      _status: row.orderStatus,
      _createdAt: row.createdAt,
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
      _id: detailRow.id,
      _docNumber: masterRow.code,
      _status: masterRow.orderStatus,
      _createdAt: masterRow.createdAt,
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

  // ---- 自定义操作 ----
  actions: {},
};
