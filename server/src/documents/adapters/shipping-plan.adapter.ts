/**
 * 出运计划 Adapter (Shipping Plan)
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
 * 出运计划状态流转配置
 */
const SHIPPING_PLAN_STATUS_CONFIG = {
  transitions: {
    DRAFT: ['PENDING', 'CANCELLED'],
    PENDING: ['APPROVED', 'DRAFT', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  },
};

export const shippingPlanAdapter: DocumentTypeAdapter = {
  typeId: 'shipping_plan',
  typeName: '出运计划',

  // ---- Prisma 映射 ----
  prismaModel: 'shippingPlan',
  prismaItemModel: 'shippingPlanItem',
  parentForeignKey: 'shippingPlanId',
  itemRelationName: 'items',

  // ---- 搜索 ----
  searchFields: [
    'code',
    'salesContractCode',
    'customerPoNo',
    'orderLinkCode',
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
    salesContractCode: 'salesContractCode',
    customerPoNo: 'customerPoNo',
    orderLinkCode: 'orderLinkCode',
    expectedShippingDate: 'expectedShippingDate',
    expectedDeliveryDate: 'expectedDeliveryDate',
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
      _sourceTypeId: row.salesContractId ? 'sales_contract' : undefined,
      // 主数据字段
      salesContractCode: row.salesContractCode,
      customerPoNo: row.customerPoNo,
      orderLinkCode: row.orderLinkCode,
      expectedShippingDate: row.expectedShippingDate,
      expectedDeliveryDate: row.expectedDeliveryDate,
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
      salesContractCode: masterRow.salesContractCode,
      customerPoNo: masterRow.customerPoNo,
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

      // 【业务逻辑补充】创建后回写销售合同明细的出运数量
      await updateSalesContractShippingQuantity(prismaClient, data.items, false, userId);
    }
  },

  async onUpdate(id, data, userId, prismaClient) {
    // 重新计算汇总数据
    const summary = await calculateDocumentSummary(
      prismaClient,
      'shippingPlanItem',
      'shippingPlanId',
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
      const current = await prismaClient.shippingPlan.findUnique({
        where: { id },
        select: { status: true },
      });

      if (current && current.status !== data.status) {
        validateStatusTransition(
          current.status,
          data.status,
          SHIPPING_PLAN_STATUS_CONFIG
        );
      }
    }
  },

  async beforeDelete(id: string, prismaClient: any) {
    const plan = await prismaClient.shippingPlan.findUnique({
      where: { id },
      select: { status: true, code: true },
    });

    if (!plan) {
      throw new Error('出运计划不存在');
    }

    if (['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(plan.status)) {
      throw new Error(`出运计划 ${plan.code} 状态为 ${plan.status}，不允许删除`);
    }

    // 检查是否有下游出运单
    const shippingOrders = await prismaClient.shippingOrder.count({
      where: { shippingPlanId: id, deletedAt: null },
    });

    if (shippingOrders > 0) {
      throw new Error(`出运计划 ${plan.code} 已生成 ${shippingOrders} 个出运单，无法删除`);
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;

      const plan = await prisma.shippingPlan.findUnique({
        where: { id },
        select: { status: true, code: true },
      });

      if (!plan) {
        throw new Error('出运计划不存在');
      }

      if (plan.status !== 'PENDING') {
        throw new Error(`出运计划 ${plan.code} 状态为 ${plan.status}，无法审核`);
      }

      const doc = await prisma.shippingPlan.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'PENDING',
          updatedBy: userId,
        },
      });

      return {
        data: doc,
        message: `出运计划${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const { status } = body;

      validateRequiredFields(body, ['status']);

      const current = await prisma.shippingPlan.findUnique({
        where: { id },
        select: { status: true, code: true },
      });

      if (!current) {
        throw new Error('出运计划不存在');
      }

      validateStatusTransition(
        current.status,
        status,
        SHIPPING_PLAN_STATUS_CONFIG
      );

      const plan = await prisma.shippingPlan.update({
        where: { id },
        data: {
          status,
          updatedBy: userId,
        },
      });

      return { data: plan, message: '状态更新成功' };
    },

    /** 获取关联单据 */
    async getRelatedDocuments({ id, prisma }) {
      const result = await queryRelatedDocuments(prisma, [
        {
          model: 'shippingOrder',
          where: { shippingPlanId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            totalQuantity: true,
            totalBoxes: true,
            createdAt: true,
          },
          label: 'shippingOrders',
        },
        {
          model: 'customsDeclaration',
          where: { shippingPlanId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            createdAt: true,
          },
          label: 'customsDeclarations',
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
        throw new Error('请选择要审核的出运计划');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          const plan = await prisma.shippingPlan.findUnique({
            where: { id },
            select: { code: true, status: true },
          });

          if (!plan) {
            throw new Error('出运计划不存在');
          }

          if (plan.status !== 'PENDING') {
            throw new Error(`状态为 ${plan.status}，无法审核`);
          }

          return await prisma.shippingPlan.update({
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

    /** 复制计划 */
    async copy({ id, body, userId, prisma }) {
      const original = await prisma.shippingPlan.findUnique({
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { lineNumber: 'asc' },
          },
        },
      });

      if (!original) {
        throw new Error('原出运计划不存在');
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

      const newPlan = await prisma.shippingPlan.create({
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
                shippingPlanId: _planId,
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
        data: newPlan,
        message: `出运计划复制成功，新计划编号：${newPlan.code}`,
      };
    },

    /** 从销售合同生成 */
    async createFromSalesContract({ body, userId, prisma }) {
      const { salesContractId, itemIds } = body;

      validateRequiredFields(body, ['salesContractId']);

      const contract = await prisma.salesContract.findUnique({
        where: { id: salesContractId },
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

      if (!contract) {
        throw new Error('销售合同不存在');
      }

      if (contract.items.length === 0) {
        throw new Error('未找到选中的明细项');
      }

      // 生成编号
      const today = new Date();
      const prefix = `SP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const lastPlan = await prisma.shippingPlan.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
      });
      let seq = 1;
      if (lastPlan) {
        seq = parseInt(lastPlan.code.substring(prefix.length)) + 1;
      }
      const planCode = `${prefix}${String(seq).padStart(4, '0')}`;

      const plan = await prisma.shippingPlan.create({
        data: {
          code: planCode,
          entryDate: new Date(),
          salesContractId: contract.id,
          salesContractCode: contract.code,
          customerPoNo: contract.customerPoNo,
          orderLinkCode: contract.orderLinkCode,
          expectedDeliveryDate: contract.customerDeliveryDate,
          status: 'DRAFT',
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: contract.items.map((item: any, index: number) => ({
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
              salesContractItemId: item.id,
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        },
        include: { items: true },
      });

      return {
        data: plan,
        message: '出运计划生成成功',
      };
    },
  },
};

/**
 * 辅助函数：更新销售合同明细的出运数量
 * @param prisma Prisma client
 * @param items 出运计划明细
 * @param isRollback 是否回滚（true: 删除时减少, false: 创建时增加）
 * @param userId 用户ID
 */
async function updateSalesContractShippingQuantity(
  prisma: any,
  items: any[],
  isRollback: boolean,
  userId: string
) {
  const shippingQtyMap = new Map<string, number>();

  // 统计每个销售合同明细的出运数量
  for (const item of items) {
    if (item.salesContractItemId && item.quantity) {
      const currentQty = shippingQtyMap.get(item.salesContractItemId) || 0;
      shippingQtyMap.set(
        item.salesContractItemId,
        currentQty + Number(item.quantity)
      );
    }
  }

  // 批量更新销售合同明细的出运数量
  for (const [itemId, qty] of shippingQtyMap.entries()) {
    await prisma.salesContractItem.update({
      where: { id: itemId },
      data: {
        shippedQuantity: isRollback
          ? { decrement: qty }
          : { increment: qty },
        updatedBy: userId,
      },
    });
  }
}
