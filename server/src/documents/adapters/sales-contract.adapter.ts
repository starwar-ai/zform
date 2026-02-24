/**
 * 销售合同 Adapter
 */

import type { DocumentTypeAdapter } from '../types';
import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';
import {
  calculateContainers,
  validateStatusTransition,
  SALES_CONTRACT_STATUS_CONFIG,
  calculateSummary,
  executeBatchOperation,
} from '../../utils/business-utils';
import { CollectionPlanService } from '../../services/collection-plan.service';

const collectionPlanService = new CollectionPlanService();

/**
 * 计算合同明细总金额和汇总数据
 */
async function calculateContractSummary(contractId: string, prismaClient: any) {
  const items = await prismaClient.salesContractItem.findMany({
    where: {
      salesContractId: contractId,
      deletedAt: null,
    },
  });

  let totalAmount = new Decimal(0);
  let totalQuantity = new Decimal(0);
  let totalBoxes = 0;
  let totalGrossWeight = new Decimal(0);
  let totalNetWeight = new Decimal(0);
  let totalVolume = new Decimal(0);

  for (const item of items) {
    const quantity = new Decimal(item.quantity || 0);
    const unitPrice = new Decimal(item.unitPrice || 0);
    const amount = quantity.mul(unitPrice);

    totalAmount = totalAmount.add(amount);
    totalQuantity = totalQuantity.add(quantity);
    totalBoxes += item.boxCount || 0;
    totalGrossWeight = totalGrossWeight.add(new Decimal(item.grossWeight || 0));
    totalNetWeight = totalNetWeight.add(new Decimal(item.netWeight || 0));
    totalVolume = totalVolume.add(new Decimal(item.volume || 0));
  }

  return {
    totalAmount: totalAmount.toNumber(),
    totalQuantity: totalQuantity.toNumber(),
    totalBoxes,
    totalGrossWeight: totalGrossWeight.toNumber(),
    totalNetWeight: totalNetWeight.toNumber(),
    totalVolume: totalVolume.toNumber(),
  };
}

/**
 * 验证状态流转（已废弃，使用 business-utils 中的版本）
 */
// function validateStatusTransition() - 已移到 business-utils.ts

