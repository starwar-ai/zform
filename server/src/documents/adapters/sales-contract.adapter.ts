/**
 * 销售合同 Adapter
 */

import type { DocumentTypeAdapter } from '../types';

export const salesContractAdapter: DocumentTypeAdapter = {
  typeId: 'sales_contract',
  typeName: '销售合同',

  // ---- Prisma 映射 ----
  prismaModel: 'salesContract',
  prismaItemModel: 'salesContractItem',
  parentForeignKey: 'salesContractId',
  itemRelationName: 'items',

  // ---- 搜索 ----
  searchFields: [
    'code',
    'internalCode',
    'customerCode',
    'customerName',
    'customerPoNo',
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
    customerPoNo: 'customerPoNo',
    currency: 'currency',
    totalAmount: 'totalAmount',
    salesPerson: 'salesPerson',
    contractType: 'contractType',
    approvalStatus: 'approvalStatus',
  },

  // ---- 聚合 ----
  aggregateFields: [
    { field: 'totalAmount', type: 'sum', columnId: 'totalAmount' },
    { field: 'totalQuantity', type: 'sum', columnId: 'totalQuantity' },
    { field: 'totalBoxes', type: 'sum', columnId: 'totalBoxes' },
    { field: 'totalGrossWeight', type: 'sum', columnId: 'totalGrossWeight' },
    { field: 'totalNetWeight', type: 'sum', columnId: 'totalNetWeight' },
    { field: 'totalVolume', type: 'sum', columnId: 'totalVolume' },
    { field: 'orderGrossProfit', type: 'sum', columnId: 'orderGrossProfit' },
  ],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.status,
      _createdAt: row.createdAt,
      _sourceTypeId: row.sourceContractId ? 'sales_contract' : undefined,
      // 主数据字段
      customerId: row.customerId,
      customerCode: row.customerCode,
      customerName: row.customerName,
      customerPoNo: row.customerPoNo,
      currency: row.currency,
      totalAmount: row.totalAmount ? Number(row.totalAmount) : 0,
      salesPerson: row.salesPerson,
      merchandiser: row.merchandiser,
      buyer: row.buyer,
      contractType: row.contractType,
      approvalStatus: row.approvalStatus,
      confirmStatus: row.confirmStatus,
      printStatus: row.printStatus,
      signBackStatus: row.signBackStatus,
      toPurchasePlan: row.toPurchasePlan,
      totalQuantity: row.totalQuantity ? Number(row.totalQuantity) : 0,
      totalBoxes: row.totalBoxes || 0,
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
      // 明细数据
      lineNumber: detailRow.lineNumber,
      productCode: detailRow.productCode,
      productName: detailRow.productName,
      productSpec: detailRow.productSpec,
      quantity: detailRow.quantity ? Number(detailRow.quantity) : 0,
      unitPrice: detailRow.unitPrice ? Number(detailRow.unitPrice) : 0,
      amount: detailRow.amount ? Number(detailRow.amount) : 0,
      unit: detailRow.unit,
      deliveryDate: detailRow.deliveryDate,
      remark: detailRow.remark,
    };
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          status: approved ? 'APPROVED' : 'PENDING',
          updatedBy: userId,
        },
      });
      return {
        data: doc,
        message: `销售合同${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 确认 */
    async confirm({ id, userId, prisma }) {
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          confirmStatus: 'CONFIRMED',
          updatedBy: userId,
        },
      });
      return { data: doc, message: '销售合同确认成功' };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          status: body.status,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '合同状态更新成功' };
    },

    /** 回签 */
    async signBack({ id, body, userId, prisma }) {
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          signBackStatus: 'SIGNED',
          signBackPerson: userId,
          signBackDate: body.signBackDate || new Date(),
          signBackDescription: body.signBackDescription,
          signBackAttachments: body.signBackAttachments,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '回签成功' };
    },

    /** 打印 */
    async print({ id, userId, prisma }) {
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          printStatus: 'PRINTED',
          printCount: { increment: 1 },
          updatedBy: userId,
        },
      });
      return { data: doc, message: '打印成功' };
    },

    /** 转采购计划 */
    async toPurchasePlan({ id, userId, prisma }) {
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          toPurchasePlan: true,
          toPurchasePlanTime: new Date(),
          updatedBy: userId,
        },
      });
      return { data: doc, message: '转采购计划成功' };
    },
  },
};
