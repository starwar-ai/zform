/**
 * 产品 Adapter
 *
 * 产品没有传统的"明细行"(items)，但有 BOM 和辅料关联。
 * BOM/辅料通过自定义 actions 操作。
 */

import type { DocumentTypeAdapter } from '../types';

/** 标准产品 */
export const standardProductAdapter: DocumentTypeAdapter = {
  typeId: 'standard_product',
  typeName: '标准产品',

  // ---- Prisma 映射 ----
  prismaModel: 'product',
  // 产品没有 items 明细表（BOM 通过 actions 处理）

  // ---- 搜索 ----
  searchFields: ['code', 'name', 'barcode'],

  // ---- 固定 where (只查标准产品) ----
  baseWhere: { productType: 'STANDARD' },

  // ---- Includes ----
  listIncludes: {
    category: true,
    brand: true,
    baseProduct: { select: { id: true, code: true, name: true } },
  },
  detailIncludes: {
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

  // ---- 默认排序 ----
  defaultOrderBy: { createdAt: 'desc' },

  // ---- 字段映射 ----
  columnToPrismaField: {
    _docNumber: 'code',
    _status: 'status',
    _createdAt: 'createdAt',
    productType: 'productType',
    categoryId: 'categoryId',
    brandId: 'brandId',
    approvalStatus: 'approvalStatus',
  },

  // ---- 聚合 (产品一般不需要列合计) ----
  aggregateFields: [],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.status,
      _createdAt: row.createdAt,
      // 产品字段
      name: row.name,
      nameEn: row.nameEn,
      barcode: row.barcode,
      productType: row.productType,
      unit: row.unit,
      material: row.material,
      salePrice: row.salePrice ? Number(row.salePrice) : null,
      companyPrice: row.companyPrice ? Number(row.companyPrice) : null,
      approvalStatus: row.approvalStatus,
      categoryName: row.category?.name,
      brandName: row.brand?.name,
      remark: row.remark,
    };
  },

  // ---- 自定义创建 (带变更日志) ----
  async onCreate(data, userId, prisma) {
    const product = await prisma.product.create({
      data: {
        ...data,
        productType: 'STANDARD',
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
    await prisma.productChangeLog.create({
      data: {
        productId: product.id,
        version: product.version,
        changeType: 'CREATE',
        changedBy: userId,
      },
    });

    return product;
  },

  // ---- 自定义更新 (带变更日志) ----
  async onUpdate(id, data, userId, prisma) {
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

    await prisma.productChangeLog.create({
      data: {
        productId: id,
        version: updated.version,
        changeType: 'UPDATE',
        changedBy: userId,
      },
    });

    return updated;
  },

  // ---- 自定义 Actions ----
  actions: {
    /** 添加 BOM */
    async addBom({ id, body, userId, prisma }) {
      const { childProductId, quantity } = body;
      const bom = await prisma.productBom.create({
        data: {
          parentProductId: id,
          childProductId,
          quantity,
          createdBy: userId,
          updatedBy: userId,
        },
      });
      return { data: bom, message: 'BOM 添加成功' };
    },

    /** 添加辅料 */
    async addAccessory({ id, body, userId, prisma }) {
      const { accessoryId, productRatio, accessoryRatio } = body;
      const accessory = await prisma.productAccessory.create({
        data: {
          productId: id,
          accessoryId,
          productRatio,
          accessoryRatio,
          createdBy: userId,
          updatedBy: userId,
        },
      });
      return { data: accessory, message: '辅料添加成功' };
    },

    /** 获取变更记录 */
    async getChangeLogs({ id, prisma }) {
      const logs = await prisma.productChangeLog.findMany({
        where: { productId: id },
        orderBy: { changedAt: 'desc' },
      });
      return { data: logs, message: 'Success' };
    },
  },
};

/** 客户产品 */
export const customerProductAdapter: DocumentTypeAdapter = {
  ...standardProductAdapter,
  typeId: 'customer_product',
  typeName: '客户产品',
  baseWhere: { productType: 'CUSTOMER' },

  async onCreate(data, userId, prisma) {
    const product = await prisma.product.create({
      data: {
        ...data,
        productType: 'CUSTOMER',
        createdBy: userId,
        updatedBy: userId,
      },
      include: { category: true, brand: true, baseProduct: true },
    });

    await prisma.productChangeLog.create({
      data: {
        productId: product.id,
        version: product.version,
        changeType: 'CREATE',
        changedBy: userId,
      },
    });

    return product;
  },
};

/** 自营产品 */
export const selfOwnedProductAdapter: DocumentTypeAdapter = {
  ...standardProductAdapter,
  typeId: 'self_owned_product',
  typeName: '自营产品',
  baseWhere: { productType: 'SELF_OWNED' },

  async onCreate(data, userId, prisma) {
    const product = await prisma.product.create({
      data: {
        ...data,
        productType: 'SELF_OWNED',
        createdBy: userId,
        updatedBy: userId,
      },
      include: { category: true, brand: true, baseProduct: true },
    });

    await prisma.productChangeLog.create({
      data: {
        productId: product.id,
        version: product.version,
        changeType: 'CREATE',
        changedBy: userId,
      },
    });

    return product;
  },
};
