import prisma from '../config/database';
import { Prisma, ProductType, ProductStatus } from '@prisma/client';

export class ProductService {
  // 创建产品
  async create(data: Prisma.ProductCreateInput, userId: string) {
    const product = await prisma.product.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        category: true,
        brand: true,
        baseProduct: true,
      },
    });

    // 记录变更日志
    await this.logChange(product.id, 'CREATE', null, userId);

    return product;
  }

  // 分页查询
  async findMany(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    productType?: ProductType;
    status?: ProductStatus;
    categoryId?: string;
    brandId?: string;
  }) {
    const {
      page = 1,
      pageSize = 20,
      search,
      productType,
      status,
      categoryId,
      brandId,
    } = params;

    const pageNumber = Number(page) || 1;
    const pageSizeNumber = Number(pageSize) || 20;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(productType && { productType }),
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (pageNumber - 1) * pageSizeNumber,
        take: pageSizeNumber,
        include: {
          category: true,
          brand: true,
          baseProduct: { select: { id: true, code: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page: pageNumber, pageSize: pageSizeNumber };
  }

  // 获取产品详情（含 BOM 和辅料）
  async findById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        department: true,
        hsCode: true,
        packageMethod: true,
        baseProduct: true,
        derivedProducts: true,
        bomItems: {
          include: {
            childProduct: { select: { id: true, code: true, name: true, unit: true } },
          },
        },
        accessories: {
          include: {
            accessory: { select: { id: true, code: true, name: true, unit: true } },
          },
        },
      },
    });

    if (!product) throw new Error('产品不存在');
    return product;
  }

  // 更新产品
  async update(id: string, data: Prisma.ProductUpdateInput, userId: string) {
    const oldProduct = await prisma.product.findUnique({ where: { id } });
    if (!oldProduct) throw new Error('产品不存在');

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
        version: { increment: 1 },
      },
      include: {
        category: true,
        brand: true,
      },
    });

    // 记录变更
    await this.logChange(id, 'UPDATE', oldProduct, userId);

    return updated;
  }

  // 软删除
  async delete(id: string, userId: string) {
    return prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // 添加 BOM 项
  async addBomItem(parentId: string, childId: string, quantity: number, userId: string) {
    return prisma.productBom.create({
      data: {
        parentProductId: parentId,
        childProductId: childId,
        quantity,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  // 添加辅料
  async addAccessory(
    productId: string,
    accessoryId: string,
    ratios: { productRatio?: number; accessoryRatio?: number },
    userId: string
  ) {
    return prisma.productAccessory.create({
      data: {
        productId,
        accessoryId,
        ...ratios,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  // 获取变更历史
  async getChangeLogs(productId: string) {
    return prisma.productChangeLog.findMany({
      where: { productId },
      orderBy: { changedAt: 'desc' },
    });
  }

  // 记录变更日志
  private async logChange(
    productId: string,
    changeType: string,
    oldProduct: any,
    userId: string
  ) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return;

    return prisma.productChangeLog.create({
      data: {
        productId,
        version: product.version,
        changeType,
        changedBy: userId,
      },
    });
  }
}
