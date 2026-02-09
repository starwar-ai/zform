/**
 * 业务实体管理模块类型定义
 */

// ==================== 通用类型 ====================

export type ConfigTypeKey = 'company' | 'region' | 'country' | 'port' | 'brand';

// ==================== 公司性质枚举 ====================

export enum CompanyNature {
  FACTORY = 'FACTORY',
  EXPORT_COMPANY = 'EXPORT_COMPANY',
  DOMESTIC_COMPANY = 'DOMESTIC_COMPANY',
  INTERNAL_CUSTOMER = 'INTERNAL_CUSTOMER',
}

export const CompanyNatureLabels: Record<CompanyNature, string> = {
  [CompanyNature.FACTORY]: '工厂',
  [CompanyNature.EXPORT_COMPANY]: '外销公司',
  [CompanyNature.DOMESTIC_COMPANY]: '内销公司',
  [CompanyNature.INTERNAL_CUSTOMER]: '内部客户',
};

// ==================== 港口状态枚举 ====================

export enum PortStatus {
  NORMAL = 'NORMAL',
  SUSPENDED = 'SUSPENDED',
}

export const PortStatusLabels: Record<PortStatus, string> = {
  [PortStatus.NORMAL]: '正常',
  [PortStatus.SUSPENDED]: '停运',
};

// ==================== 品牌类型枚举 ====================

export enum BrandType {
  CUSTOMER = 'CUSTOMER',
  COMPANY = 'COMPANY',
}

export const BrandTypeLabels: Record<BrandType, string> = {
  [BrandType.CUSTOMER]: '客户品牌',
  [BrandType.COMPANY]: '公司品牌',
};

// ==================== 子公司相关 ====================

export interface Company {
  id: string;
  taxNumber?: string | null;
  customsCode?: string | null;
  officialSealImage?: string | null;
  abbreviation?: string | null;
  isEnabled: boolean;
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
  nature: CompanyNature;
  unitAbbreviation?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  deletedAt?: string | null;
  bankAccounts?: CompanyBankAccount[];
}

export interface CompanyBankAccount {
  id: string;
  companyId: string;
  bankAddress?: string | null;
  companyNameCn?: string | null;
  companyNameEn?: string | null;
  bankNameCn?: string | null;
  bankNameEn?: string | null;
  bankAddressEn?: string | null;
  accountNumber?: string | null;
  swiftCode?: string | null;
  isDefault: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  deletedAt?: string | null;
}

// ==================== 国家相关 ====================

export interface Region {
  id: string;
  name: string;
  code: string;
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  deletedAt?: string | null;
}

// ==================== 国家相关 ====================

export interface Country {
  id: string;
  name: string;
  code: string;
  regionId?: string | null;
  region?: Region | null;
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  deletedAt?: string | null;
}

// ==================== 港口相关 ====================

export interface Port {
  id: string;
  code: string;
  name: string;
  nameEn?: string | null;
  countryId: string;
  country?: Country;
  city?: string | null;
  address?: string | null;
  isCommon: boolean;
  status: PortStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  deletedAt?: string | null;
}

// ==================== 品牌相关 ====================

export interface Brand {
  id: string;
  code: string;
  name: string;
  nameEn?: string | null;
  customerId?: string | null;
  customerCode?: string | null;
  customerName?: string | null;
  type?: BrandType | string | null;
  description?: string | null;
  descriptionEn?: string | null;
  isCommon: boolean;
  isSelfOwned: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  deletedAt?: string | null;
}
