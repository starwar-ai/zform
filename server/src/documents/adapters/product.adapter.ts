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
      
      // 验证子产品存在
      const childProduct = await prisma.product.findUnique({
        where: { id: childProductId },
      });
      if (!childProduct) {
        throw new Error('子产品不存在');
      }
      
      const bom = await prisma.productBom.create({
        data: {
          parentProductId: id,
          childProductId,
          quantity,
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          childProduct: {
            select: { id: true, code: true, name: true, unit: true },
          },
        },
      });
      return { data: bom, message: 'BOM 添加成功' };
    },

    /** 删除 BOM */
    async deleteBom({ id, body, userId, prisma }) {
      const { bomId } = body;
      await prisma.productBom.delete({
        where: { id: bomId },
      });
      return { data: null, message: 'BOM 删除成功' };
    },

    /** 添加辅料 */
    async addAccessory({ id, body, userId, prisma }) {
      const { accessoryId, productRatio, accessoryRatio, description } = body;
      
      // 验证辅料存在
      const accessory = await prisma.product.findUnique({
        where: { id: accessoryId },
      });
      if (!accessory) {
        throw new Error('辅料不存在');
      }
      
      const accessoryItem = await prisma.productAccessory.create({
        data: {
          productId: id,
          accessoryId,
          productRatio,
          accessoryRatio,
          description,
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          accessory: {
            select: { id: true, code: true, name: true, unit: true },
          },
        },
      });
      return { data: accessoryItem, message: '辅料添加成功' };
    },

    /** 删除辅料 */
    async deleteAccessory({ id, body, userId, prisma }) {
      const { accessoryId } = body;
      await prisma.productAccessory.delete({
        where: { id: accessoryId },
      });
      return { data: null, message: '辅料删除成功' };
    },

    /** 设置价格 */
    async setPrice({ id, body, userId, prisma }) {
      const { salePrice, companyPrice } = body;
      const product = await prisma.product.update({
        where: { id },
        data: {
          salePrice,
          companyPrice,
          updatedBy: userId,
        },
      });
      return { data: product, message: '价格设置成功' };
    },

    /** 设置为优势产品 */
    async setAdvantage({ id, body, userId, prisma }) {
      const { isAdvantage } = body;
      const product = await prisma.product.update({
        where: { id },
        data: {
          isAdvantage,
          updatedBy: userId,
        },
      });
      return { data: product, message: isAdvantage ? '已设为优势产品' : '已取消优势产品' };
    },

    /** 获取变更记录 */
    async getChangeLogs({ id, prisma }) {
      const logs = await prisma.productChangeLog.findMany({
        where: { productId: id },
        orderBy: { changedAt: 'desc' },
        take: 50, // 最多返回 50 条
      });
      return { data: logs, message: 'Success' };
    },

    /** 批量导入产品 */
    async batchImport({ body, userId, prisma }) {
      const { products } = body;
      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('产品数据不能为空');
      }

      const created = [];
      const errors = [];

      for (let i = 0; i < products.length; i++) {
        const productData = products[i];
        try {
          // 检查产品编码是否重复
          const existing = await prisma.product.findUnique({
            where: { code: productData.code },
          });
          if (existing) {
            errors.push({ row: i + 1, error: `产品编码 ${productData.code} 已存在` });
            continue;
          }

          const product = await prisma.product.create({
            data: {
              ...productData,
              productType: 'STANDARD',
              createdBy: userId,
              updatedBy: userId,
            },
          });

          created.push(product);
        } catch (error: any) {
          errors.push({ row: i + 1, error: error.message });
        }
      }

      return {
        data: { created: created.length, errors },
        message: `成功导入 ${created.length} 个产品${errors.length > 0 ? `，${errors.length} 个失败` : ''}`,
      };
    },

    /** 复制产品 */
    async copyProduct({ id, body, userId, prisma }) {
      const { newCode } = body;
      
      // 检查新编码是否重复
      const existing = await prisma.product.findUnique({
        where: { code: newCode },
      });
      if (existing) {
        throw new Error('产品编码已存在');
      }

      const original = await prisma.product.findUnique({
        where: { id },
        include: {
          bomItems: true,
          accessories: true,
        },
      });
      if (!original) {
        throw new Error('原产品不存在');
      }

      // 复制产品
      const { id: _id, code: _code, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = original;
      const newProduct = await prisma.product.create({
        data: {
          ...data,
          code: newCode,
          status: 'DRAFT', // 复制的产品默认为草稿状态
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 复制 BOM
      if (original.bomItems.length > 0) {
        await prisma.productBom.createMany({
          data: original.bomItems.map((bom: any) => ({
            parentProductId: newProduct.id,
            childProductId: bom.childProductId,
            quantity: bom.quantity,
            createdBy: userId,
            updatedBy: userId,
          })),
        });
      }

      // 复制辅料
      if (original.accessories.length > 0) {
        await prisma.productAccessory.createMany({
          data: original.accessories.map((acc: any) => ({
            productId: newProduct.id,
            accessoryId: acc.accessoryId,
            productRatio: acc.productRatio,
            accessoryRatio: acc.accessoryRatio,
            description: acc.description,
            createdBy: userId,
            updatedBy: userId,
          })),
        });
      }

      return { data: newProduct, message: '产品复制成功' };
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
