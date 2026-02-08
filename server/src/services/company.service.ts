/**
 * CompanyService
 *
 * 子公司管理服务，支持银行账号关联。
 */

import prisma from '../config/database';
import type { Company, CompanyBankAccount, CompanyNature } from '@prisma/client';

export interface CreateCompanyInput {
  taxNumber?: string | null;
  customsCode?: string | null;
  officialSealImage?: string | null;
  abbreviation?: string | null;
  isEnabled?: boolean;
  legalPerson?: string | null;
  fax?: string | null;
  phone?: string | null;
  adminEmail?: string | null;
  adminMobile?: string | null;
  adminName?: string | null;
  address?: string | null;
  addressEn?: string | null;
  businessLicenseNumber?: string | null;
  businessLicenseImage?: string | null;
  nameEn?: string | null;
  name: string;
  nature?: CompanyNature;
  unitAbbreviation?: string | null;
}

export interface UpdateCompanyInput {
  taxNumber?: string | null;
  customsCode?: string | null;
  officialSealImage?: string | null;
  abbreviation?: string | null;
  isEnabled?: boolean;
  legalPerson?: string | null;
  fax?: string | null;
  phone?: string | null;
  adminEmail?: string | null;
  adminMobile?: string | null;
  adminName?: string | null;
  address?: string | null;
  addressEn?: string | null;
  businessLicenseNumber?: string | null;
  businessLicenseImage?: string | null;
  nameEn?: string | null;
  name?: string;
  nature?: CompanyNature;
  unitAbbreviation?: string | null;
}

export interface CompanyWithBankAccounts extends Company {
  bankAccounts: CompanyBankAccount[];
}

export class CompanyService {
  /** 获取所有子公司 */
  async findAll(): Promise<Company[]> {
    return prisma.company.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  /** 获取子公司（含银行账号） */
  async findById(id: string): Promise<CompanyWithBankAccounts | null> {
    return prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        bankAccounts: {
          where: { deletedAt: null },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });
  }

  /** 创建子公司 */
  async create(data: CreateCompanyInput, userId?: string): Promise<Company> {
    return prisma.company.create({
      data: {
        ...data,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新子公司 */
  async update(id: string, data: UpdateCompanyInput, userId?: string): Promise<Company> {
    return prisma.company.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || undefined,
      },
    });
  }

  /** 软删除子公司 */
  async delete(id: string): Promise<void> {
    // 检查是否有银行账号
    const bankAccountCount = await prisma.companyBankAccount.count({
      where: { companyId: id, deletedAt: null },
    });
    if (bankAccountCount > 0) {
      throw new Error(`该子公司下还有 ${bankAccountCount} 个银行账号，无法删除`);
    }

    await prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== 银行账号管理 ====================

  /** 创建银行账号 */
  async createBankAccount(
    companyId: string,
    data: Omit<CompanyBankAccount, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt'>,
    userId?: string
  ): Promise<CompanyBankAccount> {
    // 如果设为默认账户，取消其他默认账户
    if (data.isDefault) {
      await prisma.companyBankAccount.updateMany({
        where: { companyId, deletedAt: null, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.companyBankAccount.create({
      data: {
        ...data,
        companyId,
        createdBy: userId || null,
        updatedBy: userId || null,
      },
    });
  }

  /** 更新银行账号 */
  async updateBankAccount(
    id: string,
    data: Partial<Omit<CompanyBankAccount, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'deletedAt'>>,
    userId?: string
  ): Promise<CompanyBankAccount> {
    const bankAccount = await prisma.companyBankAccount.findUnique({
      where: { id },
      select: { companyId: true },
    });

    if (!bankAccount) {
      throw new Error('银行账号不存在');
    }

    // 如果设为默认账户，取消其他默认账户
    if (data.isDefault) {
      await prisma.companyBankAccount.updateMany({
        where: { companyId: bankAccount.companyId, deletedAt: null, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return prisma.companyBankAccount.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || undefined,
      },
    });
  }

  /** 删除银行账号 */
  async deleteBankAccount(id: string): Promise<void> {
    await prisma.companyBankAccount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