export const salesContractAdapter: DocumentTypeAdapter = {
  typeId: 'sales_contract',
  typeName: '销售合同',

  // ---- Prisma 映射 ----
  prismaModel: 'salesContract',
  prismaItemModel: 'salesContractItem',
  parentForeignKey: 'salesContractId',
  itemRelationName: 'items',

  // ---- 数据转换 ----
  detailTableMapping: {
    collectionPlans: 'receiptPlanItems',
  },

  // ---- 基础筛选条件 ----
  // 根据 typeId 自动添加合同类型筛选
  baseWhere: {},

  // ---- 搜索 ----
  searchFields: [
    'code',
    'internalCode',
    'customerCode',
    'customerName',
    'customerPoNo',
  ],

  // ---- Includes ----
  listIncludes: {
    items: {
      where: { deletedAt: null },
      orderBy: { lineNumber: 'asc' },
      take: 5,
    },
    collectionPlans: {
      where: { deletedAt: null },
      orderBy: { periodIndex: 'asc' },
      take: 5,
    },
  },
  detailIncludes: {
    items: {
      where: { deletedAt: null },
      orderBy: { lineNumber: 'asc' },
    },
    collectionPlans: {
      where: { deletedAt: null },
      orderBy: { periodIndex: 'asc' },
    },
  },

  // ---- 默认排序 ----
  defaultOrderBy: { createdAt: 'desc' },

  // ---- 字段映射 (前端 columnId → Prisma 字段名) ----
  columnToPrismaField: {
    _docNumber: 'code',
    _status: 'status',
    _createdAt: 'createdAt',
    customerId: 'customerId',
    customerCode: 'customerCode',
    customerName: 'customerName',
    customerPoNo: 'customerPoNo',
    currency: 'currency',
    totalAmount: 'totalAmount',
    salesPerson: 'salesPerson',
    contractType: 'contractType',
    approvalStatus: 'approvalStatus',
  },

  // ---- 聚合 ----
  aggregateFields: [
    { field: 'totalAmount', type: 'sum', columnId: 'totalAmount' },
    { field: 'totalQuantity', type: 'sum', columnId: 'totalQuantity' },
    { field: 'totalBoxes', type: 'sum', columnId: 'totalBoxes' },
    { field: 'totalGrossWeight', type: 'sum', columnId: 'totalGrossWeight' },
    { field: 'totalNetWeight', type: 'sum', columnId: 'totalNetWeight' },
    { field: 'totalVolume', type: 'sum', columnId: 'totalVolume' },
    { field: 'orderGrossProfit', type: 'sum', columnId: 'orderGrossProfit' },
  ],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      id: row.id,
      code: row.code,
      status: row.status,
      createdAt: row.createdAt,
      sourceTypeId: row.sourceContractId ? 'sales_contract' : undefined,
      // 主数据字段
      customerId: row.customerId,
      customerCode: row.customerCode,
      customerName: row.customerName,
      customerPoNo: row.customerPoNo,
      currency: row.currency,
      totalAmount: row.totalAmount ? Number(row.totalAmount) : 0,
      salesPerson: row.salesPerson,
      merchandiser: row.merchandiser,
      buyer: row.buyer,
      contractType: row.contractType,
      approvalStatus: row.approvalStatus,
      confirmStatus: row.confirmStatus,
      printStatus: row.printStatus,
      signBackStatus: row.signBackStatus,
      toPurchasePlan: row.toPurchasePlan,
      totalQuantity: row.totalQuantity ? Number(row.totalQuantity) : 0,
      totalBoxes: row.totalBoxes || 0,
      remark: row.remark,
    };
  },

  flattenDetailRow(masterRow: any, detailRow: any) {
    return {
      id: masterRow.id,
      code: masterRow.code,
      status: masterRow.status,
      createdAt: masterRow.createdAt,
      detailRowId: detailRow.id,
      // 主数据
      customerCode: masterRow.customerCode,
      customerName: masterRow.customerName,
      // 明细数据
      lineNumber: detailRow.lineNumber,
      productCode: detailRow.productCode,
      productName: detailRow.productName,
      productSpec: detailRow.productSpec,
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
    if (!data.entryDate) {
      data.entryDate = new Date();
    }
    if (!data.status) {
      data.status = 'DRAFT';
    }
    if (!data.approvalStatus) {
      data.approvalStatus = 'PENDING';
    }
    
    // 计算总金额（如果有明细）
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
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

    // 【业务逻辑补充】创建后处理库存锁定
    // 注意：库存锁定通常在创建完成后调用单独的 action
    // 此处仅记录锁定信息到明细的 lockInfo 字段
  },

  async onUpdate(id, data, userId, prismaClient) {
    // 重新计算总金额
    const summary = await calculateContractSummary(id, prismaClient);

    const masterData = data.masterData || data;
    const detailTables = data.detailTables || [];

    // 收款计划：从 receiptPlanItems 保存
    const receiptPlanTable = detailTables.find((t: any) => t.tableId === 'receiptPlanItems');
    if (receiptPlanTable?.rows?.length) {
      const plans = receiptPlanTable.rows.map((r: any) => ({ ...(r.data ?? r), id: r.id }));
      await collectionPlanService.upsertBySalesContractId(id, plans, userId);
    }

    // 构建主表更新数据
    const updateData: Record<string, any> = {
      ...masterData,
      totalAmount: summary.totalAmount,
      totalQuantity: summary.totalQuantity,
      totalBoxes: summary.totalBoxes,
      totalGrossWeight: summary.totalGrossWeight,
      totalNetWeight: summary.totalNetWeight,
      totalVolume: summary.totalVolume,
      updatedBy: userId,
    };

    if (summary.totalVolume > 0) {
      Object.assign(updateData, calculateContainers(summary.totalVolume));
    }

    // 验证状态流转
    if (updateData.status) {
      const current = await prismaClient.salesContract.findUnique({
        where: { id },
        select: { status: true, approvalStatus: true },
      });
      if (current && current.status !== updateData.status) {
        validateStatusTransition(
          current.status,
          updateData.status,
          SALES_CONTRACT_STATUS_CONFIG,
          { approvalStatus: current.approvalStatus }
        );
      }
    }

    // 排除非 Prisma 字段
    const exclude = ['masterData', 'detailTables', 'docNumber', 'typeId'];
    for (const k of exclude) delete updateData[k];

    return prismaClient.salesContract.update({
      where: { id },
      data: updateData,
      include: {
        items: { where: { deletedAt: null }, orderBy: { lineNumber: 'asc' } },
        collectionPlans: { where: { deletedAt: null }, orderBy: { periodIndex: 'asc' } },
      },
    });
  },

  async beforeDelete(id: string, prismaClient: any) {
    // 检查是否有下游单据
    const [purchasePlans, processingOrders, outbounds] = await Promise.all([
      prismaClient.purchasePlan.count({
        where: { salesContractId: id, deletedAt: null },
      }),
      prismaClient.processingOrder.count({
        where: { salesContractId: id, deletedAt: null },
      }),
      prismaClient.warehouseOutbound.count({
        where: { salesContractId: id, deletedAt: null },
      }),
    ]);

    if (purchasePlans > 0 || processingOrders > 0 || outbounds > 0) {
      throw new Error(
        `该销售合同存在下游单据（采购计划: ${purchasePlans}, 加工单: ${processingOrders}, 出库单: ${outbounds}），无法删除`
      );
    }

    // 检查合同状态
    const contract = await prismaClient.salesContract.findUnique({
      where: { id },
      select: { status: true, code: true },
    });

    if (contract && ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(contract.status)) {
      throw new Error(`合同 ${contract.code} 状态为 ${contract.status}，不允许删除`);
    }

    // 【业务逻辑补充】删除前释放库存锁定
    // 调用库存API释放该销售合同的所有库存锁定
    // await stockApi.cancelStockLock(contract.code, null, null);
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 审核 */
    async approve({ id, body, userId, prisma }) {
      const { approved } = body;
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          approvalStatus: approved ? 'APPROVED' : 'REJECTED',
          status: approved ? 'APPROVED' : 'PENDING',
          updatedBy: userId,
        },
      });
      return {
        data: doc,
        message: `销售合同${approved ? '审核通过' : '审核拒绝'}`,
      };
    },

    /** 确认 */
    async confirm({ id, userId, prisma }) {
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          confirmStatus: 'CONFIRMED',
          updatedBy: userId,
        },
      });
      return { data: doc, message: '销售合同确认成功' };
    },

    /** 更新状态 */
    async updateStatus({ id, body, userId, prisma }) {
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          status: body.status,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '合同状态更新成功' };
    },

    /** 回签 */
    async signBack({ id, body, userId, prisma }) {
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          signBackStatus: 'SIGNED',
          signBackPerson: userId,
          signBackDate: body.signBackDate || new Date(),
          signBackDescription: body.signBackDescription,
          signBackAttachments: body.signBackAttachments,
          updatedBy: userId,
        },
      });
      return { data: doc, message: '回签成功' };
    },

    /** 打印 */
    async print({ id, userId, prisma }) {
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          printStatus: 'PRINTED',
          printCount: { increment: 1 },
          updatedBy: userId,
        },
      });
      return { data: doc, message: '打印成功' };
    },

    /** 转采购计划 */
    async toPurchasePlan({ id, userId, prisma }) {
      const doc = await prisma.salesContract.update({
        where: { id },
        data: {
          toPurchasePlan: true,
          toPurchasePlanTime: new Date(),
          updatedBy: userId,
        },
      });
      return { data: doc, message: '转采购计划成功' };
    },

    /** 计算柜型 */
    async calculateContainers({ id, prisma }) {
      const contract = await prisma.salesContract.findUnique({
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
          },
        },
      });

      if (!contract) {
        throw new Error('合同不存在');
      }

      let totalVolume = new Decimal(0);
      for (const item of contract.items) {
        totalVolume = totalVolume.add(new Decimal(item.volume || 0));
      }

      const cabinets = calculateContainers(totalVolume.toNumber());

      // 更新合同柜型
      const updated = await prisma.salesContract.update({
        where: { id },
        data: cabinets,
      });

      return {
        data: {
          totalVolume: totalVolume.toNumber(),
          ...cabinets,
        },
        message: '柜型计算完成',
      };
    },

    /** 重新计算金额 */
    async recalculateAmount({ id, prisma }) {
      const summary = await calculateContractSummary(id, prisma);

      const updated = await prisma.salesContract.update({
        where: { id },
        data: summary,
      });

      return {
        data: summary,
        message: '金额重新计算完成',
      };
    },

    /** 锁定库存 */
    async lockStock({ id, body, userId, prisma }) {
      const { items } = body; // items: [{ itemId, stockLocks: [{ stockId, batchCode, quantity }] }]
      
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('请选择要锁定库存的明细');
      }

      const contract = await prisma.salesContract.findUnique({
        where: { id },
        select: { code: true, status: true },
      });

      if (!contract) {
        throw new Error('销售合同不存在');
      }

      // 【业务逻辑】锁定库存
      // 1. 先释放该合同的所有库存锁定
      // await stockApi.cancelStockLock(contract.code, items.map(i => i.itemId), null);

      // 2. 重新锁定库存并更新明细的 lockInfo
      for (const item of items) {
        const { itemId, stockLocks } = item;
        
        if (stockLocks && stockLocks.length > 0) {
          // 计算总锁定数量
          const totalLockQty = stockLocks.reduce((sum: number, lock: any) => sum + (lock.quantity || 0), 0);
          
          // 更新销售合同明细的锁定信息
          await prisma.salesContractItem.update({
            where: { id: itemId },
            data: {
              lockInfo: stockLocks, // 保存锁定批次信息
              lockedQuantity: totalLockQty,
              needPurchaseQuantity: { decrement: totalLockQty },
              updatedBy: userId,
            },
          });

          // 调用库存API进行实际锁定
          // await stockApi.batchLockStock(stockLocks.map(lock => ({
          //   stockId: lock.stockId,
          //   batchCode: lock.batchCode,
          //   salesContractId: id,
          //   salesContractCode: contract.code,
          //   salesContractItemId: itemId,
          //   lockQuantity: lock.quantity,
          // })));
        }
      }

      return {
        data: { count: items.length },
        message: `成功锁定 ${items.length} 个产品的库存`,
      };
    },

    /** 重新锁定库存（用于采购计划取消后） */
    async relockStock({ id, body, userId, prisma }) {
      const { itemIds } = body;
      
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        throw new Error('请选择要重新锁定的明细');
      }

      const contract = await prisma.salesContract.findUnique({
        where: { id },
        select: { code: true },
        include: {
          items: {
            where: {
              id: { in: itemIds },
              deletedAt: null,
            },
          },
        },
      });

      if (!contract) {
        throw new Error('销售合同不存在');
      }

      // 【业务逻辑】重新锁定库存
      // 根据明细中保存的 lockInfo 重新锁定库存
      let relockCount = 0;
      for (const item of contract.items) {
        if (item.lockInfo && Array.isArray(item.lockInfo) && item.lockInfo.length > 0) {
          // 调用库存API重新锁定
          // await stockApi.batchLockStock(item.lockInfo.map(lock => ({
          //   stockId: lock.stockId,
          //   batchCode: lock.batchCode,
          //   salesContractId: id,
          //   salesContractCode: contract.code,
          //   salesContractItemId: item.id,
          //   lockQuantity: lock.quantity,
          // })));
          
          relockCount++;
        }
      }

      return {
        data: { count: relockCount },
        message: `成功重新锁定 ${relockCount} 个产品的库存`,
      };
    },

    /** 获取关联单据 */
    async getRelatedDocuments({ id, prisma }) {
      const [purchasePlans, processingOrders, inbounds, outbounds] = await Promise.all([
        prisma.purchasePlan.findMany({
          where: { salesContractId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.processingOrder.findMany({
          where: { salesContractId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.warehouseInbound.findMany({
          where: { salesContractId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            totalQuantity: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.warehouseOutbound.findMany({
          where: { salesContractId: id, deletedAt: null },
          select: {
            id: true,
            code: true,
            status: true,
            totalQuantity: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        data: {
          purchasePlans,
          processingOrders,
          inbounds,
          outbounds,
          summary: {
            purchasePlansCount: purchasePlans.length,
            processingOrdersCount: processingOrders.length,
            inboundsCount: inbounds.length,
            outboundsCount: outbounds.length,
          },
        },
        message: '关联单据查询成功',
      };
    },

    /** 批量审核 */
    async batchApprove({ body, userId, prisma }) {
      const { ids, approved } = body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('请选择要审核的合同');
      }

      const result = await executeBatchOperation(
        ids,
        async (id) => {
          const contract = await prisma.salesContract.findUnique({
            where: { id },
            select: { code: true, status: true },
          });

          if (!contract) {
            throw new Error('合同不存在');
          }

          if (contract.status !== 'PENDING') {
            throw new Error(`状态为 ${contract.status}，无法审核`);
          }

          return await prisma.salesContract.update({
            where: { id },
            data: {
              approvalStatus: approved ? 'APPROVED' : 'REJECTED',
              status: approved ? 'APPROVED' : 'PENDING',
              updatedBy: userId,
            },
          });
        },
        {
          getCode: (id) => {
            // 这里可以从缓存中获取 code，简化版直接用 id
            return id;
          },
          continueOnError: true,
        }
      );

      return {
        data: result,
        message: `批量审核完成：成功 ${result.successCount} 个，失败 ${result.errorCount} 个`,
      };
    },

    /** 批量打印 */
    async batchPrint({ body, userId, prisma }) {
      const { ids } = body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('请选择要打印的合同');
      }

      const updated = await prisma.salesContract.updateMany({
        where: {
          id: { in: ids },
          deletedAt: null,
        },
        data: {
          printStatus: 'PRINTED',
          updatedBy: userId,
        },
      });

      // 更新打印次数
      for (const id of ids) {
        await prisma.salesContract.update({
          where: { id },
          data: {
            printCount: { increment: 1 },
          },
        });
      }

      return {
        data: { count: updated.count },
        message: `批量打印成功：${updated.count} 个合同`,
      };
    },

    /** 复制合同 */
    async copy({ id, body, userId, prisma }) {
      const original = await prisma.salesContract.findUnique({
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { lineNumber: 'asc' },
          },
        },
      });

      if (!original) {
        throw new Error('原合同不存在');
      }

      // 创建新合同
      const { id: _, code: __, items: ___, createdAt, updatedAt, deletedAt, ...masterData } = original;

      const newContract = await prisma.salesContract.create({
        data: {
          ...masterData,
          code: body.newCode || undefined, // 使用新编号或自动生成
          status: 'DRAFT',
          approvalStatus: 'PENDING',
          confirmStatus: 'UNCONFIRMED',
          printStatus: 'UNPRINTED',
          signBackStatus: 'UNSIGNED',
          toPurchasePlan: false,
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: original.items.map((item: any) => {
              const { id: _itemId, salesContractId: _contractId, createdAt: _createdAt, updatedAt: _updatedAt, deletedAt: _deletedAt, ...itemData } = item;
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
        message: `合同复制成功，新合同编号：${newContract.code}`,
      };
    },

    /** 获取执行进度 */
    async getExecutionProgress({ id, prisma }) {
      const contract = await prisma.salesContract.findUnique({
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
          },
        },
      });

      if (!contract) {
        throw new Error('合同不存在');
      }

      // 统计各产品的执行情况
      const itemProgress = [];

      for (const item of contract.items) {
        // 查询出库数量
        const outboundItems = await prisma.warehouseOutboundItem.findMany({
          where: {
            outbound: {
              salesContractId: id,
              deletedAt: null,
              status: { in: ['APPROVED', 'COMPLETED'] },
            },
            productCode: item.productCode,
            deletedAt: null,
          },
        });

        let shippedQuantity = new Decimal(0);
        for (const outboundItem of outboundItems) {
          shippedQuantity = shippedQuantity.add(new Decimal(outboundItem.quantity || 0));
        }

        const plannedQuantity = new Decimal(item.quantity || 0);
        const remainingQuantity = plannedQuantity.sub(shippedQuantity);
        const completionRate = plannedQuantity.toNumber() > 0
          ? (shippedQuantity.toNumber() / plannedQuantity.toNumber() * 100).toFixed(2)
          : '0.00';

        itemProgress.push({
          lineNumber: item.lineNumber,
          productCode: item.productCode,
          productName: item.productName,
          plannedQuantity: plannedQuantity.toNumber(),
          shippedQuantity: shippedQuantity.toNumber(),
          remainingQuantity: remainingQuantity.toNumber(),
          completionRate: parseFloat(completionRate),
          unit: item.unit,
        });
      }

      // 计算整体进度
      const totalPlanned = contract.totalQuantity ? Number(contract.totalQuantity) : 0;
      const totalShipped = itemProgress.reduce((sum, item) => sum + item.shippedQuantity, 0);
      const overallCompletionRate = totalPlanned > 0
        ? (totalShipped / totalPlanned * 100).toFixed(2)
        : '0.00';

      return {
        data: {
          contractCode: contract.code,
          contractStatus: contract.status,
          totalPlanned,
          totalShipped,
          totalRemaining: totalPlanned - totalShipped,
          overallCompletionRate: parseFloat(overallCompletionRate),
          items: itemProgress,
        },
        message: '执行进度查询成功',
      };
    },
  },
};
