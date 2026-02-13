/**
 * 开票通知 Adapter (Invoicing Notice)
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
 * 开票通知状态流转配置
 */
const INVOICING_NOTICE_STATUS_CONFIG = {
  transitions: {
    DRAFT: ['PENDING', 'CANCELLED'],
    PENDING: ['APPROVED', 'DRAFT', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  },
};

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

  // ---- 生命周期钩子 ----
  async onCreate(data, userId, prismaClient) {
    // 设置默认值
    if (!data.entryDate) {
      data.entryDate = new Date();
    }
    if (!data.status) {
      data.status = 'DRAFT';
    }
    if (!data.invoiceStatus) {
      data.invoiceStatus = 'NOT_INVOICED';
    }

    // 【业务逻辑补充】创建后更新上游单据的开票状态
    // 根据 sourceType 决定更新哪个上游单据
    if (data.sourceType === 'SHIPPING_ORDER' && data.shippingOrderId && data.items) {
      // 更新出运单明细的开票数量和状态
      await updateShippingOrderInvoiceStatus(prismaClient, data.shippingOrderId, data.items);
    } else if (data.sourceType === 'PURCHASE_CONTRACT' && data.items) {
      // 更新采购合同明细的开票数量和状态
      await updatePurchaseContractInvoiceStatus(prismaClient, data.items);
    }
  },

  async onUpdate(id, data, userId, prismaClient) {
    // 验证状态流转
    if (data.status) {
      const current = await prismaClient.invoicingNotice.findUnique({
        where: { id },
        select: { status: true },
      });

      if (current && current.status !== data.status) {
        validateStatusTransition(
          current.status,
          data.status,
          INVOICING_NOTICE_STATUS_CONFIG
        );
      }
    }
  },

  async beforeDelete(id: string, prismaClient: any) {
    const notice = await prismaClient.invoicingNotice.findUnique({
      where: { id },
      select: { status: true, code: true },
    });

    if (!notice) {
      throw new Error('开票通知不存在');
    }

    if (['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(notice.status)) {
      throw new Error(`开票通知 ${notice.code} 状态为 ${notice.status}，不允许删除`);
    }

    // 检查是否有关联的发票登记
    const registrations = await prismaClient.invoiceRegistration.count({
      where: { invoicingNoticeId: id, deletedAt: null },
    });

    if (registrations > 0) {
      throw new Error(`开票通知 ${notice.code} 已有 ${registrations} 个发票登记，无法删除`);
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;

      const notice = await prisma.invoicingNotice.findUnique({
        where: { id },
        select: { status: true, code: true },
      });

      if (!notice) {
        throw new Error('开票通知不存在');
      }

      if (notice.status !== 'PENDING') {
        throw new Error(`开票通知 ${notice.code} 状态为 ${notice.status}，无法审核`);
      }

      const doc = await prisma.invoicingNotice.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'PENDING',
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
      const { status } = body;

      validateRequiredFields(body, ['status']);

      const current = await prisma.invoicingNotice.findUnique({
        where: { id },
        select: { status: true, code: true },
      });

      if (!current) {
        throw new Error('开票通知不存在');
      }

      validateStatusTransition(
        current.status,
        status,
        INVOICING_NOTICE_STATUS_CONFIG
      );

      const doc = await prisma.invoicingNotice.update({
        where: { id },
        data: {
          status,
          updatedBy: userId,
        },
      });

      return { data: doc, message: '开票通知状态更新成功' };
    },

    /** 更新开票状态 */
    async updateInvoiceStatus({ id, body, userId, prisma }) {
      const { invoiceStatus } = body;

      validateRequiredFields(body, ['invoiceStatus']);

      const doc = await prisma.invoicingNotice.update({
        where: { id },
        data: {
          invoiceStatus,
          updatedBy: userId,
        },
      });

      return { data: doc, message: '开票状态更新成功' };
    },

    /** 获取关联单据 */
    async getRelatedDocuments({ id, prisma }) {
      const result = await queryRelatedDocuments(prisma, [
        {
          model: 'invoiceRegistration',
          where: { invoicingNoticeId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            invoiceNo: true,
            invoiceAmount: true,
            createdAt: true,
          },
          label: 'invoiceRegistrations',
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
        throw new Error('请选择要审核的开票通知');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          const notice = await prisma.invoicingNotice.findUnique({
            where: { id },
            select: { code: true, status: true },
          });

          if (!notice) {
            throw new Error('开票通知不存在');
          }

          if (notice.status !== 'PENDING') {
            throw new Error(`状态为 ${notice.status}，无法审核`);
          }

          return await prisma.invoicingNotice.update({
            where: { id },
            data: {
              status: approved ? 'APPROVED' : 'PENDING',
              approvalStatus: approved ? 'APPROVED' : 'REJECTED',
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
      const notice = await prisma.invoicingNotice.update({
        where: { id },
        data: {
          printStatus: 'PRINTED',
          printDate: new Date(),
        },
      });

      return {
        data: notice,
        message: '打印成功',
      };
    },

    /** 从出运单生成 */
    async createFromShippingOrder({ body, userId, prisma }) {
      const { shippingOrderId, itemIds } = body;

      validateRequiredFields(body, ['shippingOrderId']);

      const shippingOrder = await prisma.shippingOrder.findUnique({
        where: { id: shippingOrderId },
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

      if (!shippingOrder) {
        throw new Error('出运单不存在');
      }

      if (shippingOrder.items.length === 0) {
        throw new Error('未找到选中的明细项');
      }

      // 生成编号
      const today = new Date();
      const prefix = `IN${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const lastNotice = await prisma.invoicingNotice.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
      });
      let seq = 1;
      if (lastNotice) {
        seq = parseInt(lastNotice.code.substring(prefix.length)) + 1;
      }
      const noticeCode = `${prefix}${String(seq).padStart(4, '0')}`;

      const notice = await prisma.invoicingNotice.create({
        data: {
          code: noticeCode,
          entryDate: new Date(),
          shippingOrderId: shippingOrder.id,
          shippingOrderNo: shippingOrder.code,
          shippingInvoiceNo: shippingOrder.invoiceNo,
          orderLinkCode: shippingOrder.orderLinkCode,
          status: 'DRAFT',
          invoiceStatus: 'NOT_INVOICED',
          sourceType: 'AUTO',
          isManual: false,
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: shippingOrder.items.map((item: any, index: number) => ({
              productId: item.productId,
              skuCode: item.productCode,
              productName: item.productName,
              noticeQuantity: item.quantity,
              customsQuantity: item.quantity,
              hsCode: item.hsCode,
              invoicingStatus: 'NOT_INVOICED',
              invoiceRegStatus: 'NOT_REGISTERED',
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        },
        include: { items: true },
      });

      return {
        data: notice,
        message: '开票通知生成成功',
      };
    },
  },
};

/**
 * 辅助函数：更新出运单明细的开票状态
 * @param prisma Prisma client
 * @param shippingOrderId 出运单ID
 * @param items 开票通知明细
 */
async function updateShippingOrderInvoiceStatus(
  prisma: any,
  shippingOrderId: string,
  items: any[]
) {
  // 统计每个出运单明细的开票数量
  const itemQuantityMap = new Map<string, number>();
  
  for (const item of items) {
    if (item.shippingOrderItemId) {
      const currentQty = itemQuantityMap.get(item.shippingOrderItemId) || 0;
      itemQuantityMap.set(
        item.shippingOrderItemId,
        currentQty + (item.noticeQuantity || 0)
      );
    }
  }

  // 批量更新出运单明细
  for (const [itemId, quantity] of itemQuantityMap.entries()) {
    await prisma.shippingOrderItem.update({
      where: { id: itemId },
      data: {
        invoicedQuantity: { increment: quantity },
        invoiceStatus: 'PARTIALLY_INVOICED', // 后续可根据数量判断是否完全开票
      },
    });
  }
}

/**
 * 辅助函数：更新采购合同明细的开票状态
 * @param prisma Prisma client
 * @param items 开票通知明细
 */
async function updatePurchaseContractInvoiceStatus(prisma: any, items: any[]) {
  // 统计每个采购合同明细的开票数量
  const itemQuantityMap = new Map<string, number>();
  
  for (const item of items) {
    if (item.purchaseContractItemId) {
      const currentQty = itemQuantityMap.get(item.purchaseContractItemId) || 0;
      itemQuantityMap.set(
        item.purchaseContractItemId,
        currentQty + (item.noticeQuantity || 0)
      );
    }
  }

  // 批量更新采购合同明细
  for (const [itemId, quantity] of itemQuantityMap.entries()) {
    // 获取当前明细信息
    const contractItem = await prisma.purchaseContractItem.findUnique({
      where: { id: itemId },
      select: { quantity: true, invoicedQuantity: true },
    });

    if (!contractItem) continue;

    const newInvoicedQty = (contractItem.invoicedQuantity || 0) + quantity;
    const totalQty = contractItem.quantity || 0;

    // 判断开票状态
    let invoiceStatus = 'NOT_INVOICED';
    if (newInvoicedQty > 0 && newInvoicedQty < totalQty) {
      invoiceStatus = 'PARTIALLY_INVOICED';
    } else if (newInvoicedQty >= totalQty) {
      invoiceStatus = 'FULLY_INVOICED';
    }

    await prisma.purchaseContractItem.update({
      where: { id: itemId },
      data: {
        invoicedQuantity: newInvoicedQty,
        invoiceStatus,
      },
    });
  }
}
