/**
 * 出库通知单 Adapter
 */

import type { DocumentTypeAdapter } from '../types';

export const warehouseOutboundNoticeAdapter: DocumentTypeAdapter = {
  typeId: 'warehouse_outbound_notice',
  typeName: '出库通知单',

  // ---- Prisma 映射 ----
  prismaModel: 'warehouseNotice',
  prismaItemModel: 'warehouseNoticeItem',
  parentForeignKey: 'warehouseNoticeId',
  itemRelationName: 'items',

  // ---- 基础筛选条件 ----
  baseWhere: { type: 'OUTBOUND' },

  // ---- 搜索 ----
  searchFields: [
    'code',
    'shippingInvoiceNo',
    'orderLinkCode',
    'shippingDetailCode',
    'contractCodes',
    'applicant',
    'billOfLadingNo',
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
    _status: 'noticeStatus',
    _createdAt: 'createdAt',
    manualFlag: 'manualFlag',
    approvalStatus: 'approvalStatus',
    shippingMethod: 'shippingMethod',
    shippingInvoiceNo: 'shippingInvoiceNo',
    orderLinkCode: 'orderLinkCode',
    shippingDetailCode: 'shippingDetailCode',
    contractCodes: 'contractCodes',
    applicant: 'applicant',
    isContainerNotice: 'isContainerNotice',
    billOfLadingNo: 'billOfLadingNo',
    warehouseEntryDate: 'warehouseEntryDate',
    type: 'type',
    noticeStatus: 'noticeStatus',
    noticeTime: 'noticeTime',
    expectedDate: 'expectedDate',
    companyName: 'companyName',
    printStatus: 'printStatus',
  },

  // ---- 聚合 ----
  aggregateFields: [
    { field: 'totalVolume', type: 'sum', columnId: 'totalVolume' },
    { field: 'totalGrossWeight', type: 'sum', columnId: 'totalGrossWeight' },
  ],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.noticeStatus,
      _createdAt: row.createdAt,
      // 主数据字段
      manualFlag: row.manualFlag,
      approvalStatus: row.approvalStatus,
      workflowInstanceId: row.workflowInstanceId,
      shippingMethod: row.shippingMethod,
      shippingInvoiceNo: row.shippingInvoiceNo,
      orderLinkCode: row.orderLinkCode,
      shippingDetailCode: row.shippingDetailCode,
      contractCodes: row.contractCodes,
      applicant: row.applicant,
      isContainerNotice: row.isContainerNotice,
      billOfLadingNo: row.billOfLadingNo,
      warehouseEntryDate: row.warehouseEntryDate,
      type: row.type,
      noticeStatus: row.noticeStatus,
      noticeTime: row.noticeTime,
      expectedDate: row.expectedDate,
      companyId: row.companyId,
      companyName: row.companyName,
      totalVolume: row.totalVolume ? Number(row.totalVolume) : undefined,
      totalGrossWeight: row.totalGrossWeight ? Number(row.totalGrossWeight) : undefined,
      printStatus: row.printStatus,
      printCount: row.printCount,
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
      _status: masterRow.noticeStatus,
      _createdAt: masterRow.createdAt,
      // 明细字段
      lineNumber: detailRow.lineNumber,
      inventoryDetailId: detailRow.inventoryDetailId,
      convertedToOrderFlag: detailRow.convertedToOrderFlag,
      isSeparateBox: detailRow.isSeparateBox,
      specification: detailRow.specification,
      merchandiser: detailRow.merchandiser,
      salesperson: detailRow.salesperson,
      buyer: detailRow.buyer,
      buyerDepartment: detailRow.buyerDepartment,
      warehouseCode: detailRow.warehouseCode,
      warehouseName: detailRow.warehouseName,
      pendingInboundQuantity: detailRow.pendingInboundQuantity ? Number(detailRow.pendingInboundQuantity) : undefined,
      inboundingQuantity: detailRow.inboundingQuantity ? Number(detailRow.inboundingQuantity) : undefined,
      actualInboundQuantity: detailRow.actualInboundQuantity ? Number(detailRow.actualInboundQuantity) : undefined,
      skuCode: detailRow.skuCode,
      skuName: detailRow.skuName,
      customerCode: detailRow.customerCode,
      customerName: detailRow.customerName,
      customerProductNo: detailRow.customerProductNo,
      supplierCode: detailRow.supplierCode,
      supplierName: detailRow.supplierName,
      expectedQuantity: detailRow.expectedQuantity ? Number(detailRow.expectedQuantity) : undefined,
      expectedBoxes: detailRow.expectedBoxes,
      remark: detailRow.remark,
    };
  },

  // ---- 自定义操作 ----
  actions: {},
};
