import prisma from '../config/database';
import { Prisma, SupplierType, SupplierLevel, SupplierStage, ApprovalStatus } from '@prisma/client';

export class SupplierService {
  // 创建供应商
  async create(data: Prisma.SupplierCreateInput, userId: string) {
    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        bankAccounts: true,
      },
    });

    return supplier;
  }

  // 分页查询供应商
  async findMany(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    supplierType?: SupplierType;
    stage?: SupplierStage;
    supplierLevel?: SupplierLevel;
    approvalStatus?: ApprovalStatus;
    isEnabled?: boolean;
  }) {
    const {
      page = 1,
      pageSize = 20,
      search,
      supplierType,
      stage,
      supplierLevel,
      approvalStatus,
      isEnabled,
    } = params;

    const pageNumber = Number(page) || 1;
    const pageSizeNumber = Number(pageSize) || 20;

    const where: Prisma.SupplierWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { shortName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(supplierType && { supplierType }),
      ...(stage && { stage }),
      ...(supplierLevel && { supplierLevel }),
      ...(approvalStatus && { approvalStatus }),
      ...(isEnabled !== undefined && { isEnabled }),
    };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (pageNumber - 1) * pageSizeNumber,
        take: pageSizeNumber,
        include: {
          bankAccounts: {
            where: { isDefault: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, total, page: pageNumber, pageSize: pageSizeNumber };
  }

  // 获取供应商详情（含银行账户和报价）
  async findById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        bankAccounts: {
          where: { deletedAt: null },
          orderBy: { isDefault: 'desc' },
        },
        quotations: {
          where: { deletedAt: null },
          orderBy: { quotationDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) throw new Error('供应商不存在');
    return supplier;
  }

  // 更新供应商
  async update(id: string, data: Prisma.SupplierUpdateInput, userId: string) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new Error('供应商不存在');

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: {
        bankAccounts: true,
      },
    });

    return updated;
  }

  // 软删除供应商
  async delete(id: string, userId: string) {
    return prisma.supplier.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // 审核供应商
  async approve(id: string, approved: boolean, userId: string) {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        approvalStatus: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        updatedBy: userId,
      },
    });

    return supplier;
  }

  // 转正供应商
  async makeFormal(id: string, userId: string) {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        stage: SupplierStage.FORMAL,
        isFormal: true,
        formalTime: new Date(),
        updatedBy: userId,
      },
    });

    return supplier;
  }

  // 添加银行账户
  async addBankAccount(
    supplierId: string,
    data: Omit<Prisma.SupplierBankAccountCreateInput, 'supplier'>,
    userId: string
  ) {
    // 如果设置为默认账户，先取消其他默认账户
    if (data.isDefault) {
      await prisma.supplierBankAccount.updateMany({
        where: { supplierId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const bankAccount = await prisma.supplierBankAccount.create({
      data: {
        ...data,
        supplier: { connect: { id: supplierId } },
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return bankAccount;
  }

  // 更新银行账户
  async updateBankAccount(
    id: string,
    data: Prisma.SupplierBankAccountUpdateInput,
    userId: string
  ) {
    const bankAccount = await prisma.supplierBankAccount.findUnique({
      where: { id },
    });

    if (!bankAccount) throw new Error('银行账户不存在');

    // 如果设置为默认账户，先取消其他默认账户
    if (data.isDefault === true) {
      await prisma.supplierBankAccount.updateMany({
        where: { supplierId: bankAccount.supplierId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.supplierBankAccount.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });

    return updated;
  }

  // 删除银行账户
  async deleteBankAccount(id: string, userId: string) {
    return prisma.supplierBankAccount.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // 获取供应商的银行账户列表
  async getBankAccounts(supplierId: string) {
    return prisma.supplierBankAccount.findMany({
      where: { supplierId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
