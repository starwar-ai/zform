import prisma from '../config/database';
import { Prisma, ApprovalStatus } from '@prisma/client';

export class SupplierQuotationService {
  // 创建报价
  async create(data: Prisma.SupplierQuotationCreateInput, userId: string) {
    const quotation = await prisma.supplierQuotation.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
            supplierType: true,
          },
        },
      },
    });

    return quotation;
  }

  // 分页查询报价
  async findMany(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    supplierId?: string;
    productCode?: string;
    status?: ApprovalStatus;
    isActive?: boolean;
    validDateFrom?: Date;
    validDateTo?: Date;
  }) {
    const {
      page = 1,
      pageSize = 20,
      search,
      supplierId,
      productCode,
      status,
      isActive,
      validDateFrom,
      validDateTo,
    } = params;

    const pageNumber = Number(page) || 1;
    const pageSizeNumber = Number(pageSize) || 20;

    const where: Prisma.SupplierQuotationWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { quotationNo: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
          { productCode: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(supplierId && { supplierId }),
      ...(productCode && { productCode }),
      ...(status && { status }),
      ...(isActive !== undefined && { isActive }),
      ...(validDateFrom && { validFrom: { gte: validDateFrom } }),
      ...(validDateTo && { validTo: { lte: validDateTo } }),
    };

    const [quotations, total] = await Promise.all([
      prisma.supplierQuotation.findMany({
        where,
        skip: (pageNumber - 1) * pageSizeNumber,
        take: pageSizeNumber,
        include: {
          supplier: {
            select: {
              id: true,
              code: true,
              name: true,
              supplierType: true,
            },
          },
        },
        orderBy: { quotationDate: 'desc' },
      }),
      prisma.supplierQuotation.count({ where }),
    ]);

    return { quotations, total, page: pageNumber, pageSize: pageSizeNumber };
  }

  // 获取报价详情
  async findById(id: string) {
    const quotation = await prisma.supplierQuotation.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    });

    if (!quotation) throw new Error('报价不存在');
    return quotation;
  }

  // 根据报价单号查询
  async findByQuotationNo(quotationNo: string) {
    const quotation = await prisma.supplierQuotation.findUnique({
      where: { quotationNo },
      include: {
        supplier: true,
      },
    });

    if (!quotation) throw new Error('报价不存在');
    return quotation;
  }

  // 更新报价
  async update(id: string, data: Prisma.SupplierQuotationUpdateInput, userId: string) {
    const quotation = await prisma.supplierQuotation.findUnique({ where: { id } });
    if (!quotation) throw new Error('报价不存在');

    const updated = await prisma.supplierQuotation.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: {
        supplier: true,
      },
    });

    return updated;
  }

  // 软删除报价
  async delete(id: string, userId: string) {
    return prisma.supplierQuotation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // 审核报价
  async approve(id: string, approved: boolean, userId: string) {
    const quotation = await prisma.supplierQuotation.update({
      where: { id },
      data: {
        status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        updatedBy: userId,
      },
      include: {
        supplier: true,
      },
    });

    return quotation;
  }

  // 激活/停用报价
  async setActive(id: string, isActive: boolean, userId: string) {
    const quotation = await prisma.supplierQuotation.update({
      where: { id },
      data: {
        isActive,
        updatedBy: userId,
      },
    });

    return quotation;
  }

  // 获取供应商的所有报价
  async getBySupplier(supplierId: string) {
    return prisma.supplierQuotation.findMany({
      where: {
        supplierId,
        deletedAt: null,
      },
      orderBy: { quotationDate: 'desc' },
    });
  }

  // 获取有效报价（在有效期内且已审核）
  async getValidQuotations(params: {
    supplierId?: string;
    productCode?: string;
    asOfDate?: Date;
  }) {
    const { supplierId, productCode, asOfDate = new Date() } = params;

    return prisma.supplierQuotation.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        status: ApprovalStatus.APPROVED,
        validFrom: { lte: asOfDate },
        validTo: { gte: asOfDate },
        ...(supplierId && { supplierId }),
        ...(productCode && { productCode }),
      },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
            supplierType: true,
          },
        },
      },
      orderBy: [{ quotationDate: 'desc' }, { unitPrice: 'asc' }],
    });
  }

  // 比价：获取同一产品的所有有效报价
  async compareQuotations(productCode: string, asOfDate?: Date) {
    const quotations = await this.getValidQuotations({
      productCode,
      asOfDate,
    });

    // 按价格排序
    return quotations.sort((a, b) => {
      const priceA = Number(a.unitPrice);
      const priceB = Number(b.unitPrice);
      return priceA - priceB;
    });
  }
}
