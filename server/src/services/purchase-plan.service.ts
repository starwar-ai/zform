import prisma from '../config/database';
import { Prisma, PurchasePlanStatus } from '@prisma/client';

export class PurchasePlanService {
  /**
   * 创建采购计划
   */
  async create(data: Prisma.PurchasePlanCreateInput, userId: string) {
    const purchasePlan = await prisma.purchasePlan.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        items: true,
      },
    });

    return purchasePlan;
  }

  /**
   * 从销售合同生成采购计划
   */
  async createFromSalesContract(salesContractId: string, userId: string) {
    // 查询销售合同及其明细
    const salesContract = await prisma.salesContract.findUnique({
      where: { id: salesContractId },
      include: {
        items: true,
      },
    });

    if (!salesContract) {
      throw new Error('销售合同不存在');
    }

    if (salesContract.toPurchasePlan) {
      throw new Error('该销售合同已生成采购计划');
    }

    // 生成采购计划编号（示例：PP + 日期 + 序号）
    const planCode = await this.generatePlanCode();

    // 创建采购计划
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
          create: salesContract.items.map((item, index) => ({
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
      include: {
        items: true,
      },
    });

    // 更新销售合同的转采购计划标记
    await prisma.salesContract.update({
      where: { id: salesContractId },
      data: {
        toPurchasePlan: true,
        toPurchasePlanTime: new Date(),
      },
    });

    return purchasePlan;
  }

  /**
   * 分页查询采购计划
   */
  async findMany(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    planStatus?: PurchasePlanStatus;
    approvalStatus?: string;
    customerId?: string;
    buyer?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const {
      page = 1,
      pageSize = 20,
      search,
      planStatus,
      approvalStatus,
      customerId,
      buyer,
      startDate,
      endDate,
    } = params;

    const pageNumber = Number(page) || 1;
    const pageSizeNumber = Number(pageSize) || 20;

    const where: Prisma.PurchasePlanWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { salesContractCode: { contains: search, mode: 'insensitive' } },
          { customerCode: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(planStatus && { planStatus }),
      ...(approvalStatus && { approvalStatus: approvalStatus as any }),
      ...(customerId && { customerId }),
      ...(buyer && { buyer }),
      ...(startDate && {
        planDate: {
          gte: new Date(startDate),
        },
      }),
      ...(endDate && {
        planDate: {
          lte: new Date(endDate),
        },
      }),
    };

    const [plans, total] = await Promise.all([
      prisma.purchasePlan.findMany({
        where,
        skip: (pageNumber - 1) * pageSizeNumber,
        take: pageSizeNumber,
        include: {
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchasePlan.count({ where }),
    ]);

    return {
      plans,
      total,
      page: pageNumber,
      pageSize: pageSizeNumber,
      totalPages: Math.ceil(total / pageSizeNumber),
    };
  }

  /**
   * 获取采购计划详情
   */
  async findById(id: string) {
    const plan = await prisma.purchasePlan.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new Error('采购计划不存在');
    }

    return plan;
  }

  /**
   * 更新采购计划
   */
  async update(id: string, data: Prisma.PurchasePlanUpdateInput, userId: string) {
    const oldPlan = await prisma.purchasePlan.findUnique({ where: { id } });
    if (!oldPlan) {
      throw new Error('采购计划不存在');
    }

    const updated = await prisma.purchasePlan.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: {
        items: true,
      },
    });

    return updated;
  }

  /**
   * 更新采购计划明细
   */
  async updateItem(
    planId: string,
    itemId: string,
    data: Prisma.PurchasePlanItemUpdateInput,
    userId: string
  ) {
    // 验证采购计划是否存在
    const plan = await prisma.purchasePlan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new Error('采购计划不存在');
    }

    const item = await prisma.purchasePlanItem.update({
      where: { id: itemId },
      data: {
        ...data,
        updatedBy: userId,
      },
    });

    // 重新计算总额
    if (data.purchaseQuantity || data.unitPrice) {
      const qty = item.purchaseQuantity.toNumber();
      const price = item.unitPrice.toNumber();
      const totalAmount = qty * price;
      const taxRate = item.taxRate?.toNumber() || 0;
      const totalAmountWithTax = item.includeTax
        ? totalAmount
        : totalAmount * (1 + taxRate / 100);

      await prisma.purchasePlanItem.update({
        where: { id: itemId },
        data: {
          totalAmount,
          totalAmountWithTax,
        },
      });
    }

    return item;
  }

  /**
   * 添加采购计划明细
   */
  async addItem(planId: string, itemData: Prisma.PurchasePlanItemCreateInput, userId: string) {
    const plan = await prisma.purchasePlan.findUnique({
      where: { id: planId },
      include: { items: true },
    });

    if (!plan) {
      throw new Error('采购计划不存在');
    }

    const maxLineNumber = plan.items.reduce((max, item) => Math.max(max, item.lineNumber), 0);

    const item = await prisma.purchasePlanItem.create({
      data: {
        ...itemData,
        lineNumber: maxLineNumber + 1,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return item;
  }

  /**
   * 删除采购计划明细
   */
  async deleteItem(itemId: string) {
    await prisma.purchasePlanItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  }

  /**
   * 审核采购计划
   */
  async approve(id: string, userId: string) {
    const plan = await prisma.purchasePlan.findUnique({ where: { id } });
    if (!plan) {
      throw new Error('采购计划不存在');
    }

    if (plan.approvalStatus === 'APPROVED') {
      throw new Error('采购计划已审核');
    }

    const updated = await prisma.purchasePlan.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        planStatus: 'APPROVED',
        updatedBy: userId,
      },
      include: {
        items: true,
      },
    });

    return updated;
  }

  /**
   * 拒绝采购计划
   */
  async reject(id: string, reason: string, userId: string) {
    const plan = await prisma.purchasePlan.findUnique({ where: { id } });
    if (!plan) {
      throw new Error('采购计划不存在');
    }

    const updated = await prisma.purchasePlan.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        planStatus: 'DRAFT',
        remark: plan.remark ? `${plan.remark}\n拒绝原因: ${reason}` : `拒绝原因: ${reason}`,
        updatedBy: userId,
      },
      include: {
        items: true,
      },
    });

    return updated;
  }

  /**
   * 取消采购计划
   */
  async cancel(id: string, userId: string) {
    const plan = await prisma.purchasePlan.findUnique({ where: { id } });
    if (!plan) {
      throw new Error('采购计划不存在');
    }

    if (plan.planStatus === 'COMPLETED' || plan.planStatus === 'CLOSED') {
      throw new Error('已完成或已结案的采购计划不能取消');
    }

    const updated = await prisma.purchasePlan.update({
      where: { id },
      data: {
        planStatus: 'CANCELLED',
        updatedBy: userId,
      },
      include: {
        items: true,
      },
    });

    return updated;
  }

  /**
   * 软删除采购计划
   */
  async delete(id: string, userId: string) {
    const plan = await prisma.purchasePlan.findUnique({ where: { id } });
    if (!plan) {
      throw new Error('采购计划不存在');
    }

    if (plan.planStatus !== 'DRAFT' && plan.planStatus !== 'CANCELLED') {
      throw new Error('只能删除草稿或已取消的采购计划');
    }

    return prisma.purchasePlan.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  /**
   * 生成采购计划编号
   */
  private async generatePlanCode(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `PP${year}${month}${day}`;

    // 查询当天最大序号
    const lastPlan = await prisma.purchasePlan.findFirst({
      where: {
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        code: 'desc',
      },
    });

    let sequence = 1;
    if (lastPlan) {
      const lastSequence = parseInt(lastPlan.code.substring(prefix.length));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * 获取采购计划统计
   */
  async getStatistics(params: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    buyer?: string;
  }) {
    const { startDate, endDate, customerId, buyer } = params;

    const where: Prisma.PurchasePlanWhereInput = {
      deletedAt: null,
      ...(customerId && { customerId }),
      ...(buyer && { buyer }),
      ...(startDate && {
        planDate: {
          gte: new Date(startDate),
        },
      }),
      ...(endDate && {
        planDate: {
          lte: new Date(endDate),
        },
      }),
    };

    const [total, draft, pending, approved, inProgress, completed, closed, cancelled] =
      await Promise.all([
        prisma.purchasePlan.count({ where }),
        prisma.purchasePlan.count({ where: { ...where, planStatus: 'DRAFT' } }),
        prisma.purchasePlan.count({ where: { ...where, planStatus: 'PENDING' } }),
        prisma.purchasePlan.count({ where: { ...where, planStatus: 'APPROVED' } }),
        prisma.purchasePlan.count({ where: { ...where, planStatus: 'IN_PROGRESS' } }),
        prisma.purchasePlan.count({ where: { ...where, planStatus: 'COMPLETED' } }),
        prisma.purchasePlan.count({ where: { ...where, planStatus: 'CLOSED' } }),
        prisma.purchasePlan.count({ where: { ...where, planStatus: 'CANCELLED' } }),
      ]);

    return {
      total,
      byStatus: {
        draft,
        pending,
        approved,
        inProgress,
        completed,
        closed,
        cancelled,
      },
    };
  }
}
