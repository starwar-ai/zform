/**
 * 付款申请 Adapter
 */

import type { DocumentTypeAdapter } from '../types';

export const paymentApplyAdapter: DocumentTypeAdapter = {
  typeId: 'payment_apply',
  typeName: '付款申请',

  // ---- Prisma 映射 ----
  prismaModel: 'paymentApply',
  prismaItemModel: 'paymentApplyItem',
  parentForeignKey: 'paymentApplyId',
  itemRelationName: 'items',

  // ---- 基础筛选条件 ----
  baseWhere: {},

  // ---- 搜索 ----
  searchFields: [
    'code',
    'orderLinkCode',
    'paymentPlanId',
    'applicantName',
    'buyerName',
    'orderSubjectName',
    'supplierName',
    'supplierCode',
    'payerName',
    'bankAccount',
    'bankName',
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
    applyDate: 'applyDate',
    applyType: 'applyType',
    orderLinkCode: 'orderLinkCode',
    paymentPlanId: 'paymentPlanId',
    applicantId: 'applicantId',
    applicantName: 'applicantName',
    buyerId: 'buyerId',
    buyerName: 'buyerName',
    orderSubjectId: 'orderSubjectId',
    orderSubjectName: 'orderSubjectName',
    supplierId: 'supplierId',
    supplierCode: 'supplierCode',
    supplierName: 'supplierName',
    paymentMethodId: 'paymentMethodId',
    paymentMethodName: 'paymentMethodName',
    paymentType: 'paymentType',
    acceptanceDays: 'acceptanceDays',
    applyPaymentDate: 'applyPaymentDate',
    actualPaymentDate: 'actualPaymentDate',
    payerId: 'payerId',
    payerName: 'payerName',
    applyTotalAmount: 'applyTotalAmount',
    goodsTotalAmount: 'goodsTotalAmount',
    adjustmentAmount: 'adjustmentAmount',
    actualPaymentAmount: 'actualPaymentAmount',
    currency: 'currency',
    taxRate: 'taxRate',
    bankAccount: 'bankAccount',
    bankName: 'bankName',
    supplierBankName: 'supplierBankName',
    supplierBankAccount: 'supplierBankAccount',
    paymentStatus: 'paymentStatus',
    printStatus: 'printStatus',
    approvalStatus: 'approvalStatus',
    processInstanceStatus: 'processInstanceStatus',
  },

  // ---- 聚合 ----
  aggregateFields: [
    { field: 'applyTotalAmount', type: 'sum', columnId: 'applyTotalAmount' },
    { field: 'goodsTotalAmount', type: 'sum', columnId: 'goodsTotalAmount' },
    { field: 'adjustmentAmount', type: 'sum', columnId: 'adjustmentAmount' },
    { field: 'actualPaymentAmount', type: 'sum', columnId: 'actualPaymentAmount' },
  ],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.status,
      _createdAt: row.createdAt,
      // 主数据字段
      applyDate: row.applyDate,
      applyType: row.applyType,
      orderLinkCode: row.orderLinkCode,
      paymentPlanId: row.paymentPlanId,
      applicantId: row.applicantId,
      applicantName: row.applicantName,
      buyerId: row.buyerId,
      buyerName: row.buyerName,
      orderSubjectId: row.orderSubjectId,
      orderSubjectName: row.orderSubjectName,
      supplierId: row.supplierId,
      supplierCode: row.supplierCode,
      supplierName: row.supplierName,
      paymentMethodId: row.paymentMethodId,
      paymentMethodName: row.paymentMethodName,
      paymentType: row.paymentType,
      acceptanceDays: row.acceptanceDays,
      applyPaymentDate: row.applyPaymentDate,
      actualPaymentDate: row.actualPaymentDate,
      payerId: row.payerId,
      payerName: row.payerName,
      applyTotalAmount: row.applyTotalAmount ? Number(row.applyTotalAmount) : 0,
      goodsTotalAmount: row.goodsTotalAmount ? Number(row.goodsTotalAmount) : 0,
      adjustmentAmount: row.adjustmentAmount ? Number(row.adjustmentAmount) : 0,
      actualPaymentAmount: row.actualPaymentAmount ? Number(row.actualPaymentAmount) : 0,
      currency: row.currency,
      taxRate: row.taxRate ? Number(row.taxRate) : 0,
      bankAccount: row.bankAccount,
      bankName: row.bankName,
      supplierBankName: row.supplierBankName,
      supplierBankAccount: row.supplierBankAccount,
      paymentStatus: row.paymentStatus,
      printStatus: row.printStatus,
      approvalStatus: row.approvalStatus,
      processInstanceStatus: row.processInstanceStatus,
      remark: row.remark,
      voidReason: row.voidReason,
      voidTime: row.voidTime,
      voidBy: row.voidBy,
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
      applyDate: masterRow.applyDate,
      supplierName: masterRow.supplierName,
      supplierCode: masterRow.supplierCode,
      currency: masterRow.currency,
      // 明细数据
      purchaseContractId: detailRow.purchaseContractId,
      purchaseContractItemId: detailRow.purchaseContractItemId,
      paidAmount: detailRow.paidAmount ? Number(detailRow.paidAmount) : 0,
      appliedAmount: detailRow.appliedAmount ? Number(detailRow.appliedAmount) : 0,
      currentApplyAmount: detailRow.currentApplyAmount ? Number(detailRow.currentApplyAmount) : 0,
      invoiceStatus: detailRow.invoiceStatus,
      paymentStep: detailRow.paymentStep,
      remark: detailRow.remark,
    };
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;
      const doc = await prisma.paymentApply.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'CANCELLED',
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          updatedBy: userId,
        },
      });
      return {
        data: doc,
        message: `付款申请${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const doc = await prisma.paymentApply.update({
        where: { id },
        data: {
          status: body.status,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '付款申请状态更新成功' };
    },

    /** 更新支付状态 */
    async updatePaymentStatus({ id, body, userId, prisma }) {
      const doc = await prisma.paymentApply.update({
        where: { id },
        data: {
          paymentStatus: body.paymentStatus,
          actualPaymentAmount: body.actualPaymentAmount,
          actualPaymentDate: body.actualPaymentDate ? new Date(body.actualPaymentDate) : null,
          payerId: userId,
          payerName: body.payerName,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '支付状态更新成功' };
    },

    /** 作废 */
    async void({ id, body, userId, prisma }) {
      const doc = await prisma.paymentApply.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          voidReason: body.voidReason,
          voidTime: new Date(),
          voidBy: userId,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '付款申请已作废' };
    },
  },
};
