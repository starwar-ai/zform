/**
 * 客户 Adapter
 *
 * domestic_customer 与 international_customer 共用 Customer 模型，
 * 通过 baseWhere (isForeign) 区分。
 */

import type { DocumentTypeAdapter } from '../types';
import { codeGeneratorApi } from '../../services/code-generator.service';

function transformDocToPrisma(data: any) {
  const masterData = data.masterData || {};
  const detailTables = data.detailTables || [];

  const bankAccountsTable = detailTables.find((t: any) => t.tableId === 'bank_accounts');
  const contactsTable = detailTables.find((t: any) => t.tableId === 'contacts');
  const paymentTermsTable = detailTables.find((t: any) => t.tableId === 'payment_terms');
  const currenciesTable = detailTables.find((t: any) => t.tableId === 'currencies');

  const bankAccounts =
    bankAccountsTable?.rows?.map((r: any) => ({
      bankName: r.data?.bankName || '',
      bankAccount: r.data?.bankAccount,
      accountNumber: r.data?.accountNumber || '',
      branchAddress: r.data?.branchAddress,
      branchContact: r.data?.branchContact,
      isDefault: r.data?.isDefault ?? false,
    })) || [];

  const contacts =
    contactsTable?.rows?.map((r: any) => ({
      name: r.data?.name || '',
      position: r.data?.position,
      email: r.data?.email,
      mobile: r.data?.mobile,
      phone: r.data?.phone,
      address: r.data?.address,
      wechat: r.data?.wechat,
      qq: r.data?.qq,
      isDefault: r.data?.isDefault ?? false,
      remark: r.data?.remark,
    })) || [];

  const paymentTermList =
    paymentTermsTable?.rows?.map((r: any) => ({
      paymentTermId: r.data?.paymentTermId,
      isDefault: r.data?.isDefault ?? false,
      // Add payment term details for display
      paymentTermCode: r.data?.paymentTerm?.code || '',
      paymentTermName: r.data?.paymentTerm?.name || '',
      paymentTermNameEng: r.data?.paymentTerm?.nameEng || '',
      stepCount: r.data?.paymentTerm?.steps?.length || 0,
    })) || [];

  const currencies =
    currenciesTable?.rows?.map((r: any) => ({
      currencyCode: r.data?.currencyCode,
      isDefault: r.data?.isDefault ?? false,
      exchangeRate: r.data?.exchangeRate,
      remark: r.data?.remark,
    })) || [];

  // Exclude frontend-only fields that don't exist in Prisma Customer model
  const {
    id: _id,
    typeId: _typeId,
    docNumber: _docNumber,
    status: _status,
    _isNew,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    createdBy: _createdBy,
    updatedBy: _updatedBy,
    sourceRef: _sourceRef,
    detailTables: _detailTables,
    ...customerFields
  } = masterData;

  return {
    ...customerFields,
    code: customerFields.code || masterData.docNumber,
    bankAccounts: bankAccounts.length ? { create: bankAccounts } : undefined,
    contacts: contacts.length ? { create: contacts } : undefined,
    paymentTermList: paymentTermList.length ? paymentTermList : undefined,
    currencies: currencies.length ? currencies : undefined,
  };
}

