/**
 * 产品 Adapter
 *
 * 产品没有传统的“明细行”(items)，但有 BOM 和辅料关联。
 * BOM/辅料通过自定义 actions 操作。
 */

import type { DocumentTypeAdapter } from '../types';
import { transformFromFrontend } from '../data-transform';

/**
 * 检测 BOM 循环依赖
 * 
 * @param prisma - Prisma 客户端
 * @param childId - 要添加的子产品 ID
 * @param parentId - 父产品 ID
 * @returns true 表示存在循环依赖
 */
async function checkCircularDependency(
  prisma: any,
  childId: string,
  parentId: string
): Promise<boolean> {
  // 如果子产品的 BOM 中包含父产品（直接或间接），则存在循环依赖
  const visited = new Set<string>();
  const queue = [childId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    if (currentId === parentId) {
      return true; // 找到循环
    }
    
    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    // 查询当前产品的所有子产品
    const boms = await prisma.productBom.findMany({
      where: { parentProductId: currentId },
      select: { childProductId: true },
    });

    for (const bom of boms) {
      queue.push(bom.childProductId);
    }
  }

  return false;
}

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
    productImages: {
      where: { deletedAt: null },
      orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
    },
  },

  // ---- 默认排序 ----
  defaultOrderBy: { createdAt: 'desc' },

  // ---- 聚合 (产品一般不需要列合计) ----
  aggregateFields: [],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      id: row.id,
      code: row.code,
      status: row.status,
      createdAt: row.createdAt,
      // 产品字段
      name: row.name,
      nameEn: row.nameEn,
      barcode: row.barcode,
      productType: row.productType,
      skuType: row.skuType,
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
    // 使用白名单模式：只保留 Product schema 中定义的字段
    const createData = {
      ...transformFromFrontend(data, { prismaModel: 'Product' }),
      productType: 'STANDARD',
      createdBy: userId,
      updatedBy: userId,
    };

    const product = await prisma.product.create({
      data: createData,
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

    // 使用白名单模式：只保留 Product schema 中定义的字段
    const updateData = {
      ...transformFromFrontend(data, { prismaModel: 'Product' }),
      updatedBy: userId,
      version: { increment: 1 },
    };

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
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
      
      // 防止自我引用
      if (id === childProductId) {
        throw new Error('产品不能包含自己作为子产品');
      }
      
      // 检测循环依赖
      const hasCircularDependency = await checkCircularDependency(
        prisma,
        childProductId,
        id
      );
      if (hasCircularDependency) {
        throw new Error(`添加失败：检测到循环依赖。产品 ${childProduct.code} 直接或间接包含当前产品`);
      }
      
      // 检查是否已存在
      const existing = await prisma.productBom.findFirst({
        where: {
          parentProductId: id,
          childProductId,
        },
      });
      if (existing) {
        throw new Error(`子产品 ${childProduct.code} 已存在于 BOM 清单中`);
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
          // 使用白名单模式转换数据
          const flatData = transformFromFrontend(productData, { prismaModel: 'Product' });
          
          // 检查产品编码是否重复
          const existing = await prisma.product.findUnique({
            where: { code: flatData.code as string },
          });
          if (existing) {
            errors.push({ row: i + 1, error: `产品编码 ${flatData.code} 已存在` });
            continue;
          }

          const product = await prisma.product.create({
            data: {
              ...flatData,
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

    /** 提交审核 */
    async submit({ id, userId, prisma }) {
      const product = await prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        throw new Error('产品不存在');
      }
      if (product.approvalStatus !== 'PENDING') {
        throw new Error('只有待提交状态的产品才能提交审核');
      }

      const updated = await prisma.product.update({
        where: { id },
        data: {
          approvalStatus: 'SUBMITTED',
          status: 'PENDING_APPROVAL',
          updatedBy: userId,
        },
      });

      return { data: updated, message: '产品已提交审核' };
    },

    /** 审核通过 */
    async approve({ id, body, userId, prisma }) {
      const { comment } = body;
      const product = await prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        throw new Error('产品不存在');
      }
      if (product.approvalStatus !== 'SUBMITTED') {
        throw new Error('只有已提交的产品才能审核');
      }

      // 检查是否有活跃的 ProductChange（变更审批场景）
      const activeChange = await prisma.productChange.findFirst({
        where: {
          productId: id,
          changeStatus: 'PENDING',
        },
      });

      if (activeChange) {
        // 变更审批：获取当前产品数据作为 changeData，标记变更为 COMPLETED
        const currentProduct = await prisma.product.findUnique({ where: { id } });
        await prisma.productChange.update({
          where: { id: activeChange.id },
          data: {
            changeData: currentProduct as any,
            changeStatus: 'COMPLETED',
            approvedBy: userId,
            approvedAt: new Date(),
            approvalComment: comment,
            updatedBy: userId,
          },
        });
      }

      const updated = await prisma.product.update({
        where: { id },
        data: {
          approvalStatus: 'APPROVED',
          status: 'ACTIVE',
          updatedBy: userId,
          version: { increment: 1 },
        },
      });

      // 记录审核日志
      await prisma.productChangeLog.create({
        data: {
          productId: id,
          version: updated.version,
          changeType: activeChange ? 'CHANGE_APPROVED' : 'APPROVE',
          changedBy: userId,
          changeDetails: comment ? { comment } : undefined,
        },
      });

      return { data: updated, message: '产品审核通过' };
    },

    /** 审核拒绝 */
    async reject({ id, body, userId, prisma }) {
      const { reason } = body;
      const product = await prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        throw new Error('产品不存在');
      }
      if (product.approvalStatus !== 'SUBMITTED') {
        throw new Error('只有已提交的产品才能审核');
      }

      const updated = await prisma.product.update({
        where: { id },
        data: {
          approvalStatus: 'REJECTED',
          status: 'DRAFT',
          updatedBy: userId,
        },
      });

      // 记录拒绝日志
      await prisma.productChangeLog.create({
        data: {
          productId: id,
          version: product.version,
          changeType: 'REJECT',
          changedBy: userId,
          changeDetails: reason ? { reason } : undefined,
        },
      });

      return { data: updated, message: '产品审核已拒绝' };
    },

    /** 设置上架标识 */
    async setOnshelfFlag({ id, body, userId, prisma }) {
      const { isOnShelf } = body;
      const product = await prisma.product.update({
        where: { id },
        data: {
          isOnShelf: isOnShelf ?? false,
          updatedBy: userId,
        },
      });
      return { data: product, message: isOnShelf ? '产品已上架' : '产品已下架' };
    },

    /** 反审核 */
    async revertAudit({ id, userId, prisma }) {
      const product = await prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        throw new Error('产品不存在');
      }
      if (product.approvalStatus !== 'APPROVED') {
        throw new Error('只有已审核通过的产品才能反审核');
      }

      const updated = await prisma.product.update({
        where: { id },
        data: {
          approvalStatus: 'PENDING',
          status: 'DRAFT',
          updatedBy: userId,
        },
      });

      // 记录反审核日志
      await prisma.productChangeLog.create({
        data: {
          productId: id,
          version: product.version,
          changeType: 'REVERT_AUDIT',
          changedBy: userId,
        },
      });

      return { data: updated, message: '产品已反审核' };
    },

    /** 产品变更申请 */
    async requestChange({ id, body, userId, prisma }) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          brand: true,
          department: true,
          hsCode: true,
          packageMethod: true,
          baseProduct: true,
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
      if (!product) {
        throw new Error('产品不存在');
      }
      if (product.approvalStatus !== 'APPROVED') {
        throw new Error('只有已审核通过的产品才能申请变更');
      }

      const { changeReason } = body;

      // 快照当前产品完整数据为 originalData
      const originalData = { ...product };

      // 创建产品变更记录
      const changeRequest = await prisma.productChange.create({
        data: {
          productId: id,
          originalData: originalData as any,
          changeData: {}, // 审批时填充
          changeReason,
          changeStatus: 'PENDING',
          requestedBy: userId,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 设产品为草稿状态，允许编辑
      const updated = await prisma.product.update({
        where: { id },
        data: {
          approvalStatus: 'PENDING',
          status: 'DRAFT',
          updatedBy: userId,
        },
      });

      // 记录变更日志
      await prisma.productChangeLog.create({
        data: {
          productId: id,
          version: product.version,
          changeType: 'REQUEST_CHANGE',
          changedBy: userId,
          changeDetails: { changeReason, changeId: changeRequest.id },
        },
      });

      return { data: { ...changeRequest, product: updated }, message: '产品变更申请已创建，产品已解锁可编辑' };
    },

    /** 提交产品变更 */
    async submitChange({ id, body, userId, prisma }) {
      const { changeId } = body;
      const changeRequest = await prisma.productChange.findUnique({
        where: { id: changeId },
      });
      if (!changeRequest) {
        throw new Error('变更申请不存在');
      }
      if (changeRequest.changeStatus !== 'PENDING') {
        throw new Error('只有待提交的变更申请才能提交');
      }

      const updated = await prisma.productChange.update({
        where: { id: changeId },
        data: {
          changeStatus: 'SUBMITTED',
          updatedBy: userId,
        },
      });

      return { data: updated, message: '产品变更已提交审核' };
    },

    /** 审核产品变更 - 通过 */
    async approveChange({ id, body, userId, prisma }) {
      const { changeId, comment } = body;
      const changeRequest = await prisma.productChange.findUnique({
        where: { id: changeId },
      });
      if (!changeRequest) {
        throw new Error('变更申请不存在');
      }
      if (changeRequest.changeStatus !== 'SUBMITTED') {
        throw new Error('只有已提交的变更申请才能审核');
      }

      // 应用变更到产品
      const changeData = changeRequest.changeData as any;
      await prisma.product.update({
        where: { id: changeRequest.productId },
        data: {
          ...changeData,
          updatedBy: userId,
          version: { increment: 1 },
        },
      });

      // 更新变更申请状态
      const updated = await prisma.productChange.update({
        where: { id: changeId },
        data: {
          changeStatus: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
          approvalComment: comment,
          updatedBy: userId,
        },
      });

      // 记录变更日志
      await prisma.productChangeLog.create({
        data: {
          productId: changeRequest.productId,
          version: (await prisma.product.findUnique({ where: { id: changeRequest.productId } }))!.version,
          changeType: 'CHANGE_APPROVED',
          changedBy: userId,
          changeDetails: changeData,
        },
      });

      return { data: updated, message: '产品变更已审核通过' };
    },

    /** 审核产品变更 - 拒绝 */
    async rejectChange({ id, body, userId, prisma }) {
      const { changeId, reason } = body;
      const changeRequest = await prisma.productChange.findUnique({
        where: { id: changeId },
      });
      if (!changeRequest) {
        throw new Error('变更申请不存在');
      }
      if (changeRequest.changeStatus !== 'SUBMITTED') {
        throw new Error('只有已提交的变更申请才能审核');
      }

      const updated = await prisma.productChange.update({
        where: { id: changeId },
        data: {
          changeStatus: 'REJECTED',
          approvedBy: userId,
          approvedAt: new Date(),
          approvalComment: reason,
          updatedBy: userId,
        },
      });

      return { data: updated, message: '产品变更已拒绝' };
    },

    /** 获取产品变更列表 */
    async getChangeList({ id, body, prisma }) {
      const { page = 1, pageSize = 20 } = body;
      const skip = (Number(page) - 1) * Number(pageSize);

      const [changes, total] = await Promise.all([
        prisma.productChange.findMany({
          where: { productId: id },
          skip,
          take: Number(pageSize),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.productChange.count({ where: { productId: id } }),
      ]);

      return {
        data: { changes, total, page: Number(page), pageSize: Number(pageSize) },
        message: 'Success',
      };
    },

    /** 获取产品变更详情 */
    async getChangeDetail({ id, body, prisma }) {
      const { changeId } = body;
      const change = await prisma.productChange.findUnique({
        where: { id: changeId },
        include: {
          product: {
            include: {
              category: true,
              brand: true,
            },
          },
        },
      });

      if (!change) {
        throw new Error('变更申请不存在');
      }

      return { data: change, message: 'Success' };
    },

    /** 删除产品变更 */
    async deleteChange({ id, body, userId, prisma }) {
      const { changeId } = body;
      const changeRequest = await prisma.productChange.findUnique({
        where: { id: changeId },
      });
      if (!changeRequest) {
        throw new Error('变更申请不存在');
      }
      if (changeRequest.changeStatus !== 'PENDING') {
        throw new Error('只有待提交的变更申请才能删除');
      }

      await prisma.productChange.delete({
        where: { id: changeId },
      });

      return { data: null, message: '产品变更已删除' };
    },

    /** 获取活跃的变更记录 */
    async getActiveChange({ id, prisma }) {
      const activeChange = await prisma.productChange.findFirst({
        where: {
          productId: id,
          changeStatus: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });

      return { data: activeChange, message: 'Success' };
    },

    /** 取消变更，恢复产品到审批前状态 */
    async cancelChange({ id, userId, prisma }) {
      const activeChange = await prisma.productChange.findFirst({
        where: {
          productId: id,
          changeStatus: 'PENDING',
        },
      });

      if (!activeChange) {
        throw new Error('没有活跃的变更申请');
      }

      const originalData = activeChange.originalData as any;

      // 用 originalData 恢复产品数据
      await prisma.product.update({
        where: { id },
        data: {
          approvalStatus: 'APPROVED',
          status: 'ACTIVE',
          // 恢复关键字段
          name: originalData.name,
          nameEn: originalData.nameEn,
          barcode: originalData.barcode,
          unit: originalData.unit,
          material: originalData.material,
          salePrice: originalData.salePrice,
          companyPrice: originalData.companyPrice,
          skuType: originalData.skuType,
          isAdvantage: originalData.isAdvantage,
          isAgent: originalData.isAgent,
          isOnShelf: originalData.isOnShelf,
          categoryId: originalData.categoryId,
          brandId: originalData.brandId,
          departmentId: originalData.departmentId,
          hsCodeId: originalData.hsCodeId,
          packageMethodId: originalData.packageMethodId,
          baseProductId: originalData.baseProductId,
          remark: originalData.remark,
          updatedBy: userId,
        },
      });

      // 标记变更为 CANCELLED
      await prisma.productChange.update({
        where: { id: activeChange.id },
        data: {
          changeStatus: 'CANCELLED',
          updatedBy: userId,
        },
      });

      // 记录变更日志
      await prisma.productChangeLog.create({
        data: {
          productId: id,
          version: originalData.version,
          changeType: 'CANCEL_CHANGE',
          changedBy: userId,
        },
      });

      // 返回恢复后的产品
      const restored = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          brand: true,
        },
      });

      return { data: restored, message: '变更已取消，产品已恢复到变更前状态' };
    },
  },
};

/**
 * 从基础产品继承 skuType 和 isAgent
 * 当客户产品/自营产品关联了基础标准产品时，自动继承分类属性
 */
async function inheritSkuTypeFromBase(data: any, prisma: any) {
  if (!data.baseProductId) return data;
  
  const baseProduct = await prisma.product.findUnique({
    where: { id: data.baseProductId },
    select: { skuType: true, isAgent: true },
  });
  if (!baseProduct) return data;

  return {
    ...data,
    skuType: data.skuType ?? baseProduct.skuType,
    isAgent: data.isAgent ?? baseProduct.isAgent,
  };
}

/** 客户产品 */
export const customerProductAdapter: DocumentTypeAdapter = {
  ...standardProductAdapter,
  typeId: 'customer_product',
  typeName: '客户产品',
  baseWhere: { productType: 'CUSTOMER' },

  async onCreate(data, userId, prisma) {
    // 使用白名单模式转换数据
    const flatData = transformFromFrontend(data, { prismaModel: 'Product' });
    
    // 从基础产品继承 skuType/isAgent
    const createData = await inheritSkuTypeFromBase(flatData, prisma);
    
    const product = await prisma.product.create({
      data: {
        ...createData,
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
    // 使用通用工具转换前端数据结构
    const flatData = transformFromFrontend(data);
    
    // 从基础产品继承 skuType/isAgent
    const createData = await inheritSkuTypeFromBase(flatData, prisma);
    
    const product = await prisma.product.create({
      data: {
        ...createData,
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
