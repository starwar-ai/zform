/**
 * 采购合同 Adapter
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
import { PurchasePaymentPlanService } from '../../services/purchase-payment-plan.service';

const purchasePaymentPlanService = new PurchasePaymentPlanService();

/**
 * 采购合同状态流转配置
 */
const PURCHASE_CONTRACT_STATUS_CONFIG = {
  transitions: {
    DRAFT: ['PENDING', 'CANCELLED'],
    PENDING: ['APPROVED', 'DRAFT', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: ['CLOSED'],
    CLOSED: [],
    CANCELLED: [],
  },
};

export const purchaseContractAdapter: DocumentTypeAdapter = {
  typeId: 'purchase_contract',
  typeName: '采购合同',

  // ---- Prisma 映射 ----
  prismaModel: 'purchaseContract',
  prismaItemModel: 'purchaseContractItem',
  parentForeignKey: 'purchaseContractId',
  itemRelationName: 'items',

  // ---- 搜索 ----
  searchFields: [
    'code',
    'supplierCode',
    'supplierName',
    'purchasePlanCode',
  ],

  // ---- Includes ----
  listIncludes: {
    items: {
      where: { deletedAt: null },
      orderBy: { lineNumber: 'asc' },
      take: 5,
    },
    paymentPlans: {
      where: { deletedAt: null },
      orderBy: { periodIndex: 'asc' },
    },
  },
  detailIncludes: {
    items: {
      where: { deletedAt: null },
      orderBy: { lineNumber: 'asc' },
    },
    paymentPlans: {
      where: { deletedAt: null },
      orderBy: { periodIndex: 'asc' },
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
    supplierId: 'supplierId',
    supplierCode: 'supplierCode',
    supplierName: 'supplierName',
    purchasePlanCode: 'purchasePlanCode',
    buyer: 'buyer',
    totalAmount: 'totalAmount',
    currency: 'currency',
  },

  // ---- 聚合 ----
  aggregateFields: [
    { field: 'totalAmount', type: 'sum', columnId: 'totalAmount' },
    { field: 'totalQuantity', type: 'sum', columnId: 'totalQuantity' },
  ],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      id: row.id,
      code: row.code,
      status: row.status,
      createdAt: row.createdAt,
      sourceTypeId: row.purchasePlanId ? 'purchase_plan' : undefined,
      // 主数据字段
      supplierId: row.supplierId,
      supplierCode: row.supplierCode,
      supplierName: row.supplierName,
      purchasePlanCode: row.purchasePlanCode,
      contractDate: row.contractDate,
      deliveryDate: row.deliveryDate,
      // status: row.status,  // Removed duplicate - already defined above
      approvalStatus: row.approvalStatus,
      contractType: row.contractType,
      currency: row.currency,
      totalAmount: row.totalAmount ? Number(row.totalAmount) : 0,
      totalQuantity: row.totalQuantity ? Number(row.totalQuantity) : 0,
      buyer: row.buyer,
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
      supplierCode: masterRow.supplierCode,
      supplierName: masterRow.supplierName,
      // 明细数据
      lineNumber: detailRow.lineNumber,
      productCode: detailRow.productCode,
      productName: detailRow.productName,
      specification: detailRow.specification,
      quantity: detailRow.quantity ? Number(detailRow.quantity) : 0,
      unitPrice: detailRow.unitPrice ? Number(detailRow.unitPrice) : 0,
      amount: detailRow.amount ? Number(detailRow.amount) : 0,
      unit: detailRow.unit,
      deliveryDate: detailRow.deliveryDate,
      remark: detailRow.remark,
    };
  },

  // ---- 生命周期钩子 ----
  async onCreate(data, userId, prismaClient) {
    // 设置默认值
    if (!data.contractDate) {
      data.contractDate = new Date();
    }
    if (!data.status) {
      data.status = 'DRAFT';
    }
    if (!data.approvalStatus) {
      data.approvalStatus = 'PENDING';
    }

    // 计算总金额
    if (data.items && Array.isArray(data.items)) {
      let totalAmount = new Decimal(0);
      let totalQuantity = new Decimal(0);

      for (const item of data.items) {
        const quantity = new Decimal(item.quantity || 0);
        const unitPrice = new Decimal(item.unitPrice || 0);
        totalAmount = totalAmount.add(quantity.mul(unitPrice));
        totalQuantity = totalQuantity.add(quantity);
      }

      data.totalAmount = totalAmount.toNumber();
      data.totalQuantity = totalQuantity.toNumber();
    }
  },

  async onUpdate(id, data, userId, prismaClient) {
    // 重新计算汇总数据
    const summary = await calculateDocumentSummary(
      prismaClient,
      'purchaseContractItem',
      'purchaseContractId',
      id,
      [
        { sourceField: 'quantity', destField: 'totalQuantity', type: 'sum' },
        { sourceField: 'grossWeight', destField: 'totalGrossWeight', type: 'sum' },
        { sourceField: 'netWeight', destField: 'totalNetWeight', type: 'sum' },
        { sourceField: 'volume', destField: 'totalVolume', type: 'sum' },
        { sourceField: '', destField: 'totalAmount', type: 'multiply', multiplyFields: ['quantity', 'unitPrice'] },
      ]
    );
    Object.assign(data, summary);

    // 验证状态流转
    if (data.status) {
      const current = await prismaClient.purchaseContract.findUnique({
        where: { id },
        select: { status: true },
      });

      if (current && current.status !== data.status) {
        validateStatusTransition(
          current.status,
          data.status,
          PURCHASE_CONTRACT_STATUS_CONFIG
        );
      }
    }

    // 同步付款计划到 purchase_payment_plans 表
    const detailTables = data.detailTables || [];
    const paymentPlanTable = detailTables.find((t: any) => t.tableId === 'paymentPlanItems');
    if (paymentPlanTable?.rows?.length) {
      const plans = paymentPlanTable.rows.map((r: any) => ({ ...(r.data ?? r), id: r.id }));
      await purchasePaymentPlanService.upsertByPurchaseContractId(id, plans, userId);
    }
  },

  async beforeDelete(id: string, prismaClient: any) {
    const contract = await prismaClient.purchaseContract.findUnique({
      where: { id },
      select: { status: true, code: true },
    });

    if (!contract) {
      throw new Error('采购合同不存在');
    }

    if (['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].includes(contract.status)) {
      throw new Error(`采购合同 ${contract.code} 状态为 ${contract.status}，不允许删除`);
    }

    // 检查是否有下游单据（入库单）
    const inbounds = await prismaClient.warehouseInbound.count({
      where: { purchaseContractId: id, deletedAt: null },
    });

    if (inbounds > 0) {
      throw new Error(`采购合同 ${contract.code} 已生成 ${inbounds} 个入库单，无法删除`);
    }
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;

      const contract = await prisma.purchaseContract.findUnique({
        where: { id },
        select: { 
          status: true, 
          code: true,
          purchasePlanId: true,
          managerId: true,
          buyerId: true,
        },
        include: {
          items: {
            where: { deletedAt: null },
          },
        },
      });

      if (!contract) {
        throw new Error('采购合同不存在');
      }

      if (contract.status !== 'PENDING') {
        throw new Error(`采购合同 ${contract.code} 状态为 ${contract.status}，无法审核`);
      }

      // 【业务逻辑补充】审批通过后的级联更新
      if (approved && contract.items && contract.items.length > 0) {
        // 1. 回写销售合同明细的真实采购价和跟单员信息
        await updateSalesContractRealPurchasePrice(
          prisma,
          contract.items,
          contract.managerId,
          contract.buyerId
        );

        // 2. 回写销售合同的赠品数量
        await updateSalesContractFreeQuantity(prisma, contract.items);

        // 3. 回写采购计划状态（如果来自采购计划）
        if (contract.purchasePlanId) {
          await updatePurchasePlanStatus(prisma, contract.purchasePlanId);
        }
      }

      const doc = await prisma.purchaseContract.update({
        where: { id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          status: approved ? 'APPROVED' : 'PENDING',
          updatedBy: userId,
        },
      });

      return {
        data: doc,
        message: `采购合同${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const { status } = body;

      validateRequiredFields(body, ['status']);

      const current = await prisma.purchaseContract.findUnique({
        where: { id },
        select: { status: true, code: true },
      });

      if (!current) {
        throw new Error('采购合同不存在');
      }

      validateStatusTransition(
        current.status,
        status,
        PURCHASE_CONTRACT_STATUS_CONFIG
      );

      const contract = await prisma.purchaseContract.update({
        where: { id },
        data: {
          status,
          updatedBy: userId,
        },
      });

      return { data: contract, message: '状态更新成功' };
    },

    /** 确认合同 */
    async confirm({ id, userId, prisma }) {
      const doc = await prisma.purchaseContract.update({
        where: { id },
        data: {
          confirmStatus: 'CONFIRMED',
          confirmDate: new Date(),
          updatedBy: userId,
        },
      });

      return { data: doc, message: '采购合同确认成功' };
    },

    /** 重新计算金额 */
    async recalculateAmount({ id, prisma }) {
      const summary = await calculateDocumentSummary(
        prisma,
        'purchaseContractItem',
        'purchaseContractId',
        id,
        [
          { sourceField: 'quantity', destField: 'totalQuantity', type: 'sum' },
          { sourceField: 'grossWeight', destField: 'totalGrossWeight', type: 'sum' },
          { sourceField: 'netWeight', destField: 'totalNetWeight', type: 'sum' },
          { sourceField: 'volume', destField: 'totalVolume', type: 'sum' },
          { sourceField: '', destField: 'totalAmount', type: 'multiply', multiplyFields: ['quantity', 'unitPrice'] },
        ]
      );

      const updated = await prisma.purchaseContract.update({
        where: { id },
        data: summary,
      });

      return {
        data: summary,
        message: '金额重新计算完成',
      };
    },

    /** 获取关联单据 */
    async getRelatedDocuments({ id, prisma }) {
      const result = await queryRelatedDocuments(prisma, [
        {
          model: 'warehouseInbound',
          where: { purchaseContractId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            totalQuantity: true,
            createdAt: true,
          },
          label: 'inbounds',
        },
        {
          model: 'paymentApply',
          where: { purchaseContractId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            applyAmount: true,
            createdAt: true,
          },
          label: 'paymentApplies',
        },
      ]);

      return {
        data: result,
        message: '关联单据查询成功',
      };
    },

    /** 获取执行进度 */
    async getExecutionProgress({ id, prisma }) {
      const contract = await prisma.purchaseContract.findUnique({
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
          },
        },
      });

      if (!contract) {
        throw new Error('采购合同不存在');
      }

      // 统计各产品的入库进度
      const itemProgress = [];

      for (const item of contract.items) {
        // 查询入库数量
        const inboundItems = await prisma.warehouseInboundItem.findMany({
          where: {
            inbound: {
              purchaseContractId: id,
              deletedAt: null,
              status: { in: ['APPROVED', 'COMPLETED'] },
            },
            productCode: item.productCode,
            deletedAt: null,
          },
        });

        let receivedQuantity = new Decimal(0);
        for (const inboundItem of inboundItems) {
          receivedQuantity = receivedQuantity.add(
            new Decimal(inboundItem.quantity || 0)
          );
        }

        const contractedQty = new Decimal(item.quantity || 0);
        const remainingQty = contractedQty.sub(receivedQuantity);
        const completionRate =
          contractedQty.toNumber() > 0
            ? (receivedQuantity.toNumber() / contractedQty.toNumber() * 100).toFixed(2)
            : '0.00';

        itemProgress.push({
          lineNumber: item.lineNumber,
          productCode: item.productCode,
          productName: item.productName,
          contractedQuantity: contractedQty.toNumber(),
          receivedQuantity: receivedQuantity.toNumber(),
          remainingQuantity: remainingQty.toNumber(),
          completionRate: parseFloat(completionRate),
          unit: item.unit,
        });
      }

      // 计算整体进度
      const totalContracted = contract.totalQuantity
        ? Number(contract.totalQuantity)
        : 0;
      const totalReceived = itemProgress.reduce(
        (sum, item) => sum + item.receivedQuantity,
        0
      );
      const overallCompletionRate =
        totalContracted > 0
          ? (totalReceived / totalContracted * 100).toFixed(2)
          : '0.00';

      return {
        data: {
          contractCode: contract.code,
          contractStatus: contract.status,
          supplierName: contract.supplierName,
          totalContracted,
          totalReceived,
          totalRemaining: totalContracted - totalReceived,
          overallCompletionRate: parseFloat(overallCompletionRate),
          items: itemProgress,
        },
        message: '执行进度查询成功',
      };
    },

    /** 批量审核 */
    async batchApprove({ body, userId, prisma }) {
      const { ids, approved } = body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('请选择要审核的采购合同');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          const contract = await prisma.purchaseContract.findUnique({
            where: { id },
            select: { code: true, status: true },
          });

          if (!contract) {
            throw new Error('采购合同不存在');
          }

          if (contract.status !== 'PENDING') {
            throw new Error(`状态为 ${contract.status}，无法审核`);
          }

          return await prisma.purchaseContract.update({
            where: { id },
            data: {
              approvalStatus: approved ? 'APPROVED' : 'REJECTED',
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

    /** 复制合同 */
    async copy({ id, body, userId, prisma }) {
      const original = await prisma.purchaseContract.findUnique({
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { lineNumber: 'asc' },
          },
        },
      });

      if (!original) {
        throw new Error('原采购合同不存在');
      }

      // 创建新合同
      const {
        id: _,
        code: __,
        items: ___,
        createdAt,
        updatedAt,
        deletedAt,
        ...masterData
      } = original;

      const newContract = await prisma.purchaseContract.create({
        data: {
          ...masterData,
          code: body.newCode || undefined,
          contractDate: new Date(),
          status: 'DRAFT',
          approvalStatus: 'PENDING',
          confirmStatus: 'UNCONFIRMED',
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: original.items.map((item: any) => {
              const {
                id: _itemId,
                purchaseContractId: _contractId,
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
        data: newContract,
        message: `采购合同复制成功，新合同编号：${newContract.code}`,
      };
    },

    /** 从采购计划生成 */
    async createFromPurchasePlan({ body, userId, prisma }) {
      const { purchasePlanId, itemIds } = body;

      validateRequiredFields(body, ['purchasePlanId', 'itemIds']);

      const plan = await prisma.purchasePlan.findUnique({
        where: { id: purchasePlanId },
        include: {
          items: {
            where: {
              id: { in: itemIds },
              deletedAt: null,
            },
          },
        },
      });

      if (!plan) {
        throw new Error('采购计划不存在');
      }

      if (plan.items.length === 0) {
        throw new Error('未找到选中的明细项');
      }

      // 按供应商分组
      const itemsBySupplier = new Map<string, any[]>();
      for (const item of plan.items) {
        if (!item.supplierId) {
          throw new Error(`产品 ${item.productCode} 未分配供应商`);
        }

        const key = item.supplierId;
        if (!itemsBySupplier.has(key)) {
          itemsBySupplier.set(key, []);
        }
        itemsBySupplier.get(key)!.push(item);
      }

      const contracts = [];

      // 为每个供应商生成一个采购合同
      for (const [supplierId, items] of itemsBySupplier) {
        const firstItem = items[0];

        // 生成编号
        const today = new Date();
        const prefix = `PC${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const lastContract = await prisma.purchaseContract.findFirst({
          where: { code: { startsWith: prefix } },
          orderBy: { code: 'desc' },
        });
        let seq = 1;
        if (lastContract) {
          seq = parseInt(lastContract.code.substring(prefix.length)) + 1;
        }
        const contractCode = `${prefix}${String(seq).padStart(4, '0')}`;

        const contract = await prisma.purchaseContract.create({
          data: {
            code: contractCode,
            contractDate: new Date(),
            deliveryDate: plan.expectedDeliveryDate || new Date(),
            purchasePlanId: plan.id,
            purchasePlanCode: plan.code,
            supplierId: firstItem.supplierId!,
            supplierCode: firstItem.supplierCode || '',
            supplierName: firstItem.supplierName || '',
            buyer: plan.buyer,
            contractType: 'STANDARD',
            currency: 'CNY',
            status: 'DRAFT',
            approvalStatus: 'PENDING',
            createdBy: userId,
            updatedBy: userId,
            items: {
              create: items.map((item: any, index: number) => ({
                lineNumber: index + 1,
                productId: item.productId,
                productCode: item.productCode,
                productName: item.productName,
                specification: item.specification,
                quantity: item.purchaseQuantity,
                unitPrice: item.unitPrice || 0,
                amount: item.totalAmount || 0,
                unit: item.unit,
                currency: item.currency || 'CNY',
                deliveryDate: item.deliveryDate,
                purchasePlanItemId: item.id,
                createdBy: userId,
                updatedBy: userId,
              })),
            },
          },
          include: { items: true },
        });

        contracts.push(contract);
      }

      return {
        data: contracts,
        message: `成功生成 ${contracts.length} 个采购合同`,
      };
    },
  },
};

/**
 * 辅助函数：回写销售合同明细的真实采购价和跟单员
 * @param prisma Prisma client
 * @param items 采购合同明细
 * @param managerId 跟单员ID
 * @param buyerId 采购员ID
 */
async function updateSalesContractRealPurchasePrice(
  prisma: any,
  items: any[],
  managerId?: string,
  buyerId?: string
) {
  const salesItemUpdates = new Map<string, any>();

  // 统计每个销售合同明细的真实采购价（取最新的采购价）
  for (const item of items) {
    if (item.salesContractItemId) {
      const unitPrice = item.unitPriceWithTax || item.unitPrice || 0;
      
      salesItemUpdates.set(item.salesContractItemId, {
        realPurchasePrice: unitPrice,
        realPurchasePriceUpdatedAt: new Date(),
        ...(managerId && { managerId }),
        ...(buyerId && { realBuyerId: buyerId }),
      });
    }
  }

  // 批量更新销售合同明细
  for (const [itemId, updateData] of salesItemUpdates.entries()) {
    await prisma.salesContractItem.update({
      where: { id: itemId },
      data: updateData,
    });
  }
}

/**
 * 辅助函数：回写销售合同的赠品数量
 * @param prisma Prisma client
 * @param items 采购合同明细
 */
async function updateSalesContractFreeQuantity(prisma: any, items: any[]) {
  const freeQuantityMap = new Map<string, number>();

  // 统计每个销售合同明细的赠品数量
  for (const item of items) {
    if (
      item.salesContractItemId &&
      item.isFree &&
      item.freeQuantity &&
      item.freeQuantity > 0
    ) {
      const currentQty = freeQuantityMap.get(item.salesContractItemId) || 0;
      freeQuantityMap.set(
        item.salesContractItemId,
        currentQty + item.freeQuantity
      );
    }
  }

  // 批量更新销售合同明细的赠品数量
  for (const [itemId, freeQty] of freeQuantityMap.entries()) {
    await prisma.salesContractItem.update({
      where: { id: itemId },
      data: {
        purchaseFreeQuantity: { increment: freeQty },
      },
    });
  }
}

/**
 * 辅助函数：回写采购计划状态
 * @param prisma Prisma client
 * @param purchasePlanId 采购计划ID
 */
async function updatePurchasePlanStatus(
  prisma: any,
  purchasePlanId: string
) {
  // 检查该采购计划下的所有采购合同是否都已审批通过
  const contracts = await prisma.purchaseContract.findMany({
    where: {
      purchasePlanId,
      deletedAt: null,
    },
    select: {
      id: true,
      approvalStatus: true,
    },
  });

  if (contracts.length === 0) return;

  // 判断是否全部审批通过
  const allApproved = contracts.every(
    (c: any) => c.approvalStatus === 'APPROVED'
  );

  if (allApproved) {
    // 更新采购计划状态为"待采购"或"进行中"
    await prisma.purchasePlan.update({
      where: { id: purchasePlanId },
      data: {
        planStatus: 'IN_PROGRESS',
        toContractStatus: 'COMPLETED', // 标记为已全部转采购合同
      },
    });
  } else {
    // 部分审批通过，更新为"部分转合同"
    await prisma.purchasePlan.update({
      where: { id: purchasePlanId },
      data: {
        toContractStatus: 'PARTIAL',
      },
    });
  }
}