const baseCustomerAdapter: Omit<DocumentTypeAdapter, 'typeId' | 'typeName' | 'baseWhere'> = {
  prismaModel: 'customer',

  searchFields: ['code', 'name', 'shortName'],

  listIncludes: {
    bankAccounts: {
      where: { deletedAt: null },
      orderBy: { isDefault: 'desc' },
      take: 1,
    },
    contacts: {
      where: { deletedAt: null },
      orderBy: { isDefault: 'desc' },
      take: 1,
    },
    customerPaymentTerms: {
      include: { paymentTerm: true },
      orderBy: { isDefault: 'desc' },
    },
  },
  detailIncludes: {
    bankAccounts: {
      where: { deletedAt: null },
      orderBy: { isDefault: 'desc' },
    },
    contacts: {
      where: { deletedAt: null },
      orderBy: { isDefault: 'desc' },
    },
    customerPaymentTerms: {
      include: { paymentTerm: true },
      orderBy: { isDefault: 'desc' },
    },
  },

  defaultOrderBy: { createdAt: 'desc' },

  columnToPrismaField: {
    _docNumber: 'code',
    _status: 'approvalStatus',
    _createdAt: 'createdAt',
    stage: 'stage',
    isEnabled: 'isEnabled',
  },

  aggregateFields: [],

  flattenRow(row: any) {
    // Get the default payment term for display
    const defaultPaymentTerm = row.customerPaymentTerms?.find((pt: any) => pt.isDefault);
    
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.approvalStatus,
      _createdAt: row.createdAt,
      name: row.name,
      shortName: row.shortName,
      stage: row.stage,
      isEnabled: row.isEnabled,
      currency: row.currency,
      phone: row.phone,
      email: row.email,
      // Payment term display info
      defaultPaymentTermName: defaultPaymentTerm?.paymentTerm?.name || '',
      defaultPaymentTermNameEng: defaultPaymentTerm?.paymentTerm?.nameEng || '',
      paymentTermStepCount: defaultPaymentTerm?.paymentTerm?.steps?.length || 0,
    };
  },

  async onCreate(data, userId, prisma) {
    const payload = transformDocToPrisma(data);
    const { paymentTermList, bankAccounts, contacts, currencies, ...rest } = payload;
    // Auto-generate customer code if not provided
    if (!rest.code) {
      rest.code = await codeGeneratorApi.generateCustomerCode();
    }

    const createData: any = {
      ...rest,
      createdBy: userId,
      updatedBy: userId,
    };
    if (bankAccounts?.create?.length) {
      createData.bankAccounts = {
        create: bankAccounts.create.map((b: any) => ({
          ...b,
          createdBy: userId,
          updatedBy: userId,
        })),
      };
    }
    if (contacts?.create?.length) {
      createData.contacts = {
        create: contacts.create.map((c: any) => ({
          ...c,
          createdBy: userId,
          updatedBy: userId,
        })),
      };
    }
    if (paymentTermList?.length) {
      createData.customerPaymentTerms = {
        create: paymentTermList.map((p: any) => ({
          paymentTermId: p.paymentTermId,
          isDefault: p.isDefault ?? false,
        })),
      };
    }
    if (currencies?.length) {
      // TODO: 需要在数据库中添加客户币种表
      console.log('客户币种数据:', currencies);
    }

    return prisma.customer.create({
      data: createData,
      include: baseCustomerAdapter.detailIncludes,
    });
  },

  async onUpdate(id, data, userId, prisma) {
    const payload = transformDocToPrisma(data);
    const { paymentTermList, bankAccounts, contacts, currencies, ...rest } = payload;

    if (paymentTermList !== undefined) {
      await prisma.customerPaymentTerm.deleteMany({ where: { customerId: id } });
      if (paymentTermList.length > 0) {
        await prisma.customerPaymentTerm.createMany({
          data: paymentTermList.map((p: any) => ({
            customerId: id,
            paymentTermId: p.paymentTermId,
            isDefault: p.isDefault ?? false,
          })),
        });
      }
    }

    if (bankAccounts !== undefined) {
      await prisma.customerBankAccount.updateMany({
        where: { customerId: id },
        data: { deletedAt: new Date(), updatedBy: userId },
      });
      if (bankAccounts?.create?.length) {
        for (const b of bankAccounts.create) {
          await prisma.customerBankAccount.create({
            data: {
              customerId: id,
              bankName: b.bankName,
              bankAccount: b.bankAccount,
              accountNumber: b.accountNumber,
              branchAddress: b.branchAddress,
              branchContact: b.branchContact,
              isDefault: b.isDefault ?? false,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }
      }
    }

    if (contacts !== undefined) {
      await prisma.customerContact.updateMany({
        where: { customerId: id },
        data: { deletedAt: new Date(), updatedBy: userId },
      });
      if (contacts?.create?.length) {
        for (const c of contacts.create) {
          await prisma.customerContact.create({
            data: {
              customerId: id,
              name: c.name,
              position: c.position,
              email: c.email,
              mobile: c.mobile,
              phone: c.phone,
              address: c.address,
              wechat: c.wechat,
              qq: c.qq,
              isDefault: c.isDefault ?? false,
              remark: c.remark,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }
      }
    }

    // 处理币种数据
    if (currencies !== undefined) {
      // TODO: 需要在数据库中添加客户币种表
      console.log('更新客户币种数据:', currencies);
    }

    return prisma.customer.update({
      where: { id },
      data: {
        ...rest,
        updatedBy: userId,
      },
      include: baseCustomerAdapter.detailIncludes,
    });
  },

  // Custom actions for payment terms
  actions: {
    async setPaymentTermDefault({ id: customerId, body, userId, prisma }) {
      const { paymentTermId } = body;
      
      // First, set all payment terms to non-default
      await prisma.customerPaymentTerm.updateMany({
        where: { customerId },
        data: { isDefault: false }
      });
      
      // Then set the selected one as default
      const result = await prisma.customerPaymentTerm.updateMany({
        where: { 
          customerId,
          paymentTermId
        },
        data: { isDefault: true }
      });
      
      return { 
        data: { success: result.count > 0 }, 
        message: result.count > 0 ? '设置默认成功' : '设置默认失败' 
      };
    }
  }
};

/** 国内客户 */
export const domesticCustomerAdapter: DocumentTypeAdapter = {
  ...baseCustomerAdapter,
  typeId: 'domestic_customer',
  typeName: '国内客户',
  baseWhere: { isForeign: false },

  async onCreate(data, userId, prisma) {
    const payload = transformDocToPrisma(data);
    const { paymentTermList, bankAccounts, contacts, ...rest } = payload;
    // Auto-generate customer code if not provided
    if (!rest.code) {
      rest.code = await codeGeneratorApi.generateCustomerCode();
    }
    const createData: any = {
      ...rest,
      isForeign: false,
      createdBy: userId,
      updatedBy: userId,
    };
    if (bankAccounts?.create?.length) {
      createData.bankAccounts = {
        create: bankAccounts.create.map((b: any) => ({
          ...b,
          createdBy: userId,
          updatedBy: userId,
        })),
      };
    }
    if (contacts?.create?.length) {
      createData.contacts = {
        create: contacts.create.map((c: any) => ({
          ...c,
          createdBy: userId,
          updatedBy: userId,
        })),
      };
    }
    if (paymentTermList?.length) {
      createData.customerPaymentTerms = {
        create: paymentTermList.map((p: any) => ({
          paymentTermId: p.paymentTermId,
          isDefault: p.isDefault ?? false,
        })),
      };
    }
    return prisma.customer.create({
      data: createData,
      include: baseCustomerAdapter.detailIncludes,
    });
  },
} as DocumentTypeAdapter;

/** 国外客户 */
export const internationalCustomerAdapter: DocumentTypeAdapter = {
  ...baseCustomerAdapter,
  typeId: 'international_customer',
  typeName: '国外客户',
  baseWhere: { isForeign: true },

  async onCreate(data, userId, prisma) {
    const payload = transformDocToPrisma(data);
    const { paymentTermList, bankAccounts, contacts, ...rest } = payload;
    // Auto-generate customer code if not provided
    if (!rest.code) {
      rest.code = await codeGeneratorApi.generateCustomerCode();
    }
    const createData: any = {
      ...rest,
      isForeign: true,
      createdBy: userId,
      updatedBy: userId,
    };
    if (bankAccounts?.create?.length) {
      createData.bankAccounts = {
        create: bankAccounts.create.map((b: any) => ({
          ...b,
          createdBy: userId,
          updatedBy: userId,
        })),
      };
    }
    if (contacts?.create?.length) {
      createData.contacts = {
        create: contacts.create.map((c: any) => ({
          ...c,
          createdBy: userId,
          updatedBy: userId,
        })),
      };
    }
    if (paymentTermList?.length) {
      createData.customerPaymentTerms = {
        create: paymentTermList.map((p: any) => ({
          paymentTermId: p.paymentTermId,
          isDefault: p.isDefault ?? false,
        })),
      };
    }
    return prisma.customer.create({
      data: createData,
      include: baseCustomerAdapter.detailIncludes,
    });
  },
} as DocumentTypeAdapter;
