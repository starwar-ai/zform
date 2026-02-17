/**
 * SupplierPaymentTermService
 *
 * 供应商付款条件字典管理服务。
 * 软删除通过 deleted 字段：0=有效，1=删除。
 * 支持步骤（steps）：一种付款方式下可有多个步骤。
 */

import prisma from '../config/database';
import type { SupplierPaymentTerm } from '@prisma/client';

export interface SupplierPaymentTermStepInput {
  stepOrder: number;
  ratio?: number | null;
  description?: string | null;
  dateBase?: number | null;
  daysOffset?: number;
}

export interface CreateSupplierPaymentTermInput {
  code: string;
  name: string;
  nameEng?: string | null;
  dateType?: number | null;
  duration?: number | null;
  sortOrder?: number;
  steps?: SupplierPaymentTermStepInput[];
}

export interface UpdateSupplierPaymentTermInput {
  code?: string;
  name?: string;
  nameEng?: string | null;
  dateType?: number | null;
  duration?: number | null;
  sortOrder?: number;
  steps?: SupplierPaymentTermStepInput[];
}

const termInclude = {
  steps: { orderBy: { stepOrder: 'asc' as const } },
};

export class SupplierPaymentTermService {
  /** 获取所有有效供应商付款条件（含步骤） */
  async findAll() {
    return prisma.supplierPaymentTerm.findMany({
      where: { deleted: 0 },
      include: termInclude,
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
  }

  /** 获取单个供应商付款条件（含步骤） */
  async findById(id: string) {
    return prisma.supplierPaymentTerm.findFirst({
      where: { id, deleted: 0 },
      include: termInclude,
    });
  }

  /** 创建供应商付款条件 */
  async create(data: CreateSupplierPaymentTermInput, userId?: string): Promise<SupplierPaymentTerm> {
    const existing = await prisma.supplierPaymentTerm.findFirst({
      where: { code: data.code, deleted: 0 },
    });
    if (existing) {
      throw new Error(`供应商付款条件编码 "${data.code}" 已存在`);
    }

    return prisma.supplierPaymentTerm.create({
      data: {
        code: data.code,
        name: data.name,
        nameEng: data.nameEng ?? null,
        dateType: data.dateType ?? null,
        duration: data.duration ?? null,
        sortOrder: data.sortOrder ?? 0,
        createdBy: userId || null,
        updatedBy: userId || null,
        steps: data.steps?.length
          ? {
              create: data.steps.map((s) => ({
                stepOrder: s.stepOrder,
                ratio: s.ratio ?? null,
                description: s.description ?? null,
                dateBase: s.dateBase ?? null,
                daysOffset: s.daysOffset ?? 0,
              })),
            }
          : undefined,
      },
      include: termInclude,
    });
  }

  /** 更新供应商付款条件 */
  async update(id: string, data: UpdateSupplierPaymentTermInput, userId?: string) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('供应商付款条件不存在');
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.supplierPaymentTerm.findFirst({
        where: { code: data.code, deleted: 0, id: { not: id } },
      });
      if (duplicate) {
        throw new Error(`供应商付款条件编码 "${data.code}" 已存在`);
      }
    }

    // 若传入 steps，先删后建
    if (data.steps !== undefined) {
      await prisma.supplierPaymentTermStep.deleteMany({ where: { supplierPaymentTermId: id } });
    }

    return prisma.supplierPaymentTerm.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameEng !== undefined && { nameEng: data.nameEng }),
        ...(data.dateType !== undefined && { dateType: data.dateType }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        updatedBy: userId || undefined,
        ...(data.steps?.length
          ? {
              steps: {
                create: data.steps.map((s) => ({
                  stepOrder: s.stepOrder,
                  ratio: s.ratio ?? null,
                  description: s.description ?? null,
                  dateBase: s.dateBase ?? null,
                  daysOffset: s.daysOffset ?? 0,
                })),
              },
            }
          : {}),
      },
      include: termInclude,
    });
  }

  /** 软删除供应商付款条件（设置 deleted=1） */
  async delete(id: string): Promise<void> {
    await prisma.supplierPaymentTerm.update({
      where: { id },
      data: { deleted: 1 },
    });
  }

  /** 批量更新排序 */
  async reorder(items: { id: string; sortOrder: number }[], userId?: string): Promise<void> {
    for (const item of items) {
      await prisma.supplierPaymentTerm.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder, updatedBy: userId || undefined },
      });
    }
  }
}
