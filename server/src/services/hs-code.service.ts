/**
 * HsCodeService
 *
 * 海关编码管理服务。
 */

import prisma from '../config/database';
import type { HsCode } from '@prisma/client';

export interface CreateHsCodeInput {
  code: string;
  hsCode: string;
  name: string;
  customsUnit: string;
  taxRefundRate: number;
  taxRate?: number | null;
  remark?: string | null;
  fullName?: string | null;
  levyRate?: number | null;
  secondUnit?: string | null;
}

export interface UpdateHsCodeInput {
  code?: string;
  hsCode?: string;
  name?: string;
  customsUnit?: string;
  taxRefundRate?: number;
  taxRate?: number | null;
  remark?: string | null;
  fullName?: string | null;
  levyRate?: number | null;
  secondUnit?: string | null;
}

export class HsCodeService {
  /** 获取所有海关编码（列表） */
  async findAll(): Promise<HsCode[]> {
    return prisma.hsCode.findMany({
      where: { deletedAt: null },
      orderBy: [{ code: 'asc' }],
    });
  }

  /** 获取单个海关编码 */
  async findById(id: string): Promise<HsCode | null> {
    return prisma.hsCode.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** 创建海关编码 */
  async create(data: CreateHsCodeInput, userId?: string): Promise<HsCode> {
    // 检查编码唯一性
    const existing = await prisma.hsCode.findFirst({
      where: { code: data.code, deletedAt: null },
    });
    if (existing) {
      throw new Error(`海关编码编号 "${data.code}" 已存在`);
    }

    return prisma.hsCode.create({
      data: {
        code: data.code,
        hsCode: data.hsCode,
        name: data.name,
        customsUnit: data.customsUnit,
        taxRefundRate: data.taxRefundRate,
        taxRate: data.taxRate ?? null,
        remark: data.remark ?? null,
        fullName: data.fullName ?? null,
        levyRate: data.levyRate ?? null,
        secondUnit: data.secondUnit ?? null,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新海关编码 */
  async update(id: string, data: UpdateHsCodeInput, userId?: string): Promise<HsCode> {
    if (data.code) {
      const existing = await prisma.hsCode.findFirst({
        where: { code: data.code, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new Error(`海关编码编号 "${data.code}" 已存在`);
      }
    }

    return prisma.hsCode.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.hsCode !== undefined && { hsCode: data.hsCode }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.customsUnit !== undefined && { customsUnit: data.customsUnit }),
        ...(data.taxRefundRate !== undefined && { taxRefundRate: data.taxRefundRate }),
        ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
        ...(data.remark !== undefined && { remark: data.remark }),
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.levyRate !== undefined && { levyRate: data.levyRate }),
        ...(data.secondUnit !== undefined && { secondUnit: data.secondUnit }),
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除海关编码 */
  async delete(id: string): Promise<void> {
    // 检查是否有产品关联
    const productCount = await prisma.product.count({
      where: { hsCodeId: id, deletedAt: null },
    });
    if (productCount > 0) {
      throw new Error(`该海关编码下还有 ${productCount} 个产品关联，无法删除`);
    }

    await prisma.hsCode.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
