/**
 * 发票登记 Adapter (Invoice Registration)
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
 * 发票登记状态流转配置
 */
const INVOICE_REGISTRATION_STATUS_CONFIG = {
  transitions: {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['APPROVED', 'DRAFT', 'CANCELLED'],
    APPROVED: [],
    CANCELLED: [],
  },
};

export const invoiceRegistrationAdapter: DocumentTypeAdapter = {
  typeId: 'invoice_registration',
  typeName: '发票登记',

  // ---- Prisma 映射 ----
  prismaModel: 'invoiceRegistration',
  prismaItemModel: 'invoiceRegistrationItem',
  parentForeignKey: 'invoiceRegistrationId',
  itemRelationName: 'items',

  // ---- 搜索 ----
  searchFields: [
    'code',
    'invoiceNo',
    'invoiceCode',
    'supplierName',
    'supplierCode',
    'paymentEntityName',
    'purchaseOrderNo',
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

  // ---- 字段映射 ----
  columnToPrismaField: {
    _docNumber: 'code',
    _status: 'status',
    _createdAt: 'createdAt',
    status: 'status',
    approvalStatus: 'approvalStatus',
    invoiceNo: 'invoiceNo',
    invoiceCode: 'invoiceCode',
    invoiceType: 'invoiceType',
    invoiceDate: 'invoiceDate',
    supplierName: 'supplierName',
    supplierCode: 'supplierCode',
    paymentEntityName: 'paymentEntityName',
    invoiceAmount: 'invoiceAmount',
    taxAmount: 'taxAmount',
    totalAmount: 'totalAmount',
    registrationDate: 'registrationDate',
  },

  // ---- 聚合 ----
  aggregateFields: [
    { field: 'invoiceAmount', type: 'sum', columnId: 'invoiceAmount' },
    { field: 'taxAmount', type: 'sum', columnId: 'taxAmount' },
    { field: 'totalAmount', type: 'sum', columnId: 'totalAmount' },
  ],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.status,
      _createdAt: row.createdAt,
      _sourceTypeId: row.invoicingNoticeId ? 'invoicing_notice' : undefined,
      // 主数据字段
      status: row.status,
      approvalStatus: row.approvalStatus,
      invoiceNo: row.invoiceNo,
      invoiceCode: row.invoiceCode,
      invoiceType: row.invoiceType,
      invoiceDate: row.invoiceDate,
      supplierName: row.supplierName,
      supplierCode: row.supplierCode,
      supplierId: row.supplierId,
      paymentEntityId: row.paymentEntityId,
      paymentEntityName: row.paymentEntityName,
      invoiceAmount: row.invoiceAmount ? Number(row.invoiceAmount) : 0,
      taxAmount: row.taxAmount ? Number(row.taxAmount) : 0,
      totalAmount: row.totalAmount ? Number(row.totalAmount) : 0,
      registrationDate: row.registrationDate,
      purchaseOrderNo: row.purchaseOrderNo,
      invoicingNoticeId: row.invoicingNoticeId,
      remark: row.remark,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
      updatedAt: row.updatedAt,
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
      invoiceNo: masterRow.invoiceNo,
      supplierName: masterRow.supplierName,
      // 明细数据
      lineNumber: detailRow.lineNumber,
      productId: detailRow.productId,
      productCode: detailRow.productCode,
      productName: detailRow.productName,
      specification: detailRow.specification,
      quantity: detailRow.quantity ? Number(detailRow.quantity) : 0,
      unit: detailRow.unit,
      unitPrice: detailRow.unitPrice ? Number(detailRow.unitPrice) : 0,
      taxRate: detailRow.taxRate ? Number(detailRow.taxRate) : 0,
      amount: detailRow.amount ? Number(detailRow.amount) : 0,
      taxAmount: detailRow.taxAmount ? Number(detailRow.taxAmount) : 0,
      totalAmount: detailRow.totalAmount ? Number(detailRow.totalAmount) : 0,
      hsCode: detailRow.hsCode,
      remark: detailRow.remark,
    };
  },

  // ---- 生命周期钩子 ----
  async onCreate(data, userId, prismaClient) {
    // 设置默认值
    if (!data.registrationDate) {
      data.registrationDate = new Date();
    }
    if (!data.status) {
      data.status = 'DRAFT';
    }
    if (!data.approvalStatus) {
      data.approvalStatus = 'PENDING';
    }

    // 【业务逻辑补充】校验登记数量不能超过开票通知数量
    if (data.invoicingNoticeId && data.items && Array.isArray(data.items)) {
      await validateRegistrationQuantity(prismaClient, data.invoicingNoticeId, data.items);
    }

    // 计算汇总金额
    if (data.items && Array.isArray(data.items)) {
      let invoiceAmount = new Decimal(0);
      let taxAmount = new Decimal(0);
      let totalAmount = new Decimal(0);

      for (const item of data.items) {
        const qty = new Decimal(item.quantity || 0);
        const price = new Decimal(item.unitPrice || 0);
        const rate = new Decimal(item.taxRate || 0);

        const amt = qty.mul(price);
        const tax = amt.mul(rate).div(100);
        const total = amt.add(tax);

        invoiceAmount = invoiceAmount.add(amt);
        taxAmount = taxAmount.add(tax);
        totalAmount = totalAmount.add(total);

        // 更新明细金额
        item.amount = amt.toNumber();
        item.taxAmount = tax.toNumber();
        item.totalAmount = total.toNumber();
      }

      data.invoiceAmount = invoiceAmount.toNumber();
      data.taxAmount = taxAmount.toNumber();
      data.totalAmount = totalAmount.toNumber();
    }
  },

  async onUpdate(id, data, userId, prismaClient) {
    // 重新计算汇总金额
    const summary = await calculateDocumentSummary(
      prismaClient,
      'invoiceRegistrationItem',
      'invoiceRegistrationId',
      id,
      [
        { sourceField: 'amount', destField: 'invoiceAmount', type: 'sum' },
        { sourceField: 'taxAmount', destField: 'taxAmount', type: 'sum' },
        { sourceField: 'totalAmount', destField: 'totalAmount', type: 'sum' },
      ]
    );
    Object.assign(data, summary);

    // 验证状态流转
    if (data.status) {
      const current = await prismaClient.invoiceRegistration.findUnique({
        where: { id },
        select: { status: true },
      });

      if (current && current.status !== data.status) {
        validateStatusTransition(
          current.status,
          data.status,
          INVOICE_REGISTRATION_STATUS_CONFIG
        );
      }
    }
  },

  async beforeDelete(id: string, prismaClient: any) {
    const registration = await prismaClient.invoiceRegistration.findUnique({
      where: { id },
      select: { status: true, code: true },
    });

    if (!registration) {
      throw new Error('发票登记不存在');
    }

    if (registration.status === 'APPROVED') {
      throw new Error(`发票登记 ${registration.code} 已审核，不允许删除`);
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;

      const registration = await prisma.invoiceRegistration.findUnique({
        where: { id },
        select: { 
          status: true, 
          code: true, 
          invoicingNoticeId: true,
          registrationDate: true,
        },
        include: {
          items: {
            where: { deletedAt: null },
          },
        },
      });

      if (!registration) {
        throw new Error('发票登记不存在');
      }

      if (registration.status !== 'SUBMITTED') {
        throw new Error(`发票登记 ${registration.code} 状态为 ${registration.status}，无法审核`);
      }

      // 【业务逻辑补充】审核通过后的级联更新
      if (approved) {
        // 1. 回写开票通知的登票日期
        if (registration.invoicingNoticeId) {
          await prisma.invoicingNotice.update({
            where: { id: registration.invoicingNoticeId },
            data: {
              registrationDate: registration.registrationDate || new Date(),
              invoiceStatus: 'REGISTERED',
            },
          });

          // 2. 更新开票通知明细的登记状态
          await updateInvoicingNoticeItemStatus(prisma, registration.items);
        }

        // 3. 更新采购合同明细的已登票数量
        await updatePurchaseContractRegisteredQty(prisma, registration.items);
      }

      const doc = await prisma.invoiceRegistration.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'SUBMITTED',
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          updatedBy: userId,
        },
      });

      return {
        data: doc,
        message: `发票登记${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const { status } = body;

      validateRequiredFields(body, ['status']);

      const current = await prisma.invoiceRegistration.findUnique({
        where: { id },
        select: { status: true, code: true },
      });

      if (!current) {
        throw new Error('发票登记不存在');
      }

      validateStatusTransition(
        current.status,
        status,
        INVOICE_REGISTRATION_STATUS_CONFIG
      );

      const registration = await prisma.invoiceRegistration.update({
        where: { id },
        data: {
          status,
          updatedBy: userId,
        },
      });

      return { data: registration, message: '状态更新成功' };
    },

    /** 批量审核 */
    async batchApprove({ body, userId, prisma }) {
      const { ids, approved } = body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('请选择要审核的发票登记');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          const registration = await prisma.invoiceRegistration.findUnique({
            where: { id },
            select: { code: true, status: true },
          });

          if (!registration) {
            throw new Error('发票登记不存在');
          }

          if (registration.status !== 'SUBMITTED') {
            throw new Error(`状态为 ${registration.status}，无法审核`);
          }

          return await prisma.invoiceRegistration.update({
            where: { id },
            data: {
              status: approved ? 'APPROVED' : 'SUBMITTED',
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

    /** 重新计算金额 */
    async recalculateAmount({ id, prisma }) {
      const summary = await calculateDocumentSummary(
        prisma,
        'invoiceRegistrationItem',
        'invoiceRegistrationId',
        id,
        [
          { sourceField: 'amount', destField: 'invoiceAmount', type: 'sum' },
          { sourceField: 'taxAmount', destField: 'taxAmount', type: 'sum' },
          { sourceField: 'totalAmount', destField: 'totalAmount', type: 'sum' },
        ]
      );

      const updated = await prisma.invoiceRegistration.update({
        where: { id },
        data: summary,
      });

      return {
        data: updated,
        message: '金额重新计算完成',
      };
    },

    /** 从开票通知生成 */
    async createFromInvoicingNotice({ body, userId, prisma }) {
      const { invoicingNoticeId, itemIds, invoiceInfo } = body;

      validateRequiredFields(body, ['invoicingNoticeId', 'invoiceInfo']);
      validateRequiredFields(invoiceInfo, ['invoiceNo', 'invoiceDate', 'invoiceType']);

      const notice = await prisma.invoicingNotice.findUnique({
        where: { id: invoicingNoticeId },
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

      if (!notice) {
        throw new Error('开票通知不存在');
      }

      if (notice.items.length === 0) {
        throw new Error('未找到选中的明细项');
      }

      // 生成编号
      const today = new Date();
      const prefix = `IR${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const lastReg = await prisma.invoiceRegistration.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
      });
      let seq = 1;
      if (lastReg) {
        seq = parseInt(lastReg.code.substring(prefix.length)) + 1;
      }
      const regCode = `${prefix}${String(seq).padStart(4, '0')}`;

      // 计算汇总金额
      let invoiceAmount = new Decimal(0);
      let taxAmount = new Decimal(0);
      let totalAmount = new Decimal(0);

      const items = notice.items.map((item: any, index: number) => {
        const qty = new Decimal(item.noticeQuantity || 0);
        const price = new Decimal(item.invoiceUnitPrice || 0);
        const rate = new Decimal(item.taxRate || 0);

        const amt = qty.mul(price);
        const tax = amt.mul(rate).div(100);
        const total = amt.add(tax);

        invoiceAmount = invoiceAmount.add(amt);
        taxAmount = taxAmount.add(tax);
        totalAmount = totalAmount.add(total);

        return {
          lineNumber: index + 1,
          productId: item.productId,
          productCode: item.skuCode,
          productName: item.productName,
          specification: item.specification,
          quantity: item.noticeQuantity,
          unitPrice: item.invoiceUnitPrice,
          taxRate: item.taxRate,
          amount: amt.toNumber(),
          taxAmount: tax.toNumber(),
          totalAmount: total.toNumber(),
          hsCode: item.hsCode,
          invoicingNoticeItemId: item.id,
          createdBy: userId,
          updatedBy: userId,
        };
      });

      const registration = await prisma.invoiceRegistration.create({
        data: {
          code: regCode,
          registrationDate: new Date(),
          invoicingNoticeId: notice.id,
          invoiceNo: invoiceInfo.invoiceNo,
          invoiceCode: invoiceInfo.invoiceCode,
          invoiceType: invoiceInfo.invoiceType,
          invoiceDate: invoiceInfo.invoiceDate,
          supplierId: notice.supplierId,
          supplierName: notice.supplierName,
          paymentEntityName: notice.companyName,
          purchaseOrderNo: notice.purchaseOrderNo,
          invoiceAmount: invoiceAmount.toNumber(),
          taxAmount: taxAmount.toNumber(),
          totalAmount: totalAmount.toNumber(),
          status: 'DRAFT',
          approvalStatus: 'PENDING',
          createdBy: userId,
          updatedBy: userId,
          items: { create: items },
        },
        include: { items: true },
      });

      return {
        data: registration,
        message: '发票登记生成成功',
      };
    },

    /** 提交审核 */
    async submit({ id, userId, prisma }) {
      const registration = await prisma.invoiceRegistration.findUnique({
        where: { id },
        select: { status: true, code: true },
      });

      if (!registration) {
        throw new Error('发票登记不存在');
      }

      if (registration.status !== 'DRAFT') {
        throw new Error(`发票登记 ${registration.code} 状态为 ${registration.status}，无法提交`);
      }

      const updated = await prisma.invoiceRegistration.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
          approvalStatus: 'PENDING',
          updatedBy: userId,
        },
      });

      return {
        data: updated,
        message: '提交成功',
      };
    },
  },
};

