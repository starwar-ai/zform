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
      const doc = await prisma.processingOrder.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedTime: new Date(),
          updatedBy: userId,
        },
      });
      return { data: doc, message: '加工单已完成' };
    },

    /** 结案 */
    async close({ id, body, userId, prisma }) {
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
