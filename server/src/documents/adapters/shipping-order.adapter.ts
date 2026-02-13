/**
 * 出运单 Adapter (Shipping Order)
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
 * 出运单状态流转配置
 */
const SHIPPING_ORDER_STATUS_CONFIG = {
  transitions: {
    DRAFT: ['PENDING', 'CANCELLED'],
    PENDING: ['APPROVED', 'DRAFT', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  },
};

export const shippingOrderAdapter: DocumentTypeAdapter = {
  typeId: 'shipping_order',
  typeName: '出运单',

  // ---- Prisma 映射 ----
  prismaModel: 'shippingOrder',
  prismaItemModel: 'shippingOrderItem',
  parentForeignKey: 'shippingOrderId',
  itemRelationName: 'items',

  // ---- 搜索 ----
  searchFields: [
    'code',
    'planCode',
    'salesContractCode',
    'customerPoNo',
    'blNo',
    'invoiceNo',
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
    planCode: 'planCode',
    salesContractCode: 'salesContractCode',
    customerPoNo: 'customerPoNo',
    blNo: 'blNo',
    invoiceNo: 'invoiceNo',
    shippingDate: 'shippingDate',
    totalQuantity: 'totalQuantity',
    totalBoxes: 'totalBoxes',
    totalGrossWeight: 'totalGrossWeight',
    totalNetWeight: 'totalNetWeight',
    totalVolume: 'totalVolume',
  },

  // ---- 聚合 ----
  aggregateFields: [
    { field: 'totalQuantity', type: 'sum', columnId: 'totalQuantity' },
    { field: 'totalBoxes', type: 'sum', columnId: 'totalBoxes' },
    { field: 'totalGrossWeight', type: 'sum', columnId: 'totalGrossWeight' },
    { field: 'totalNetWeight', type: 'sum', columnId: 'totalNetWeight' },
    { field: 'totalVolume', type: 'sum', columnId: 'totalVolume' },
  ],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.status,
      _createdAt: row.createdAt,
      _sourceTypeId: row.shippingPlanId ? 'shipping_plan' : undefined,
      // 主数据字段
      planCode: row.planCode,
      salesContractCode: row.salesContractCode,
      customerPoNo: row.customerPoNo,
      blNo: row.blNo,
      invoiceNo: row.invoiceNo,
      shippingDate: row.shippingDate,
      totalQuantity: row.totalQuantity ? Number(row.totalQuantity) : 0,
      totalBoxes: row.totalBoxes || 0,
      totalGrossWeight: row.totalGrossWeight ? Number(row.totalGrossWeight) : 0,
      totalNetWeight: row.totalNetWeight ? Number(row.totalNetWeight) : 0,
      totalVolume: row.totalVolume ? Number(row.totalVolume) : 0,
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
      planCode: masterRow.planCode,
      salesContractCode: masterRow.salesContractCode,
      blNo: masterRow.blNo,
      // 明细数据
      lineNumber: detailRow.lineNumber,
      productCode: detailRow.productCode,
      productName: detailRow.productName,
      quantity: detailRow.quantity ? Number(detailRow.quantity) : 0,
      unit: detailRow.unit,
      boxCount: detailRow.boxCount || 0,
      grossWeight: detailRow.grossWeight ? Number(detailRow.grossWeight) : 0,
      netWeight: detailRow.netWeight ? Number(detailRow.netWeight) : 0,
      volume: detailRow.volume ? Number(detailRow.volume) : 0,
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

    // 计算汇总
    if (data.items && Array.isArray(data.items)) {
      const summary = {
        totalQuantity: 0,
        totalBoxes: 0,
        totalGrossWeight: 0,
        totalNetWeight: 0,
        totalVolume: 0,
      };

      for (const item of data.items) {
        summary.totalQuantity += Number(item.quantity || 0);
        summary.totalBoxes += Number(item.boxCount || 0);
        summary.totalGrossWeight += Number(item.grossWeight || 0);
        summary.totalNetWeight += Number(item.netWeight || 0);
        summary.totalVolume += Number(item.volume || 0);
      }

      Object.assign(data, summary);
    }
  },

  async onUpdate(id, data, userId, prismaClient) {
    // 重新计算汇总数据
    const summary = await calculateDocumentSummary(
      prismaClient,
      'shippingOrderItem',
      'shippingOrderId',
      id,
      [
        { sourceField: 'quantity', destField: 'totalQuantity', type: 'sum' },
        { sourceField: 'boxCount', destField: 'totalBoxes', type: 'sum' },
        { sourceField: 'grossWeight', destField: 'totalGrossWeight', type: 'sum' },
        { sourceField: 'netWeight', destField: 'totalNetWeight', type: 'sum' },
        { sourceField: 'volume', destField: 'totalVolume', type: 'sum' },
      ]
    );
    Object.assign(data, summary);

    // 验证状态流转
    if (data.status) {
      const current = await prismaClient.shippingOrder.findUnique({
        where: { id },
        select: { status: true },
      });

      if (current && current.status !== data.status) {
        validateStatusTransition(
          current.status,
          data.status,
          SHIPPING_ORDER_STATUS_CONFIG
        );
      }
    }
  },

  async beforeDelete(id: string, prismaClient: any) {
    const order = await prismaClient.shippingOrder.findUnique({
      where: { id },
      select: { status: true, code: true },
    });

    if (!order) {
      throw new Error('出运单不存在');
    }

    if (['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status)) {
      throw new Error(`出运单 ${order.code} 状态为 ${order.status}，不允许删除`);
    }

    // 检查是否有下游报关单
    const customsDeclarations = await prismaClient.customsDeclaration.count({
      where: { shippingOrderId: id, deletedAt: null },
    });

    if (customsDeclarations > 0) {
      throw new Error(`出运单 ${order.code} 已生成 ${customsDeclarations} 个报关单，无法删除`);
    }

    // 检查是否有发票通知
    const invoicingNotices = await prismaClient.invoicingNotice.count({
      where: { shippingOrderId: id, deletedAt: null },
    });

    if (invoicingNotices > 0) {
      throw new Error(`出运单 ${order.code} 已生成 ${invoicingNotices} 个开票通知，无法删除`);
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;

      const order = await prisma.shippingOrder.findUnique({
        where: { id },
        select: { status: true, code: true },
      });

      if (!order) {
        throw new Error('出运单不存在');
      }

      if (order.status !== 'PENDING') {
        throw new Error(`出运单 ${order.code} 状态为 ${order.status}，无法审核`);
      }

      const doc = await prisma.shippingOrder.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'PENDING',
          updatedBy: userId,
        },
      });

      return {
        data: doc,
        message: `出运单${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const { status } = body;

      validateRequiredFields(body, ['status']);

      const current = await prisma.shippingOrder.findUnique({
        where: { id },
        select: { status: true, code: true },
      });

      if (!current) {
        throw new Error('出运单不存在');
      }

      validateStatusTransition(
        current.status,
        status,
        SHIPPING_ORDER_STATUS_CONFIG
      );

      const order = await prisma.shippingOrder.update({
        where: { id },
        data: {
          status,
          updatedBy: userId,
        },
      });

      return { data: order, message: '状态更新成功' };
    },

    /** 获取关联单据 */
    async getRelatedDocuments({ id, prisma }) {
      const result = await queryRelatedDocuments(prisma, [
        {
          model: 'customsDeclaration',
          where: { shippingOrderId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            declarationNo: true,
            createdAt: true,
          },
          label: 'customsDeclarations',
        },
        {
          model: 'invoicingNotice',
          where: { shippingOrderId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            invoiceAmount: true,
            createdAt: true,
          },
          label: 'invoicingNotices',
        },
        {
          model: 'exchangeSettlement',
          where: { shippingOrderId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            settlementAmount: true,
            createdAt: true,
          },
          label: 'exchangeSettlements',
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
        throw new Error('请选择要审核的出运单');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          const order = await prisma.shippingOrder.findUnique({
            where: { id },
            select: { code: true, status: true },
          });

          if (!order) {
            throw new Error('出运单不存在');
          }

          if (order.status !== 'PENDING') {
            throw new Error(`状态为 ${order.status}，无法审核`);
          }

          return await prisma.shippingOrder.update({
            where: { id },
            data: {
              status: approved ? 'APPROVED' : 'PENDING',
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

    /** 复制出运单 */
    async copy({ id, body, userId, prisma }) {
      const original = await prisma.shippingOrder.findUnique({
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { lineNumber: 'asc' },
          },
        },
      });

      if (!original) {
        throw new Error('原出运单不存在');
      }

      const {
        id: _,
        code: __,
        items: ___,
        createdAt,
        updatedAt,
        deletedAt,
        ...masterData
      } = original;

      const newOrder = await prisma.shippingOrder.create({
        data: {
          ...masterData,
          code: body.newCode || undefined,
          entryDate: new Date(),
          status: 'DRAFT',
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: original.items.map((item: any) => {
              const {
                id: _itemId,
                shippingOrderId: _orderId,
                createdAt: _createdAt,
                updatedAt: _updatedAt,
                deletedAt: _deletedAt,
                ...itemData
              } = item;
              return {
                ...itemData,
                createdBy: userId,
                updatedBy: userId,
              };
            }),
          },
        },
        include: {
          items: true,
        },
      });

      return {
        data: newOrder,
        message: `出运单复制成功，新单号：${newOrder.code}`,
      };
    },

    /** 从出运计划生成 */
    async createFromShippingPlan({ body, userId, prisma }) {
      const { shippingPlanId, itemIds } = body;

      validateRequiredFields(body, ['shippingPlanId']);

      const plan = await prisma.shippingPlan.findUnique({
        where: { id: shippingPlanId },
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

      if (!plan) {
        throw new Error('出运计划不存在');
      }

      if (plan.items.length === 0) {
        throw new Error('未找到选中的明细项');
      }

      // 生成编号
      const today = new Date();
      const prefix = `SO${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const lastOrder = await prisma.shippingOrder.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
      });
      let seq = 1;
      if (lastOrder) {
        seq = parseInt(lastOrder.code.substring(prefix.length)) + 1;
      }
      const orderCode = `${prefix}${String(seq).padStart(4, '0')}`;

      const order = await prisma.shippingOrder.create({
        data: {
          code: orderCode,
          entryDate: new Date(),
          shippingPlanId: plan.id,
          planCode: plan.code,
          salesContractCode: plan.salesContractCode,
          customerPoNo: plan.customerPoNo,
          orderLinkCode: plan.orderLinkCode,
          expectedShippingDate: plan.expectedShippingDate,
          frontMark: plan.frontMark,
          sideMark: plan.sideMark,
          status: 'DRAFT',
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: plan.items.map((item: any, index: number) => ({
              lineNumber: index + 1,
              productId: item.productId,
              productCode: item.productCode,
              productName: item.productName,
              quantity: item.quantity,
              unit: item.unit,
              boxCount: item.boxCount,
              grossWeight: item.grossWeight,
              netWeight: item.netWeight,
              volume: item.volume,
              shippingPlanItemId: item.id,
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        },
        include: { items: true },
      });

      return {
        data: order,
        message: '出运单生成成功',
      };
    },

    /** 重新计算汇总 */
    async recalculateSummary({ id, prisma }) {
      const summary = await calculateDocumentSummary(
        prisma,
        'shippingOrderItem',
        'shippingOrderId',
        id,
        [
          { sourceField: 'quantity', destField: 'totalQuantity', type: 'sum' },
          { sourceField: 'boxCount', destField: 'totalBoxes', type: 'sum' },
          { sourceField: 'grossWeight', destField: 'totalGrossWeight', type: 'sum' },
          { sourceField: 'netWeight', destField: 'totalNetWeight', type: 'sum' },
          { sourceField: 'volume', destField: 'totalVolume', type: 'sum' },
        ]
      );

      const updated = await prisma.shippingOrder.update({
        where: { id },
        data: summary,
      });

      return {
        data: updated,
        message: '汇总数据重新计算完成',
      };
    },
  },
};
