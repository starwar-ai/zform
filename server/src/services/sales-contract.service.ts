import prisma from '../config/database';
import { Prisma, SalesContractStatus, SalesContractType, ApprovalStatus } from '@prisma/client';

export class SalesContractService {
  // 创建销售合同（包含明细）
  async create(
    data: Prisma.SalesContractCreateInput & {
      items?: Prisma.SalesContractItemCreateWithoutSalesContractInput[];
    },
    userId: string
  ) {
    const { items, ...contractData } = data;

    const salesContract = await prisma.salesContract.create({
      data: {
        ...contractData,
        createdBy: userId,
        updatedBy: userId,
        ...(items && items.length > 0 && {
          items: {
            create: items.map((item, index) => ({
              ...item,
              lineNumber: index + 1,
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        }),
      },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    return salesContract;
  }

  // 分页查询销售合同
  async findMany(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    customerId?: string;
    status?: string;
    approvalStatus?: string;
    contractType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const {
      page = 1,
      pageSize = 20,
      search,
      customerId,
      status,
      approvalStatus,
      contractType,
      startDate,
      endDate,
    } = params;

    const pageNumber = Number(page) || 1;
    const pageSizeNumber = Number(pageSize) || 20;

    const where: Prisma.SalesContractWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { internalCode: { contains: search, mode: 'insensitive' } },
          { customerCode: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerPoNo: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(customerId && { customerId }),
      ...(status && { status: status as SalesContractStatus }),
      ...(approvalStatus && { approvalStatus: approvalStatus as ApprovalStatus }),
      ...(contractType && { contractType: contractType as SalesContractType }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [contracts, total] = await Promise.all([
      prisma.salesContract.findMany({
        where,
        skip: (pageNumber - 1) * pageSizeNumber,
        take: pageSizeNumber,
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { lineNumber: 'asc' },
            take: 5, // 列表只显示前5条明细
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salesContract.count({ where }),
    ]);

    return { contracts, total, page: pageNumber, pageSize: pageSizeNumber };
  }

  // 获取销售合同详情（含完整明细、收款计划）
  async findById(id: string) {
    const salesContract = await prisma.salesContract.findUnique({
      where: { id },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { lineNumber: 'asc' },
        },
        collectionPlans: {
          where: { deletedAt: null },
          orderBy: { periodIndex: 'asc' },
        },
      },
    });

    if (!salesContract) throw new Error('销售合同不存在');
    return salesContract;
  }

  // 根据编号获取销售合同
  async findByCode(code: string) {
    const salesContract = await prisma.salesContract.findUnique({
      where: { code },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { lineNumber: 'asc' },
        },
        collectionPlans: {
          where: { deletedAt: null },
          orderBy: { periodIndex: 'asc' },
        },
      },
    });

    if (!salesContract) throw new Error('销售合同不存在');
    return salesContract;
  }

  // 更新销售合同（包含明细）
  async update(
    id: string,
    data: Prisma.SalesContractUpdateInput & {
      items?: Prisma.SalesContractItemCreateWithoutSalesContractInput[];
    },
    userId: string
  ) {
    const salesContract = await prisma.salesContract.findUnique({
      where: { id },
    });
    if (!salesContract) throw new Error('销售合同不存在');

    const { items, ...contractData } = data;

    // 如果有明细更新，先软删除旧明细，再创建新明细
    if (items && items.length > 0) {
      await prisma.salesContractItem.updateMany({
        where: { salesContractId: id },
        data: { deletedAt: new Date() },
      });
    }

    const updated = await prisma.salesContract.update({
      where: { id },
      data: {
        ...contractData,
        updatedBy: userId,
        ...(items && items.length > 0 && {
          items: {
            create: items.map((item, index) => ({
              ...item,
              lineNumber: index + 1,
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        }),
      },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    return updated;
  }

  // 软删除销售合同
  async delete(id: string, userId: string) {
    return prisma.salesContract.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // 审核销售合同
  async approve(id: string, approved: boolean, userId: string) {
    const salesContract = await prisma.salesContract.update({
      where: { id },
      data: {
        approvalStatus: approved ? 'APPROVED' : 'REJECTED',
        status: (approved ? 'APPROVED' : 'PENDING') as SalesContractStatus,
        updatedBy: userId,
      },
    });

    return salesContract;
  }

  // 确认销售合同
  async confirm(id: string, userId: string) {
    const salesContract = await prisma.salesContract.update({
      where: { id },
      data: {
        confirmStatus: 'CONFIRMED',
        updatedBy: userId,
      },
    });

    return salesContract;
  }

  // 更新合同状态
  async updateStatus(
    id: string,
    status: string,
    userId: string
  ) {
    const salesContract = await prisma.salesContract.update({
      where: { id },
      data: {
        status: status as SalesContractStatus,
        updatedBy: userId,
      },
    });

    return salesContract;
  }

  // 回签
  async signBack(
    id: string,
    data: {
      signBackDate?: Date;
      signBackDescription?: string;
      signBackAttachments?: any;
    },
    userId: string
  ) {
    const salesContract = await prisma.salesContract.update({
      where: { id },
      data: {
        signBackStatus: 'SIGNED',
        signBackPerson: userId,
        signBackDate: data.signBackDate || new Date(),
        signBackDescription: data.signBackDescription,
        signBackAttachments: data.signBackAttachments,
        updatedBy: userId,
      },
    });

    return salesContract;
  }

  // 打印（增加打印次数）
  async print(id: string, userId: string) {
    const salesContract = await prisma.salesContract.update({
      where: { id },
      data: {
        printStatus: 'PRINTED',
        printCount: { increment: 1 },
        updatedBy: userId,
      },
    });

    return salesContract;
  }

  // 转采购计划
  async toPurchasePlan(id: string, userId: string) {
    const salesContract = await prisma.salesContract.update({
      where: { id },
      data: {
        toPurchasePlan: true,
        toPurchasePlanTime: new Date(),
        updatedBy: userId,
      },
    });

    return salesContract;
  }

  // 添加明细行
  async addItem(
    salesContractId: string,
    data: Prisma.SalesContractItemCreateWithoutSalesContractInput,
    userId: string
  ) {
    // 获取当前最大行号
    const maxLineNumber = await prisma.salesContractItem.aggregate({
      where: { salesContractId, deletedAt: null },
      _max: { lineNumber: true },
    });

    const lineNumber = (maxLineNumber._max.lineNumber || 0) + 1;

    const item = await prisma.salesContractItem.create({
      data: {
        ...data,
        salesContract: { connect: { id: salesContractId } },
        lineNumber,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // 更新合同的汇总信息（可以根据需要计算总金额等）
    await this.recalculateTotals(salesContractId, userId);

    return item;
  }

  // 更新明细行
  async updateItem(
    id: string,
    data: Prisma.SalesContractItemUpdateInput,
    userId: string
  ) {
    const item = await prisma.salesContractItem.findUnique({
      where: { id },
    });

    if (!item) throw new Error('明细行不存在');

    const updated = await prisma.salesContractItem.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });

    // 更新合同的汇总信息
    await this.recalculateTotals(item.salesContractId, userId);

    return updated;
  }

  // 删除明细行
  async deleteItem(id: string, userId: string) {
    const item = await prisma.salesContractItem.findUnique({
      where: { id },
    });

    if (!item) throw new Error('明细行不存在');

    await prisma.salesContractItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    // 更新合同的汇总信息
    await this.recalculateTotals(item.salesContractId, userId);
  }

  // 获取明细列表
  async getItems(salesContractId: string) {
    return prisma.salesContractItem.findMany({
      where: { salesContractId, deletedAt: null },
      orderBy: { lineNumber: 'asc' },
    });
  }

  // 重新计算合同汇总信息
  private async recalculateTotals(salesContractId: string, userId: string) {
    const items = await prisma.salesContractItem.findMany({
      where: { salesContractId, deletedAt: null },
    });

    const totals = items.reduce(
      (acc, item) => {
        acc.totalAmount += Number(item.amount);
        acc.totalQuantity += Number(item.quantity);
        acc.totalBoxes += item.boxes || 0;
        acc.totalGrossWeight += Number(item.grossWeight || 0);
        acc.totalNetWeight += Number(item.netWeight || 0);
        acc.totalVolume += Number(item.volume || 0);
        acc.taxRefundTotal += Number(item.taxRefund || 0);
        return acc;
      },
      {
        totalAmount: 0,
        totalQuantity: 0,
        totalBoxes: 0,
        totalGrossWeight: 0,
        totalNetWeight: 0,
        totalVolume: 0,
        taxRefundTotal: 0,
      }
    );

    await prisma.salesContract.update({
      where: { id: salesContractId },
      data: {
        ...totals,
        updatedBy: userId,
      },
    });
  }

  // 统计数据
  async getStatistics(params: {
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { customerId, startDate, endDate } = params;

    const where: Prisma.SalesContractWhereInput = {
      deletedAt: null,
      ...(customerId && { customerId }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [totalCount, approvedCount, totalAmount, totalProfit] =
      await Promise.all([
        prisma.salesContract.count({ where }),
        prisma.salesContract.count({
          where: { ...where, approvalStatus: 'APPROVED' },
        }),
        prisma.salesContract.aggregate({
          where: { ...where, approvalStatus: 'APPROVED' },
          _sum: { totalAmount: true },
        }),
        prisma.salesContract.aggregate({
          where: { ...where, approvalStatus: 'APPROVED' },
          _sum: { orderGrossProfit: true },
        }),
      ]);

    return {
      totalCount,
      approvedCount,
      totalAmount: totalAmount._sum.totalAmount || 0,
      totalProfit: totalProfit._sum.orderGrossProfit || 0,
    };
  }
}
