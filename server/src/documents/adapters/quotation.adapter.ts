/**
 * 报价单 Adapter
 */

import type { DocumentTypeAdapter } from '../types';

export const quotationAdapter: DocumentTypeAdapter = {
  typeId: 'quotation',
  typeName: '报价单',

  // ---- Prisma 映射 ----
  prismaModel: 'quotation',
  prismaItemModel: 'quotationItem',
  parentForeignKey: 'quotationId',
  itemRelationName: 'items',

  // ---- 基础筛选条件 ----
  baseWhere: {},

  // ---- 搜索 ----
  searchFields: [
    'code',
    'customerCode',
    'customerName',
    'customerContactName',
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
    customerId: 'customerId',
    customerCode: 'customerCode',
    customerName: 'customerName',
    isNewCustomer: 'isNewCustomer',
    customerContactName: 'customerContactName',
    countryName: 'countryName',
    currency: 'currency',
    salesPerson: 'salesPerson',
    validUntil: 'validUntil',
    approvalStatus: 'approvalStatus',
    printStatus: 'printStatus',
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
      customerId: row.customerId,
      customerCode: row.customerCode,
      customerName: row.customerName,
      isNewCustomer: row.isNewCustomer,
      customerContactName: row.customerContactName,
      countryId: row.countryId,
      countryName: row.countryName,
      internalCompanyId: row.internalCompanyId,
      internalCompanyName: row.internalCompanyName,
      departurePortId: row.departurePortId,
      departurePortName: row.departurePortName,
      currency: row.currency,
      priceTerms: row.priceTerms,
      validUntil: row.validUntil,
      salesPerson: row.salesPerson,
      approvalStatus: row.approvalStatus,
      printStatus: row.printStatus,
      processInstanceId: row.processInstanceId,
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
      currency: masterRow.currency,
      // 明细数据
      lineNumber: detailRow.lineNumber,
      productCode: detailRow.productCode,
      productNameCn: detailRow.productNameCn,
      productNameEn: detailRow.productNameEn,
      spec: detailRow.spec,
      productSpec: detailRow.productSpec,
      productImage: detailRow.productImage,
      baseProductCode: detailRow.baseProductCode,
      customerProductNo: detailRow.customerProductNo,
      isSelfOwnedProduct: detailRow.isSelfOwnedProduct,
      isCustomerProduct: detailRow.isCustomerProduct,
      isSeparateContainer: detailRow.isSeparateContainer,
      unitPrice: detailRow.unitPrice ? Number(detailRow.unitPrice) : 0,
      taxUnitPrice: detailRow.taxUnitPrice ? Number(detailRow.taxUnitPrice) : 0,
      minOrderQuantity: detailRow.minOrderQuantity ? Number(detailRow.minOrderQuantity) : 0,
      commissionRate: detailRow.commissionRate ? Number(detailRow.commissionRate) : 0,
      supplierId: detailRow.supplierId,
      supplierCode: detailRow.supplierCode,
      supplierName: detailRow.supplierName,
      bulkCargo: detailRow.bulkCargo ? Number(detailRow.bulkCargo) : 0,
      container20ft: detailRow.container20ft ? Number(detailRow.container20ft) : 0,
      container40ft: detailRow.container40ft ? Number(detailRow.container40ft) : 0,
      container40hq: detailRow.container40hq ? Number(detailRow.container40hq) : 0,
      packageMethod: detailRow.packageMethod,
      innerBoxQty: detailRow.innerBoxQty ? Number(detailRow.innerBoxQty) : 0,
      outerBoxQty: detailRow.outerBoxQty ? Number(detailRow.outerBoxQty) : 0,
      boxCount: detailRow.boxCount,
      outerBoxUnit: detailRow.outerBoxUnit,
      outerBoxLength: detailRow.outerBoxLength ? Number(detailRow.outerBoxLength) : 0,
      outerBoxWidth: detailRow.outerBoxWidth ? Number(detailRow.outerBoxWidth) : 0,
      outerBoxHeight: detailRow.outerBoxHeight ? Number(detailRow.outerBoxHeight) : 0,
      outerBoxVolume: detailRow.outerBoxVolume ? Number(detailRow.outerBoxVolume) : 0,
      outerBoxNetWeight: detailRow.outerBoxNetWeight ? Number(detailRow.outerBoxNetWeight) : 0,
      outerBoxGrossWeight: detailRow.outerBoxGrossWeight ? Number(detailRow.outerBoxGrossWeight) : 0,
      productDescription: detailRow.productDescription,
      productDescriptionEn: detailRow.productDescriptionEn,
      hsCode: detailRow.hsCode,
      deliveryDate: detailRow.deliveryDate,
    };
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;
      const doc = await prisma.quotation.update({
        where: { id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          status: approved ? 'APPROVED' : 'DRAFT',
          updatedBy: userId,
        },
      });
      return {
        data: doc,
        message: `报价单${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 接受报价 */
    async accept({ id, userId, prisma }) {
      const doc = await prisma.quotation.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          updatedBy: userId,
        },
      });
      return { data: doc, message: '报价单已接受' };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const doc = await prisma.quotation.update({
        where: { id },
        data: {
          status: body.status,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '报价单状态更新成功' };
    },

    /** 打印 */
    async print({ id, userId, prisma }) {
      const doc = await prisma.quotation.update({
        where: { id },
        data: {
          printStatus: 'PRINTED',
          updatedBy: userId,
        },
      });
      return { data: doc, message: '打印成功' };
    },

    /** 转销售合同 */
    async toSalesContract({ id, userId, prisma }) {
      // 标记为已接受状态
      const doc = await prisma.quotation.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          updatedBy: userId,
        },
      });
      return { data: doc, message: '转销售合同成功' };
    },
  },
};
