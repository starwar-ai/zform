/**
 * PaymentTermService
 *
 * 客户付款方式（收款方式）字典管理服务。
 * 软删除通过 deleted 字段：0=有效，1=删除。
 */

import prisma from '../config/database';
import type { PaymentTerm } from '@prisma/client';

export interface CreatePaymentTermInput {
  code: string;
  name: string;
  nameEng: string;
  dateType?: number;
  duration?: number;
}

export interface UpdatePaymentTermInput {
  code?: string;
  name?: string;
  nameEng?: string;
  dateType?: number;
  duration?: number;
}

export class PaymentTermService {
  /** 获取所有有效付款方式 */
  async findAll(): Promise<PaymentTerm[]> {
    return prisma.paymentTerm.findMany({
      where: { deleted: 0 },
      orderBy: { code: 'asc' },
    });
  }

  /** 获取单个付款方式 */
  async findById(id: string): Promise<PaymentTerm | null> {
    return prisma.paymentTerm.findFirst({
      where: { id, deleted: 0 },
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
        dateType: data.dateType ?? null,
        duration: data.duration ?? null,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新付款方式 */
  async update(id: string, data: UpdatePaymentTermInput, userId?: string): Promise<PaymentTerm> {
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

    return prisma.paymentTerm.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameEng !== undefined && { nameEng: data.nameEng }),
        ...(data.dateType !== undefined && { dateType: data.dateType }),
        ...(data.duration !== undefined && { duration: data.duration }),
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除付款方式（设置 deleted=1） */
  async delete(id: string): Promise<void> {
    await prisma.paymentTerm.update({
      where: { id },
      data: { deleted: 1 },
    });
  }
}
