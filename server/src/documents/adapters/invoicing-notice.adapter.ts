/**
 * 开票通知 Adapter
 */

import type { DocumentTypeAdapter } from '../types';

export const invoicingNoticeAdapter: DocumentTypeAdapter = {
  typeId: 'invoicing_notice',
  typeName: '开票通知',

  // ---- Prisma 映射 ----
  prismaModel: 'invoicingNotice',
  prismaItemModel: 'invoicingNoticeItem',
  parentForeignKey: 'invoicingNoticeId',
  itemRelationName: 'items',

  // ---- 基础筛选条件 ----
  baseWhere: {},

  // ---- 搜索 ----
  searchFields: [
    'code',
    'orderLinkCode',
    'shippingInvoiceNo',
    'shippingOrderNo',
    'purchaseOrderNo',
    'companyName',
    'supplierName',
    'supplierId',
    'entryPerson',
    'merchandiser',
    'invoiceNo',
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
    entryDate: 'entryDate',
    sourceType: 'sourceType',
    isManual: 'isManual',
    orderLinkCode: 'orderLinkCode',
    shippingInvoiceNo: 'shippingInvoiceNo',
    shippingOrderNo: 'shippingOrderNo',
    purchaseOrderNo: 'purchaseOrderNo',
    companyName: 'companyName',
    supplierName: 'supplierName',
    supplierId: 'supplierId',
    entryPerson: 'entryPerson',
    merchandiser: 'merchandiser',
    invoiceNo: 'invoiceNo',
    invoiceDate: 'invoiceDate',
    invoiceStatus: 'invoiceStatus',
    printStatus: 'printStatus',
    printDate: 'printDate',
    approvalStatus: 'approvalStatus',
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
      // 主数据字段
      entryDate: row.entryDate,
      sourceType: row.sourceType,
      isManual: row.isManual,
      orderLinkCode: row.orderLinkCode,
      shippingInvoiceNo: row.shippingInvoiceNo,
      shippingOrderNo: row.shippingOrderNo,
      purchaseOrderNo: row.purchaseOrderNo,
      companyName: row.companyName,
      supplierName: row.supplierName,
      supplierId: row.supplierId,
      entryPerson: row.entryPerson,
      merchandiser: row.merchandiser,
      invoiceNo: row.invoiceNo,
      invoiceDate: row.invoiceDate,
      invoiceStatus: row.invoiceStatus,
      printStatus: row.printStatus,
      printDate: row.printDate,
      approvalStatus: row.approvalStatus,
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
      entryDate: masterRow.entryDate,
      supplierName: masterRow.supplierName,
      shippingInvoiceNo: masterRow.shippingInvoiceNo,
      // 明细数据
      productId: detailRow.productId,
      skuCode: detailRow.skuCode,
      productName: detailRow.productName,
      baseProductCode: detailRow.baseProductCode,
      customerProductNo: detailRow.customerProductNo,
      specification: detailRow.specification,
      outerBoxQuantity: detailRow.outerBoxQuantity,
      isSeparateBox: detailRow.isSeparateBox,
      quantityBefore: detailRow.quantityBefore ? Number(detailRow.quantityBefore) : 0,
      noticeQuantity: detailRow.noticeQuantity ? Number(detailRow.noticeQuantity) : 0,
      customsQuantity: detailRow.customsQuantity ? Number(detailRow.customsQuantity) : 0,
      totalPurchaseQty: detailRow.totalPurchaseQty ? Number(detailRow.totalPurchaseQty) : 0,
      purchaseTaxPrice: detailRow.purchaseTaxPrice ? Number(detailRow.purchaseTaxPrice) : 0,
      invoiceUnitPrice: detailRow.invoiceUnitPrice ? Number(detailRow.invoiceUnitPrice) : 0,
      taxRate: detailRow.taxRate ? Number(detailRow.taxRate) : 0,
      hsCode: detailRow.hsCode,
      customsUnit: detailRow.customsUnit,
      invoiceProductName: detailRow.invoiceProductName,
      purchaseContractId: detailRow.purchaseContractId,
      purchaseSeq: detailRow.purchaseSeq,
      salesContractCode: detailRow.salesContractCode,
      customerId: detailRow.customerId,
      customerName: detailRow.customerName,
      purchaseCurrency: detailRow.purchaseCurrency,
      invoicingStatus: detailRow.invoicingStatus,
      invoiceRegStatus: detailRow.invoiceRegStatus,
      invoiceRegQty: detailRow.invoiceRegQty ? Number(detailRow.invoiceRegQty) : 0,
      isManual: detailRow.isManual,
      remark: detailRow.remark,
    };
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;
      const doc = await prisma.invoicingNotice.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'CANCELLED',
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          updatedBy: userId,
        },
      });
      return {
        data: doc,
        message: `开票通知${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const doc = await prisma.invoicingNotice.update({
        where: { id },
        data: {
          status: body.status,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '开票通知状态更新成功' };
    },

    /** 更新开票状态 */
    async updateInvoiceStatus({ id, body, userId, prisma }) {
      const doc = await prisma.invoicingNotice.update({
        where: { id },
        data: {
          invoiceStatus: body.invoiceStatus,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '开票状态更新成功' };
    },
  },
};
