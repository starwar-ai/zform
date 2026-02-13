/**
 * 报关单 Adapter (Customs Declaration)
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
 * 报关单状态流转配置
 */
const CUSTOMS_DECLARATION_STATUS_CONFIG = {
  transitions: {
    DRAFT: ['PENDING', 'CANCELLED'],
    PENDING: ['APPROVED', 'DRAFT', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  },
};

export const customsDeclarationAdapter: DocumentTypeAdapter = {
  typeId: 'customs_declaration',
  typeName: '报关单',

  // ---- Prisma 映射 ----
  prismaModel: 'customsDeclaration',
  prismaItemModel: 'customsDeclarationItem',
  parentForeignKey: 'customsDeclarationId',
  itemRelationName: 'items',

  // ---- 搜索 ----
  searchFields: [
    'code',
    'planCode',
    'invoiceNo',
    'declarationNo',
    'blNo',
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
    planCode: 'planCode',
    invoiceNo: 'invoiceNo',
    declarationNo: 'declarationNo',
    blNo: 'blNo',
    shippingDate: 'shippingDate',
    totalQuantity: 'totalQuantity',
    totalBoxes: 'totalBoxes',
    totalGrossWeight: 'totalGrossWeight',
    totalNetWeight: 'totalNetWeight',
  },

  // ---- 聚合 ----
  aggregateFields: [
    { field: 'totalQuantity', type: 'sum', columnId: 'totalQuantity' },
    { field: 'totalBoxes', type: 'sum', columnId: 'totalBoxes' },
    { field: 'totalGrossWeight', type: 'sum', columnId: 'totalGrossWeight' },
    { field: 'totalNetWeight', type: 'sum', columnId: 'totalNetWeight' },
  ],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.status,
      _createdAt: row.createdAt,
      _sourceTypeId: row.shippingOrderId ? 'shipping_order' : undefined,
      // 主数据字段
      planCode: row.planCode,
      invoiceNo: row.invoiceNo,
      declarationNo: row.declarationNo,
      blNo: row.blNo,
      shippingDate: row.shippingDate,
      totalQuantity: row.totalQuantity ? Number(row.totalQuantity) : 0,
      totalBoxes: row.totalBoxes || 0,
      totalGrossWeight: row.totalGrossWeight ? Number(row.totalGrossWeight) : 0,
      totalNetWeight: row.totalNetWeight ? Number(row.totalNetWeight) : 0,
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
      declarationNo: masterRow.declarationNo,
      // 明细数据
      lineNumber: detailRow.lineNumber,
      productCode: detailRow.productCode,
      productName: detailRow.productName,
      hsCode: detailRow.hsCode,
      quantity: detailRow.quantity ? Number(detailRow.quantity) : 0,
      unit: detailRow.unit,
      boxCount: detailRow.boxCount || 0,
      grossWeight: detailRow.grossWeight ? Number(detailRow.grossWeight) : 0,
      netWeight: detailRow.netWeight ? Number(detailRow.netWeight) : 0,
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
      };

      for (const item of data.items) {
        summary.totalQuantity += Number(item.quantity || 0);
        summary.totalBoxes += Number(item.boxCount || 0);
        summary.totalGrossWeight += Number(item.grossWeight || 0);
        summary.totalNetWeight += Number(item.netWeight || 0);
      }

      Object.assign(data, summary);
    }
  },

  async onUpdate(id, data, userId, prismaClient) {
    // 重新计算汇总数据
    const summary = await calculateDocumentSummary(
      prismaClient,
      'customsDeclarationItem',
      'customsDeclarationId',
      id,
      [
        { sourceField: 'quantity', destField: 'totalQuantity', type: 'sum' },
        { sourceField: 'boxCount', destField: 'totalBoxes', type: 'sum' },
        { sourceField: 'grossWeight', destField: 'totalGrossWeight', type: 'sum' },
        { sourceField: 'netWeight', destField: 'totalNetWeight', type: 'sum' },
      ]
    );
    Object.assign(data, summary);

    // 验证状态流转
    if (data.status) {
      const current = await prismaClient.customsDeclaration.findUnique({
        where: { id },
        select: { status: true },
      });

      if (current && current.status !== data.status) {
        validateStatusTransition(
          current.status,
          data.status,
          CUSTOMS_DECLARATION_STATUS_CONFIG
        );
      }
    }
  },

  async beforeDelete(id: string, prismaClient: any) {
    const declaration = await prismaClient.customsDeclaration.findUnique({
      where: { id },
      select: { status: true, code: true },
    });

    if (!declaration) {
      throw new Error('报关单不存在');
    }

    if (['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(declaration.status)) {
      throw new Error(`报关单 ${declaration.code} 状态为 ${declaration.status}，不允许删除`);
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;

      const declaration = await prisma.customsDeclaration.findUnique({
        where: { id },
        select: { status: true, code: true },
      });

      if (!declaration) {
        throw new Error('报关单不存在');
      }

      if (declaration.status !== 'PENDING') {
        throw new Error(`报关单 ${declaration.code} 状态为 ${declaration.status}，无法审核`);
      }

      const doc = await prisma.customsDeclaration.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'PENDING',
          updatedBy: userId,
        },
      });

      return {
        data: doc,
        message: `报关单${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const { status } = body;

      validateRequiredFields(body, ['status']);

      const current = await prisma.customsDeclaration.findUnique({
        where: { id },
        select: { status: true, code: true },
      });

      if (!current) {
        throw new Error('报关单不存在');
      }

      validateStatusTransition(
        current.status,
        status,
        CUSTOMS_DECLARATION_STATUS_CONFIG
      );

      const declaration = await prisma.customsDeclaration.update({
        where: { id },
        data: {
          status,
          updatedBy: userId,
        },
      });

      return { data: declaration, message: '状态更新成功' };
    },

    /** 批量审核 */
    async batchApprove({ body, userId, prisma }) {
      const { ids, approved } = body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('请选择要审核的报关单');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          const declaration = await prisma.customsDeclaration.findUnique({
            where: { id },
            select: { code: true, status: true },
          });

          if (!declaration) {
            throw new Error('报关单不存在');
          }

          if (declaration.status !== 'PENDING') {
            throw new Error(`状态为 ${declaration.status}，无法审核`);
          }

          return await prisma.customsDeclaration.update({
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

    /** 从出运单生成 */
    async createFromShippingOrder({ body, userId, prisma }) {
      const { shippingOrderId, itemIds } = body;

      validateRequiredFields(body, ['shippingOrderId']);

      const order = await prisma.shippingOrder.findUnique({
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

      if (!order) {
        throw new Error('出运单不存在');
      }

      if (order.items.length === 0) {
        throw new Error('未找到选中的明细项');
      }

      // 生成编号
      const today = new Date();
      const prefix = `CD${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const lastDeclaration = await prisma.customsDeclaration.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
      });
      let seq = 1;
      if (lastDeclaration) {
        seq = parseInt(lastDeclaration.code.substring(prefix.length)) + 1;
      }
      const declarationCode = `${prefix}${String(seq).padStart(4, '0')}`;

      const declaration = await prisma.customsDeclaration.create({
        data: {
          code: declarationCode,
          entryDate: new Date(),
          shippingOrderId: order.id,
          shippingPlanId: order.shippingPlanId,
          planCode: order.planCode,
          invoiceNo: order.invoiceNo,
          invoiceDate: order.invoiceDate,
          blNo: order.blNo,
          shippingDate: order.shippingDate,
          orderLinkCode: order.orderLinkCode,
          status: 'DRAFT',
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: order.items.map((item: any, index: number) => ({
              lineNumber: index + 1,
              productId: item.productId,
              productCode: item.productCode,
              productName: item.productName,
              hsCode: item.hsCode,
              quantity: item.quantity,
              unit: item.unit,
              boxCount: item.boxCount,
              grossWeight: item.grossWeight,
              netWeight: item.netWeight,
              shippingOrderItemId: item.id,
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        },
        include: { items: true },
      });

      return {
        data: declaration,
        message: '报关单生成成功',
      };
    },

    /** 复制报关单 */
    async copy({ id, body, userId, prisma }) {
      const original = await prisma.customsDeclaration.findUnique({
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { lineNumber: 'asc' },
          },
        },
      });

      if (!original) {
        throw new Error('原报关单不存在');
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

      const newDeclaration = await prisma.customsDeclaration.create({
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
                customsDeclarationId: _declarationId,
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
        data: newDeclaration,
        message: `报关单复制成功，新单号：${newDeclaration.code}`,
      };
    },
  },
};
