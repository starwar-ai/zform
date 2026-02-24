/**
 * 供应商 Adapter
 *
 * 三种供应商类型共用 Supplier Prisma 模型，通过 baseWhere 区分。
 * - 生产商 (MANUFACTURER)
 * - 服务商 (SERVICE_PROVIDER)
 * - 物流商 (LOGISTICS)
 */

import type { DocumentTypeAdapter } from '../types';

// ============================================================
// 基础 Adapter (供三种子类型复用)
// ============================================================

const baseSupplierAdapter: Omit<DocumentTypeAdapter, 'typeId' | 'typeName' | 'baseWhere'> = {
  prismaModel: 'supplier',
  prismaItemModel: 'supplierBankAccount',
  parentForeignKey: 'supplierId',
  itemRelationName: 'bankAccounts',

  searchFields: ['code', 'name', 'shortName'],

  listIncludes: {
    bankAccounts: {
      where: { deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      take: 3,
    },
  },
  detailIncludes: {
    bankAccounts: {
      where: { deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    },
    quotations: {
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
  },

  defaultOrderBy: { createdAt: 'desc' },

  columnToPrismaField: {
    _docNumber: 'code',
    _status: 'approvalStatus',
    _createdAt: 'createdAt',
    supplierType: 'supplierType',
    stage: 'stage',
    supplierLevel: 'supplierLevel',
    isEnabled: 'isEnabled',
    isOverseas: 'isOverseas',
  },

  aggregateFields: [],

  flattenRow(row: any) {
    return {
      id: row.id,
      code: row.code,
      status: row.approvalStatus,
      createdAt: row.createdAt,
      name: row.name,
      nameEn: row.nameEn,
      shortName: row.shortName,
      supplierType: row.supplierType,
      stage: row.stage,
      supplierLevel: row.supplierLevel,
      isOverseas: row.isOverseas,
      isEnabled: row.isEnabled,
      companyCity: row.companyCity,
      buyer: row.buyer,
      currency: row.currency,
      taxRate: row.taxRate ? Number(row.taxRate) : null,
      remark: row.remark,
    };
  },

  async onCreate(data, userId, prisma) {
    return prisma.supplier.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        bankAccounts: { where: { deletedAt: null } },
      },
    });
  },

  async onUpdate(id, data, userId, prisma) {
    return prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
        version: { increment: 1 },
      },
      include: {
        bankAccounts: { where: { deletedAt: null } },
      },
    });
  },

  actions: {
    /** 审批通过 */
    async approve({ id, userId, prisma }) {
      const supplier = await prisma.supplier.update({
        where: { id },
        data: { approvalStatus: 'APPROVED', updatedBy: userId },
      });
      return { data: supplier, message: '审批通过' };
    },

    /** 转正 */
    async makeFormal({ id, userId, prisma }) {
      const supplier = await prisma.supplier.update({
        where: { id },
        data: {
          stage: 'FORMAL',
          isFormal: true,
          formalTime: new Date(),
          updatedBy: userId,
        },
      });
      return { data: supplier, message: '转正成功' };
    },
  },
};

// ============================================================
// 三种供应商类型 Adapter
// ============================================================

/** 生产商 */
export const manufacturerAdapter: DocumentTypeAdapter = {
  ...baseSupplierAdapter,
  typeId: 'manufacturer',
  typeName: '生产商',
  baseWhere: { supplierType: 'MANUFACTURER' },

  async onCreate(data, userId, prisma) {
    return prisma.supplier.create({
      data: {
        ...data,
        supplierType: 'MANUFACTURER',
        createdBy: userId,
        updatedBy: userId,
      },
      include: { bankAccounts: { where: { deletedAt: null } } },
    });
  },
} as DocumentTypeAdapter;

/** 服务商 */
export const serviceProviderAdapter: DocumentTypeAdapter = {
  ...baseSupplierAdapter,
  typeId: 'service_provider',
  typeName: '服务商',
  baseWhere: { supplierType: 'SERVICE_PROVIDER' },

  async onCreate(data, userId, prisma) {
    return prisma.supplier.create({
      data: {
        ...data,
        supplierType: 'SERVICE_PROVIDER',
        createdBy: userId,
        updatedBy: userId,
      },
      include: { bankAccounts: { where: { deletedAt: null } } },
    });
  },
} as DocumentTypeAdapter;

/** 物流商 */
export const logisticsAdapter: DocumentTypeAdapter = {
  ...baseSupplierAdapter,
  typeId: 'logistics',
  typeName: '物流商',
  baseWhere: { supplierType: 'LOGISTICS' },

  async onCreate(data, userId, prisma) {
    return prisma.supplier.create({
      data: {
        ...data,
        supplierType: 'LOGISTICS',
        createdBy: userId,
        updatedBy: userId,
      },
      include: { bankAccounts: { where: { deletedAt: null } } },
    });
  },
} as DocumentTypeAdapter;
