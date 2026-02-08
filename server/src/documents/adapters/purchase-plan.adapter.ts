/**
 * 采购计划 Adapter
 */

import type { DocumentTypeAdapter } from '../types';

export const purchasePlanAdapter: DocumentTypeAdapter = {
  typeId: 'purchase_plan',
  typeName: '采购计划',

  // ---- Prisma 映射 ----
  prismaModel: 'purchasePlan',
  prismaItemModel: 'purchasePlanItem',
  parentForeignKey: 'purchasePlanId',
  itemRelationName: 'items',

  // ---- 搜索 ----
  searchFields: [
    'code',
    'salesContractCode',
    'customerCode',
  ],

  // ---- Includes ----
  listIncludes: {
    items: {
      select: {
        id: true,
        lineNumber: true,
        productName: true,
        purchaseQuantity: true,
        unitPrice: true,
        totalAmount: true,
      },
    },
  },
  detailIncludes: {
    items: {
      orderBy: { lineNumber: 'asc' },
    },
  },

  // ---- 默认排序 ----
  defaultOrderBy: { createdAt: 'desc' },

  // ---- 字段映射 ----
  columnToPrismaField: {
    _docNumber: 'code',
    _status: 'planStatus',
    _createdAt: 'createdAt',
    planStatus: 'planStatus',
    approvalStatus: 'approvalStatus',
    customerId: 'customerId',
    customerCode: 'customerCode',
    buyer: 'buyer',
    salesPerson: 'salesPerson',
    salesContractCode: 'salesContractCode',
    planDate: 'planDate',
    expectedDeliveryDate: 'expectedDeliveryDate',
  },

  // ---- 聚合 ----
  aggregateFields: [],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.planStatus,
      _createdAt: row.createdAt,
      _sourceTypeId: row.salesContractId ? 'sales_contract' : undefined,
      // 主数据字段
      planDate: row.planDate,
      expectedDeliveryDate: row.expectedDeliveryDate,
      planStatus: row.planStatus,
      approvalStatus: row.approvalStatus,
      sourceType: row.sourceType,
      salesContractCode: row.salesContractCode,
      customerId: row.customerId,
      customerCode: row.customerCode,
      buyer: row.buyer,
      salesPerson: row.salesPerson,
      merchandiser: row.merchandiser,
      remark: row.remark,
    };
  },

  flattenDetailRow(masterRow: any, detailRow: any) {
    return {
      _id: masterRow.id,
      _docNumber: masterRow.code,
      _status: masterRow.planStatus,
      _createdAt: masterRow.createdAt,
      _detailRowId: detailRow.id,
      // 主数据
      customerCode: masterRow.customerCode,
      salesContractCode: masterRow.salesContractCode,
      // 明细数据
      lineNumber: detailRow.lineNumber,
      productCode: detailRow.productCode,
      productName: detailRow.productName,
      specification: detailRow.specification,
      purchaseQuantity: detailRow.purchaseQuantity ? Number(detailRow.purchaseQuantity) : 0,
      unitPrice: detailRow.unitPrice ? Number(detailRow.unitPrice) : 0,
      totalAmount: detailRow.totalAmount ? Number(detailRow.totalAmount) : 0,
      supplierName: detailRow.supplierName,
      deliveryDate: detailRow.deliveryDate,
      remark: detailRow.remark,
    };
  },

  // ---- 删除前校验 ----
  async beforeDelete(id, prisma) {
    const plan = await prisma.purchasePlan.findUnique({ where: { id } });
    if (!plan) throw new Error('采购计划不存在');
    if (plan.planStatus !== 'DRAFT' && plan.planStatus !== 'CANCELLED') {
      throw new Error('只能删除草稿或已取消的采购计划');
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, userId, prisma }) {
      const plan = await prisma.purchasePlan.findUnique({ where: { id } });
      if (!plan) throw new Error('采购计划不存在');
      if (plan.approvalStatus === 'APPROVED') {
        throw new Error('采购计划已审核');
      }

      const doc = await prisma.purchasePlan.update({
        where: { id },
        data: {
          approvalStatus: 'APPROVED',
          planStatus: 'APPROVED',
          updatedBy: userId,
        },
        include: { items: true },
      });
      return { data: doc, message: '采购计划审核通过' };
    },

    /** 拒绝 */
    async reject({ id, body, userId, prisma }) {
      const plan = await prisma.purchasePlan.findUnique({ where: { id } });
      if (!plan) throw new Error('采购计划不存在');

      const doc = await prisma.purchasePlan.update({
        where: { id },
        data: {
          approvalStatus: 'REJECTED',
          planStatus: 'DRAFT',
          remark: plan.remark
            ? `${plan.remark}\n拒绝原因: ${body.reason || ''}`
            : `拒绝原因: ${body.reason || ''}`,
          updatedBy: userId,
        },
        include: { items: true },
      });
      return { data: doc, message: '采购计划已拒绝' };
    },

    /** 取消 */
    async cancel({ id, userId, prisma }) {
      const plan = await prisma.purchasePlan.findUnique({ where: { id } });
      if (!plan) throw new Error('采购计划不存在');
      if (plan.planStatus === 'COMPLETED' || plan.planStatus === 'CLOSED') {
        throw new Error('已完成或已结案的采购计划不能取消');
      }

      const doc = await prisma.purchasePlan.update({
        where: { id },
        data: {
          planStatus: 'CANCELLED',
          updatedBy: userId,
        },
        include: { items: true },
      });
      return { data: doc, message: '采购计划已取消' };
    },

    /** 从销售合同生成 (特殊: body 传 salesContractId) */
    async createFromSalesContract({ body, userId, prisma }) {
      const { salesContractId } = body;
      const salesContract = await prisma.salesContract.findUnique({
        where: { id: salesContractId },
        include: { items: true },
      });

      if (!salesContract) throw new Error('销售合同不存在');
      if (salesContract.toPurchasePlan) throw new Error('该销售合同已生成采购计划');

      // 生成编号
      const today = new Date();
      const prefix = `PP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const lastPlan = await prisma.purchasePlan.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
      });
      let seq = 1;
      if (lastPlan) {
        seq = parseInt(lastPlan.code.substring(prefix.length)) + 1;
      }
      const planCode = `${prefix}${String(seq).padStart(4, '0')}`;

      const purchasePlan = await prisma.purchasePlan.create({
        data: {
          code: planCode,
          planDate: new Date(),
          expectedDeliveryDate: salesContract.customerDeliveryDate || new Date(),
          sourceType: 'SALES_CONTRACT',
          salesContractId: salesContract.id,
          salesContractCode: salesContract.code,
          orderLinkCode: salesContract.orderLinkCode,
          orderPath: salesContract.orderPath,
          customerId: salesContract.customerId,
          customerCode: salesContract.customerCode,
          salesPerson: salesContract.salesPerson,
          merchandiser: salesContract.merchandiser,
          buyer: salesContract.buyer,
          planStatus: 'DRAFT',
          approvalStatus: 'PENDING',
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: salesContract.items.map((item: any, index: number) => ({
              lineNumber: index + 1,
              productId: item.productId,
              productCode: item.productCode || '',
              productName: item.productName,
              customerProductNo: item.customerProductNo,
              specification: item.productSpec,
              salesQuantity: item.quantity,
              contractQuantity: item.quantity,
              purchaseQuantity: item.quantity,
              pendingQuantity: item.quantity,
              unitPrice: item.unitPrice,
              currency: item.currency,
              deliveryDate: item.deliveryDate,
              packageMethod: item.packageMethod,
              salesContractId: salesContract.id,
              salesContractItemId: item.id,
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        },
        include: { items: true },
      });

      // 标记销售合同
      await prisma.salesContract.update({
        where: { id: salesContractId },
        data: {
          toPurchasePlan: true,
          toPurchasePlanTime: new Date(),
        },
      });

      return { data: purchasePlan, message: '采购计划生成成功' };
    },
  },
};
