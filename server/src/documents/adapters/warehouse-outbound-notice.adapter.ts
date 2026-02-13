/**
 * 出库通知单 Adapter (Warehouse Outbound Notice)
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
 * 出库通知单状态流转配置
 */
const OUTBOUND_NOTICE_STATUS_CONFIG = {
  transitions: {
    DRAFT: ['PENDING', 'CANCELLED'],
    PENDING: ['APPROVED', 'DRAFT', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  },
};

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

  // ---- 生命周期钩子 ----
  async onCreate(data, userId, prismaClient) {
    // 设置默认值
    if (!data.noticeTime) {
      data.noticeTime = new Date();
    }
    if (!data.noticeStatus) {
      data.noticeStatus = 'DRAFT';
    }
    if (!data.type) {
      data.type = 'OUTBOUND';
    }
  },

  async onUpdate(id, data, userId, prismaClient) {
    // 验证状态流转
    if (data.noticeStatus) {
      const current = await prismaClient.warehouseNotice.findUnique({
        where: { id },
        select: { noticeStatus: true },
      });

      if (current && current.noticeStatus !== data.noticeStatus) {
        validateStatusTransition(
          current.noticeStatus,
          data.noticeStatus,
          OUTBOUND_NOTICE_STATUS_CONFIG
        );
      }
    }
  },

  async beforeDelete(id: string, prismaClient: any) {
    const notice = await prismaClient.warehouseNotice.findUnique({
      where: { id },
      select: { noticeStatus: true, code: true },
    });

    if (!notice) {
      throw new Error('出库通知单不存在');
    }

    if (['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(notice.noticeStatus)) {
      throw new Error(`出库通知单 ${notice.code} 状态为 ${notice.noticeStatus}，不允许删除`);
    }

    // 检查是否有下游出库单
    const outboundOrders = await prismaClient.warehouseOrder.count({
      where: { 
        noticeId: id, 
        type: 'OUTBOUND',
        deletedAt: null 
      },
    });

    if (outboundOrders > 0) {
      throw new Error(`出库通知单 ${notice.code} 已生成 ${outboundOrders} 个出库单，无法删除`);
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;

      const notice = await prisma.warehouseNotice.findUnique({
        where: { id },
        select: { noticeStatus: true, code: true },
      });

      if (!notice) {
        throw new Error('出库通知单不存在');
      }

      if (notice.noticeStatus !== 'PENDING') {
        throw new Error(`出库通知单 ${notice.code} 状态为 ${notice.noticeStatus}，无法审核`);
      }

      const doc = await prisma.warehouseNotice.update({
        where: { id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          noticeStatus: approved ? 'APPROVED' : 'PENDING',
          updatedBy: userId,
        },
      });

      return {
        data: doc,
        message: `出库通知单${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const { status } = body;

      validateRequiredFields(body, ['status']);

      const current = await prisma.warehouseNotice.findUnique({
        where: { id },
        select: { noticeStatus: true, code: true },
      });

      if (!current) {
        throw new Error('出库通知单不存在');
      }

      validateStatusTransition(
        current.noticeStatus,
        status,
        OUTBOUND_NOTICE_STATUS_CONFIG
      );

      const notice = await prisma.warehouseNotice.update({
        where: { id },
        data: {
          noticeStatus: status,
          updatedBy: userId,
        },
      });

      return { data: notice, message: '状态更新成功' };
    },

    /** 获取关联单据 */
    async getRelatedDocuments({ id, prisma }) {
      const result = await queryRelatedDocuments(prisma, [
        {
          model: 'warehouseOrder',
          where: { noticeId: id, type: 'OUTBOUND', deletedAt: null },
          select: {
            id: true,
            code: true,
            orderStatus: true,
            warehouseCode: true,
            warehouseName: true,
            createdAt: true,
          },
          label: 'outboundOrders',
        },
      ]);

      return {
        data: result,
        message: '关联单据查询成功',
      };
    },

    /** 批量审核 */
    async batchApprove({ body, userId, prisma }) {
      const { ids, approved } = body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('请选择要审核的出库通知单');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          const notice = await prisma.warehouseNotice.findUnique({
            where: { id },
            select: { code: true, noticeStatus: true },
          });

          if (!notice) {
            throw new Error('出库通知单不存在');
          }

          if (notice.noticeStatus !== 'PENDING') {
            throw new Error(`状态为 ${notice.noticeStatus}，无法审核`);
          }

          return await prisma.warehouseNotice.update({
            where: { id },
            data: {
              approvalStatus: approved ? 'APPROVED' : 'REJECTED',
              noticeStatus: approved ? 'APPROVED' : 'PENDING',
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
      const notice = await prisma.warehouseNotice.update({
        where: { id },
        data: {
          printStatus: 'PRINTED',
          printCount: { increment: 1 },
        },
      });

      return {
        data: notice,
        message: '打印成功',
      };
    },

    /** 批量打印 */
    async batchPrint({ body, prisma }) {
      const { ids } = body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('请选择要打印的出库通知单');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          return await prisma.warehouseNotice.update({
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
  },
};
