/**
 * 采购计划 Adapter
 */

import type { DocumentTypeAdapter } from '../types';
import { Decimal } from '@prisma/client/runtime/library';
import {
  validateStatusTransition,
  calculateSummary,
  executeBatchOperation,
  validateRequiredFields,
  calculateDocumentSummary,
  queryRelatedDocuments,
} from '../../utils/business-utils';

/**
 * 采购计划状态流转配置
 */
const PURCHASE_PLAN_STATUS_CONFIG = {
  transitions: {
    DRAFT: ['PENDING', 'CANCELLED'],
    PENDING: ['APPROVED', 'DRAFT', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CLOSED', 'CANCELLED'],
    COMPLETED: ['CLOSED'],
    CLOSED: [],
    CANCELLED: [],
  },
};

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
      id: row.id,
      code: row.code,
      status: row.planStatus,
      createdAt: row.createdAt,
      sourceTypeId: row.salesContractId ? 'sales_contract' : undefined,
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
      id: masterRow.id,
      code: masterRow.code,
      status: masterRow.planStatus,
      createdAt: masterRow.createdAt,
      detailRowId: detailRow.id,
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
  async beforeDelete(id: string, prisma: any) {
    const plan = await prisma.purchasePlan.findUnique({ 
      where: { id },
      select: { planStatus: true, code: true }
    });
    
    if (!plan) throw new Error('采购计划不存在');
    
    if (plan.planStatus !== 'DRAFT' && plan.planStatus !== 'CANCELLED') {
      throw new Error(`采购计划 ${plan.code} 状态为 ${plan.planStatus}，只能删除草稿或已取消的计划`);
    }

    // 检查是否有下游单据（采购合同）
    const purchaseContracts = await prisma.purchaseContract.count({
      where: { purchasePlanId: id, deletedAt: null },
    });

    if (purchaseContracts > 0) {
      throw new Error(`采购计划 ${plan.code} 已生成 ${purchaseContracts} 个采购合同，无法删除`);
    }
  },

  // ---- 生命周期钩子 ----
  async onCreate(data, userId, prismaClient) {
    // 设置默认值
    if (!data.planDate) {
      data.planDate = new Date();
    }
    if (!data.planStatus) {
      data.planStatus = 'DRAFT';
    }
    if (!data.approvalStatus) {
      data.approvalStatus = 'PENDING';
    }

    // 计算总金额
    if (data.items && Array.isArray(data.items)) {
      let totalAmount = new Decimal(0);
      let totalPurchaseQuantity = new Decimal(0);

      for (const item of data.items) {
        const qty = new Decimal(item.purchaseQuantity || 0);
        const price = new Decimal(item.unitPrice || 0);
        totalAmount = totalAmount.add(qty.mul(price));
        totalPurchaseQuantity = totalPurchaseQuantity.add(qty);
      }

      data.totalAmount = totalAmount.toNumber();
      data.totalPurchaseQuantity = totalPurchaseQuantity.toNumber();
    }

    // 【业务逻辑补充】创建后回写销售合同明细的转采购标识
    if (data.salesContractId && data.items && Array.isArray(data.items)) {
      await updateSalesContractItemPurchaseFlag(
        prismaClient,
        data.items.map((item: any) => item.salesContractItemId).filter(Boolean),
        true
      );
    }
  },

  async onUpdate(id, data, userId, prismaClient) {
    // 重新计算汇总数据
    const summary = await calculateDocumentSummary(
      prismaClient,
      'purchasePlanItem',
      'purchasePlanId',
      id,
      [
        { sourceField: 'purchaseQuantity', destField: 'totalPurchaseQuantity', type: 'sum' },
        { sourceField: 'pendingQuantity', destField: 'totalPendingQuantity', type: 'sum' },
        { sourceField: '', destField: 'totalAmount', type: 'multiply', multiplyFields: ['purchaseQuantity', 'unitPrice'] },
      ]
    );
    Object.assign(data, summary);

    // 验证状态流转
    if (data.planStatus) {
      const current = await prismaClient.purchasePlan.findUnique({
        where: { id },
        select: { planStatus: true },
      });

      if (current && current.planStatus !== data.planStatus) {
        validateStatusTransition(
          current.planStatus,
          data.planStatus,
          PURCHASE_PLAN_STATUS_CONFIG
        );
      }
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, userId, prisma }) {
      const plan = await prisma.purchasePlan.findUnique({ 
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
          },
        },
      });
      
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

      // 【业务逻辑补充】审核通过时不需要额外操作，创建时已回写
      // 如果需要审核后再回写，可在此处添加逻辑

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
      const plan = await prisma.purchasePlan.findUnique({ 
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
          },
        },
      });
      
      if (!plan) throw new Error('采购计划不存在');
      if (plan.planStatus === 'COMPLETED' || plan.planStatus === 'CLOSED') {
        throw new Error('已完成或已结案的采购计划不能取消');
      }

      // 【业务逻辑补充】取消时回写销售合同明细的转采购标识
      if (plan.items && plan.items.length > 0) {
        const salesItemIds = plan.items
          .map((item: any) => item.salesContractItemId)
          .filter(Boolean);

        if (salesItemIds.length > 0) {
          // 检查是否有其他有效的采购计划引用这些销售明细
          await updateSalesContractItemPurchaseFlag(prisma, salesItemIds, false);

          // 释放销售合同锁定的库存（如果有）
          if (plan.salesContractCode) {
            // 调用库存 API 释放锁定 (假设有 cancelStockLock 方法)
            // await stockApi.cancelStockLock(plan.salesContractCode, salesItemIds);
          }
        }
      }

      const doc = await prisma.purchasePlan.update({
        where: { id },
        data: {
          planStatus: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: userId,
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

    /** 批量审核 */
    async batchApprove({ body, userId, prisma }) {
      const { ids } = body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('请选择要审核的采购计划');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          const plan = await prisma.purchasePlan.findUnique({
            where: { id },
            select: { code: true, planStatus: true, approvalStatus: true },
          });

          if (!plan) {
            throw new Error('采购计划不存在');
          }

          if (plan.approvalStatus === 'APPROVED') {
            throw new Error('采购计划已审核');
          }

          return await prisma.purchasePlan.update({
            where: { id },
            data: {
              approvalStatus: 'APPROVED',
              planStatus: 'APPROVED',
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

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const { status } = body;
      
      validateRequiredFields(body, ['status']);

      const current = await prisma.purchasePlan.findUnique({
        where: { id },
        select: { planStatus: true, code: true },
      });

      if (!current) {
        throw new Error('采购计划不存在');
      }

      validateStatusTransition(current.planStatus, status, PURCHASE_PLAN_STATUS_CONFIG);

      const plan = await prisma.purchasePlan.update({
        where: { id },
        data: {
          planStatus: status,
          updatedBy: userId,
        },
      });

      return { data: plan, message: '状态更新成功' };
    },

    /** 获取关联单据 */
    async getRelatedDocuments({ id, prisma }) {
      const result = await queryRelatedDocuments(prisma, [
        {
          model: 'purchaseContract',
          where: { purchasePlanId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            totalAmount: true,
            supplierName: true,
            createdAt: true,
          },
          label: 'purchaseContracts',
        },
        {
          model: 'processingOrder',
          where: { purchasePlanId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          label: 'processingOrders',
        },
      ]);

      return {
        data: result,
        message: '关联单据查询成功',
      };
    },

    /** 获取执行进度 */
    async getExecutionProgress({ id, prisma }) {
      const plan = await prisma.purchasePlan.findUnique({
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
          },
        },
      });

      if (!plan) {
        throw new Error('采购计划不存在');
      }

      // 统计各产品的采购进度
      const itemProgress = [];

      for (const item of plan.items) {
        // 查询采购合同数量
        const contractItems = await prisma.purchaseContractItem.findMany({
          where: {
            contract: {
              purchasePlanId: id,
              deletedAt: null,
            },
            productCode: item.productCode,
            deletedAt: null,
          },
        });

        let contractedQuantity = new Decimal(0);
        for (const contractItem of contractItems) {
          contractedQuantity = contractedQuantity.add(
            new Decimal(contractItem.quantity || 0)
          );
        }

        const plannedQty = new Decimal(item.purchaseQuantity || 0);
        const remainingQty = plannedQty.sub(contractedQuantity);
        const completionRate =
          plannedQty.toNumber() > 0
            ? (contractedQuantity.toNumber() / plannedQty.toNumber() * 100).toFixed(2)
            : '0.00';

        itemProgress.push({
          lineNumber: item.lineNumber,
          productCode: item.productCode,
          productName: item.productName,
          plannedQuantity: plannedQty.toNumber(),
          contractedQuantity: contractedQuantity.toNumber(),
          remainingQuantity: remainingQty.toNumber(),
          completionRate: parseFloat(completionRate),
        });
      }

      // 计算整体进度
      const totalPlanned = plan.totalPurchaseQuantity
        ? Number(plan.totalPurchaseQuantity)
        : 0;
      const totalContracted = itemProgress.reduce(
        (sum, item) => sum + item.contractedQuantity,
        0
      );
      const overallCompletionRate =
        totalPlanned > 0 ? (totalContracted / totalPlanned * 100).toFixed(2) : '0.00';

      return {
        data: {
          planCode: plan.code,
          planStatus: plan.planStatus,
          totalPlanned,
          totalContracted,
          totalRemaining: totalPlanned - totalContracted,
          overallCompletionRate: parseFloat(overallCompletionRate),
          items: itemProgress,
        },
        message: '执行进度查询成功',
      };
    },

    /** 复制计划 */
    async copy({ id, body, userId, prisma }) {
      const original = await prisma.purchasePlan.findUnique({
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { lineNumber: 'asc' },
          },
        },
      });

      if (!original) {
        throw new Error('原采购计划不存在');
      }

      // 创建新计划
      const {
        id: _,
        code: __,
        items: ___,
        createdAt,
        updatedAt,
        deletedAt,
        ...masterData
      } = original;

      const newPlan = await prisma.purchasePlan.create({
        data: {
          ...masterData,
          code: body.newCode || undefined,
          planDate: new Date(),
          planStatus: 'DRAFT',
          approvalStatus: 'PENDING',
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: original.items.map((item: any) => {
              const {
                id: _itemId,
                purchasePlanId: _planId,
                createdAt: _createdAt,
                updatedAt: _updatedAt,
                deletedAt: _deletedAt,
                ...itemData
              } = item;
              return {
                ...itemData,
                pendingQuantity: item.purchaseQuantity, // 重置待采购数量
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
        message: `采购计划复制成功，新计划编号：${newPlan.code}`,
      };
    },

    /** 分配供应商 */
    async assignSupplier({ id, body, userId, prisma }) {
      const { itemIds, supplierId, supplierCode, supplierName } = body;

      validateRequiredFields(body, ['itemIds', 'supplierId', 'supplierName']);

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        throw new Error('请选择要分配的明细行');
      }

      await prisma.purchasePlanItem.updateMany({
        where: {
          id: { in: itemIds },
          purchasePlanId: id,
          deletedAt: null,
        },
        data: {
          supplierId,
          supplierCode,
          supplierName,
          updatedBy: userId,
        },
      });

      return {
        data: { count: itemIds.length },
        message: `成功为 ${itemIds.length} 个产品分配供应商`,
      };
    },
  },
};

/**
 * 辅助函数：更新销售合同明细的转采购标识
 * @param prisma Prisma client
 * @param salesItemIds 销售合同明细ID列表
 * @param toPurchase 是否转采购 (true=已转采购, false=取消转采购)
 */
async function updateSalesContractItemPurchaseFlag(
  prisma: any,
  salesItemIds: string[],
  toPurchase: boolean
) {
  if (!salesItemIds || salesItemIds.length === 0) return;

  for (const itemId of salesItemIds) {
    // 如果是取消转采购，需要检查是否还有其他有效的采购计划引用此明细
    if (!toPurchase) {
      const otherPlans = await prisma.purchasePlanItem.count({
        where: {
          salesContractItemId: itemId,
          deletedAt: null,
          purchasePlan: {
            planStatus: {
              notIn: ['CANCELLED', 'CLOSED'],
            },
          },
        },
      });

      // 如果还有其他有效采购计划，不修改标识
      if (otherPlans > 0) {
        continue;
      }
    }

    // 更新销售合同明细的转采购标识
    await prisma.salesContractItem.update({
      where: { id: itemId },
      data: {
        toPurchasePlan: toPurchase,
        toPurchasePlanTime: toPurchase ? new Date() : null,
      },
    });
  }
}