/**
 * 辅助函数：校验登记数量不能超过开票通知数量
 * @param prisma Prisma client
 * @param invoicingNoticeId 开票通知ID
 * @param items 发票登记明细
 */
async function validateRegistrationQuantity(
  prisma: any,
  invoicingNoticeId: string,
  items: any[]
) {
  // 获取开票通知明细
  const noticeItems = await prisma.invoicingNoticeItem.findMany({
    where: {
      invoicingNoticeId,
      deletedAt: null,
    },
    select: {
      id: true,
      noticeQuantity: true,
    },
  });

  const noticeQuantityMap = new Map(
    noticeItems.map((item: any) => [item.id, item.noticeQuantity || 0])
  );

  // 校验每个明细的登记数量
  for (const item of items) {
    if (item.invoicingNoticeItemId) {
      const noticeQty = noticeQuantityMap.get(item.invoicingNoticeItemId) || 0;
      const registeredQty = item.quantity || 0;

      if (registeredQty > noticeQty) {
        throw new Error(
          `登记数量 ${registeredQty} 超过开票通知数量 ${noticeQty}`
        );
      }
    }
  }
}

/**
 * 辅助函数：更新开票通知明细的登记状态
 * @param prisma Prisma client
 * @param items 发票登记明细
 */
async function updateInvoicingNoticeItemStatus(prisma: any, items: any[]) {
  const itemQuantityMap = new Map<string, number>();

  // 统计每个开票通知明细的已登记数量
  for (const item of items) {
    if (item.invoicingNoticeItemId) {
      const currentQty = itemQuantityMap.get(item.invoicingNoticeItemId) || 0;
      itemQuantityMap.set(
        item.invoicingNoticeItemId,
        currentQty + (item.quantity || 0)
      );
    }
  }

  // 批量更新开票通知明细
  for (const [itemId, registeredQty] of itemQuantityMap.entries()) {
    // 获取开票通知明细的总数量
    const noticeItem = await prisma.invoicingNoticeItem.findUnique({
      where: { id: itemId },
      select: { noticeQuantity: true, invoiceRegQty: true },
    });

    if (!noticeItem) continue;

    const newRegQty = (noticeItem.invoiceRegQty || 0) + registeredQty;
    const totalQty = noticeItem.noticeQuantity || 0;

    // 判断登记状态
    let registrationStatus = 'NOT_REGISTERED';
    if (newRegQty > 0 && newRegQty < totalQty) {
      registrationStatus = 'PARTIALLY_REGISTERED';
    } else if (newRegQty >= totalQty) {
      registrationStatus = 'FULLY_REGISTERED';
    }

    await prisma.invoicingNoticeItem.update({
      where: { id: itemId },
      data: {
        invoiceRegQty: newRegQty,
        invoiceRegStatus: registrationStatus,
      },
    });
  }
}

/**
 * 辅助函数：更新采购合同明细的已登票数量
 * @param prisma Prisma client
 * @param items 发票登记明细
 */
async function updatePurchaseContractRegisteredQty(prisma: any, items: any[]) {
  const itemQuantityMap = new Map<string, number>();

  // 统计每个采购合同明细的已登票数量
  for (const item of items) {
    if (item.purchaseContractItemId) {
      const currentQty = itemQuantityMap.get(item.purchaseContractItemId) || 0;
      itemQuantityMap.set(
        item.purchaseContractItemId,
        currentQty + (item.quantity || 0)
      );
    }
  }

  // 批量更新采购合同明细
  for (const [itemId, registeredQty] of itemQuantityMap.entries()) {
    await prisma.purchaseContractItem.update({
      where: { id: itemId },
      data: {
        registeredQuantity: { increment: registeredQty },
        registrationStatus: 'REGISTERED',
      },
    });
  }
}
