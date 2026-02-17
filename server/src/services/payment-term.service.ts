/**
 * PaymentTermService
 *
 * 客户付款方式（收款方式）字典管理服务。
 * 软删除通过 deleted 字段：0=有效，1=删除。
 * 支持步骤（steps）：一种付款方式下可有多个步骤。
 */

import prisma from '../config/database';
import type { PaymentTerm } from '@prisma/client';

export interface PaymentTermStepInput {
  stepOrder: number;
  ratio?: number | null;
  description?: string | null;
  dateBase?: number | null;
  daysOffset?: number;
}

export interface CreatePaymentTermInput {
  code: string;
  name: string;
  nameEng: string;
  sortOrder?: number;
  steps?: PaymentTermStepInput[];
}

export interface UpdatePaymentTermInput {
  code?: string;
  name?: string;
  nameEng?: string;
  sortOrder?: number;
  steps?: PaymentTermStepInput[];
}

const termInclude = {
  steps: { orderBy: { stepOrder: 'asc' as const } },
};

export class PaymentTermService {
  /** 获取所有有效付款方式（含步骤） */
  async findAll() {
    return prisma.paymentTerm.findMany({
      where: { deleted: 0 },
      include: termInclude,
      orderBy: { code: 'asc' },
    });
  }

  /** 获取单个付款方式（含步骤） */
  async findById(id: string) {
    return prisma.paymentTerm.findFirst({
      where: { id, deleted: 0 },
      include: termInclude,
    });
  }

  /** 创建付款方式 */
  async create(data: CreatePaymentTermInput, userId?: string): Promise<PaymentTerm> {
    const existing = await prisma.paymentTerm.findFirst({
      where: { code: data.code, deleted: 0 },
    });
    if (existing) {
      throw new Error(`付款方式编码 "${data.code}" 已存在`);
    }

    return prisma.paymentTerm.create({
      data: {
        code: data.code,
        name: data.name,
        nameEng: data.nameEng,
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

  /** 更新付款方式 */
  async update(id: string, data: UpdatePaymentTermInput, userId?: string) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('付款方式不存在');
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.paymentTerm.findFirst({
        where: { code: data.code, deleted: 0, id: { not: id } },
      });
      if (duplicate) {
        throw new Error(`付款方式编码 "${data.code}" 已存在`);
      }
    }

    if (data.steps !== undefined) {
      await prisma.paymentTermStep.deleteMany({ where: { paymentTermId: id } });
    }

    return prisma.paymentTerm.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameEng !== undefined && { nameEng: data.nameEng }),
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

  /** 软删除付款方式（设置 deleted=1） */
  async delete(id: string): Promise<void> {
    await prisma.paymentTerm.update({
      where: { id },
      data: { deleted: 1 },
    });
  }

  /** 批量更新排序 */
  async reorder(items: { id: string; sortOrder: number }[], userId?: string): Promise<void> {
    const updates = items.map((item) =>
      prisma.paymentTerm.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder, updatedBy: userId || undefined },
      })
    );
    await prisma.$transaction(updates);
  }
}
