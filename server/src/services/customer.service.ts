import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class CustomerService {
  // 创建客户
  async create(data: Prisma.CustomerCreateInput, userId: string) {
    const customer = await prisma.customer.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        bankAccounts: true,
        contacts: true,
      },
    });

    return customer;
  }

  // 分页查询客户
  async findMany(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    stage?: string;
    approvalStatus?: string;
    isEnabled?: boolean;
    isAgent?: boolean;
    isForeign?: boolean;
  }) {
    const {
      page = 1,
      pageSize = 20,
      search,
      stage,
      approvalStatus,
      isEnabled,
      isAgent,
      isForeign,
    } = params;

    const pageNumber = Number(page) || 1;
    const pageSizeNumber = Number(pageSize) || 20;

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { shortName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(stage && { stage }),
      ...(approvalStatus && { approvalStatus }),
      ...(isEnabled !== undefined && { isEnabled }),
      ...(isAgent !== undefined && { isAgent }),
      ...(isForeign !== undefined && { isForeign }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (pageNumber - 1) * pageSizeNumber,
        take: pageSizeNumber,
        include: {
          bankAccounts: {
            where: { isDefault: true },
            take: 1,
          },
          contacts: {
            where: { isDefault: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, total, page: pageNumber, pageSize: pageSizeNumber };
  }

  // 获取客户详情（含银行账户和联系人）
  async findById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        bankAccounts: {
          where: { deletedAt: null },
          orderBy: { isDefault: 'desc' },
        },
        contacts: {
          where: { deletedAt: null },
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    if (!customer) throw new Error('客户不存在');
    return customer;
  }

  // 更新客户
  async update(id: string, data: Prisma.CustomerUpdateInput, userId: string) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new Error('客户不存在');

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
        version: { increment: 1 },
      },
      include: {
        bankAccounts: true,
        contacts: true,
      },
    });

    return updated;
  }

  // 软删除客户
  async delete(id: string, userId: string) {
    return prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // 审核客户
  async approve(id: string, approved: boolean, userId: string) {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        approvalStatus: approved ? 'APPROVED' : 'REJECTED',
        updatedBy: userId,
      },
    });

    return customer;
  }

  // 转正客户
  async makeFormal(id: string, userId: string) {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        stage: 'FORMAL',
        isFormal: true,
        formalTime: new Date(),
        updatedBy: userId,
      },
    });

    return customer;
  }

  // 添加银行账户
  async addBankAccount(
    customerId: string,
    data: Omit<Prisma.CustomerBankAccountCreateInput, 'customer'>,
    userId: string
  ) {
    // 如果设置为默认账户，先取消其他默认账户
    if (data.isDefault) {
      await prisma.customerBankAccount.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const bankAccount = await prisma.customerBankAccount.create({
      data: {
        ...data,
        customer: { connect: { id: customerId } },
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return bankAccount;
  }

  // 更新银行账户
  async updateBankAccount(
    id: string,
    data: Prisma.CustomerBankAccountUpdateInput,
    userId: string
  ) {
    const bankAccount = await prisma.customerBankAccount.findUnique({
      where: { id },
    });

    if (!bankAccount) throw new Error('银行账户不存在');

    // 如果设置为默认账户，先取消其他默认账户
    if (data.isDefault === true) {
      await prisma.customerBankAccount.updateMany({
        where: { customerId: bankAccount.customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.customerBankAccount.update({
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
    return prisma.customerBankAccount.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // 获取客户的银行账户列表
  async getBankAccounts(customerId: string) {
    return prisma.customerBankAccount.findMany({
      where: { customerId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // 添加联系人
  async addContact(
    customerId: string,
    data: Omit<Prisma.CustomerContactCreateInput, 'customer'>,
    userId: string
  ) {
    // 如果设置为默认联系人，先取消其他默认联系人
    if (data.isDefault) {
      await prisma.customerContact.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const contact = await prisma.customerContact.create({
      data: {
        ...data,
        customer: { connect: { id: customerId } },
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return contact;
  }

  // 更新联系人
  async updateContact(
    id: string,
    data: Prisma.CustomerContactUpdateInput,
    userId: string
  ) {
    const contact = await prisma.customerContact.findUnique({
      where: { id },
    });

    if (!contact) throw new Error('联系人不存在');

    // 如果设置为默认联系人，先取消其他默认联系人
    if (data.isDefault === true) {
      await prisma.customerContact.updateMany({
        where: { customerId: contact.customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.customerContact.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });

    return updated;
  }

  // 删除联系人
  async deleteContact(id: string, userId: string) {
    return prisma.customerContact.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // 获取客户的联系人列表
  async getContacts(customerId: string) {
    return prisma.customerContact.findMany({
      where: { customerId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
