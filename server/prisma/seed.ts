import {
  PrismaClient,
  ProductType,
  ProductStatus,
  CustomerStage,
  ShippingMethod,
  ApprovalStatus,
  SupplierType,
  SupplierStage,
  SupplierLevel,
  SalesContractStatus,
  SalesContractType,
  PrintStatus,
  SignBackStatus,
  ConfirmStatus,
  CompanyNature,
  PortStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  const department = await prisma.department.upsert({
    where: { code: 'DEPT001' },
    update: { name: 'R&D' },
    create: { code: 'DEPT001', name: 'R&D' },
  });

  const brand = await prisma.brand.upsert({
    where: { code: 'BRAND001' },
    update: { name: 'Own Brand A', isSelfOwned: true },
    create: { code: 'BRAND001', name: 'Own Brand A', isSelfOwned: true },
  });

  const category = await prisma.productCategory.upsert({
    where: { code: 'CAT001' },
    update: { name: 'Electronics', level: 1 },
    create: { code: 'CAT001', name: 'Electronics', level: 1 },
  });

  const hsCode = await prisma.hsCode.upsert({
    where: { code: 'HS001' },
    update: {
      name: 'Plastic Products',
      hsCode: '3926909090',
      customsUnit: 'PCS',
      taxRefundRate: 13.0,
      taxRate: 17.0,
    },
    create: {
      code: 'HS001',
      name: 'Plastic Products',
      hsCode: '3926909090',
      customsUnit: 'PCS',
      taxRefundRate: 13.0,
      taxRate: 17.0,
    },
  });

  const packageMethod = await prisma.packageMethod.upsert({
    where: { code: 'PKG001' },
    update: { name: 'Standard Carton', nameEn: 'Standard Carton' },
    create: { code: 'PKG001', name: 'Standard Carton', nameEn: 'Standard Carton' },
  });

  // ==================== 业务属性配置 Seed ====================

  // ---- 客户分类（树形结构）----
  const customerCategoryA = await prisma.customerCategory.upsert({
    where: { code: 'CC001' },
    update: { name: 'A类客户' },
    create: { code: 'CC001', name: 'A类客户' },
  });

  const customerCategoryA1 = await prisma.customerCategory.upsert({
    where: { code: 'CC001-1' },
    update: { name: 'A1级客户', parentId: customerCategoryA.id },
    create: { code: 'CC001-1', name: 'A1级客户', parentId: customerCategoryA.id },
  });

  const customerCategoryA2 = await prisma.customerCategory.upsert({
    where: { code: 'CC001-2' },
    update: { name: 'A2级客户', parentId: customerCategoryA.id },
    create: { code: 'CC001-2', name: 'A2级客户', parentId: customerCategoryA.id },
  });

  const customerCategoryB = await prisma.customerCategory.upsert({
    where: { code: 'CC002' },
    update: { name: 'B类客户' },
    create: { code: 'CC002', name: 'B类客户' },
  });

  const customerCategoryB1 = await prisma.customerCategory.upsert({
    where: { code: 'CC002-1' },
    update: { name: 'B1级客户', parentId: customerCategoryB.id },
    create: { code: 'CC002-1', name: 'B1级客户', parentId: customerCategoryB.id },
  });

  const customerCategoryC = await prisma.customerCategory.upsert({
    where: { code: 'CC003' },
    update: { name: 'C类客户' },
    create: { code: 'CC003', name: 'C类客户' },
  });

  // ---- 海关编码 ----
  const hsCodeElectronics = await prisma.hsCode.upsert({
    where: { code: 'HS-ELEC' },
    update: {
      name: '电子产品',
      hsCode: '85',
      customsUnit: 'PCS',
      taxRefundRate: 13.0,
      taxRate: 17.0,
      fullName: '电子产品（含手机配件等）',
    },
    create: {
      code: 'HS-ELEC',
      name: '电子产品',
      hsCode: '85',
      customsUnit: 'PCS',
      taxRefundRate: 13.0,
      taxRate: 17.0,
      fullName: '电子产品（含手机配件等）',
    },
  });

  const hsCodePhoneAccessories = await prisma.hsCode.upsert({
    where: { code: 'HS-PHONE-ACC' },
    update: {
      name: '手机配件',
      hsCode: '8517',
      customsUnit: 'PCS',
      taxRefundRate: 13.0,
      taxRate: 17.0,
      fullName: '手机配件及零件',
    },
    create: {
      code: 'HS-PHONE-ACC',
      name: '手机配件',
      hsCode: '8517',
      customsUnit: 'PCS',
      taxRefundRate: 13.0,
      taxRate: 17.0,
      fullName: '手机配件及零件',
    },
  });

  const hsCodePhoneCase = await prisma.hsCode.upsert({
    where: { code: 'HS-PHONE-CASE' },
    update: {
      name: '手机壳',
      hsCode: '85177090',
      customsUnit: 'PCS',
      taxRefundRate: 13.0,
      taxRate: 17.0,
      fullName: '手机保护壳',
      secondUnit: 'KG',
    },
    create: {
      code: 'HS-PHONE-CASE',
      name: '手机壳',
      hsCode: '85177090',
      customsUnit: 'PCS',
      taxRefundRate: 13.0,
      taxRate: 17.0,
      fullName: '手机保护壳',
      secondUnit: 'KG',
    },
  });

  const hsCodePlastic = await prisma.hsCode.upsert({
    where: { code: 'HS-PLASTIC' },
    update: {
      name: '塑料制品',
      hsCode: '39',
      customsUnit: 'KG',
      taxRefundRate: 13.0,
      taxRate: 17.0,
      fullName: '塑料制品及其制品',
    },
    create: {
      code: 'HS-PLASTIC',
      name: '塑料制品',
      hsCode: '39',
      customsUnit: 'KG',
      taxRefundRate: 13.0,
      taxRate: 17.0,
      fullName: '塑料制品及其制品',
    },
  });

  const hsCodePlasticPackaging = await prisma.hsCode.upsert({
    where: { code: 'HS-PLASTIC-PKG' },
    update: {
      name: '塑料包装',
      hsCode: '3923',
      customsUnit: 'KG',
      taxRefundRate: 13.0,
      taxRate: 17.0,
      fullName: '塑料包装制品',
      secondUnit: 'PCS',
    },
    create: {
      code: 'HS-PLASTIC-PKG',
      name: '塑料包装',
      hsCode: '3923',
      customsUnit: 'KG',
      taxRefundRate: 13.0,
      taxRate: 17.0,
      fullName: '塑料包装制品',
      secondUnit: 'PCS',
    },
  });

  // ---- 展会分类（扁平列表）----
  // 由于 ExhibitionCategory 没有唯一字段，使用 findFirst + create 模式
  const exhibitionCategory1 =
    (await prisma.exhibitionCategory.findFirst({
      where: { name: '广交会', deletedAt: null },
    })) ||
    (await prisma.exhibitionCategory.create({
      data: { name: '广交会', isDomestic: true },
    }));

  const exhibitionCategory2 =
    (await prisma.exhibitionCategory.findFirst({
      where: { name: '华交会', deletedAt: null },
    })) ||
    (await prisma.exhibitionCategory.create({
      data: { name: '华交会', isDomestic: true },
    }));

  const exhibitionCategory3 =
    (await prisma.exhibitionCategory.findFirst({
      where: { name: '香港电子展', deletedAt: null },
    })) ||
    (await prisma.exhibitionCategory.create({
      data: { name: '香港电子展', isDomestic: false },
    }));

  const exhibitionCategory4 =
    (await prisma.exhibitionCategory.findFirst({
      where: { name: 'CES国际消费电子展', deletedAt: null },
    })) ||
    (await prisma.exhibitionCategory.create({
      data: { name: 'CES国际消费电子展', isDomestic: false },
    }));

  const exhibitionCategory5 =
    (await prisma.exhibitionCategory.findFirst({
      where: { name: '深圳高交会', deletedAt: null },
    })) ||
    (await prisma.exhibitionCategory.create({
      data: { name: '深圳高交会', isDomestic: true },
    }));

  // ---- 客户来源（扁平列表）----
  const customerSourceTagSeeds = [
    { code: 'CS001', name: '阿里巴巴' },
    { code: 'CS002', name: '促销活动' },
    { code: 'CS003', name: '广交会' },
    { code: 'CS004', name: '国外会展' },
    { code: 'CS005', name: '合作伙伴' },
    { code: 'CS006', name: '互联网' },
    { code: 'CS007', name: '老客户介绍' },
  ];

  const customerSourceTags = [];
  for (const seed of customerSourceTagSeeds) {
    const tag =
      (await prisma.customerSourceTag.findFirst({
        where: { code: seed.code, deletedAt: null },
      })) ||
      (await prisma.customerSourceTag.create({
        data: { code: seed.code, name: seed.name, isCommon: false },
      }));
    customerSourceTags.push(tag);
  }

  // ==================== 分类管理 Seed 结束 ====================

  const standardProduct = await prisma.product.upsert({
    where: { code: 'STD001' },
    update: {
      name: 'Standard Phone Case',
      nameEn: 'Standard Phone Case',
      productType: ProductType.STANDARD,
      status: ProductStatus.ACTIVE,
      material: 'PC',
      unit: 'PCS',
      categoryId: category.id,
      brandId: brand.id,
      departmentId: department.id,
      hsCodeId: hsCode.id,
      packageMethodId: packageMethod.id,
      length: 15.5,
      width: 8.0,
      height: 1.2,
      netWeight: 0.025,
      salePrice: 9.99,
      description: 'Standard phone case for multiple models.',
    },
    create: {
      code: 'STD001',
      name: 'Standard Phone Case',
      nameEn: 'Standard Phone Case',
      productType: ProductType.STANDARD,
      status: ProductStatus.ACTIVE,
      material: 'PC',
      unit: 'PCS',
      categoryId: category.id,
      brandId: brand.id,
      departmentId: department.id,
      hsCodeId: hsCode.id,
      packageMethodId: packageMethod.id,
      length: 15.5,
      width: 8.0,
      height: 1.2,
      netWeight: 0.025,
      salePrice: 9.99,
      description: 'Standard phone case for multiple models.',
    },
  });

  const customerProduct = await prisma.product.upsert({
    where: { code: 'CUST001' },
    update: {
      name: 'Custom Phone Case - Customer A',
      productType: ProductType.CUSTOMER,
      status: ProductStatus.ACTIVE,
      material: 'PC',
      unit: 'PCS',
      baseProductId: standardProduct.id,
      customerId: 'CUST-A-001',
      customerCode: 'CA001',
      customerProductNo: 'CA-CASE-001',
      categoryId: category.id,
      brandId: brand.id,
      departmentId: department.id,
      salePrice: 12.99,
      description: 'Customized case for Customer A.',
    },
    create: {
      code: 'CUST001',
      name: 'Custom Phone Case - Customer A',
      productType: ProductType.CUSTOMER,
      status: ProductStatus.ACTIVE,
      material: 'PC',
      unit: 'PCS',
      baseProductId: standardProduct.id,
      customerId: 'CUST-A-001',
      customerCode: 'CA001',
      customerProductNo: 'CA-CASE-001',
      categoryId: category.id,
      brandId: brand.id,
      departmentId: department.id,
      salePrice: 12.99,
      description: 'Customized case for Customer A.',
    },
  });

  const accessoryProduct = await prisma.product.upsert({
    where: { code: 'ACC001' },
    update: {
      name: 'Packaging Bag',
      productType: ProductType.STANDARD,
      status: ProductStatus.ACTIVE,
      material: 'PE',
      unit: 'PCS',
      isCommonAccessory: true,
      categoryId: category.id,
      salePrice: 0.15,
      description: 'General packaging bag.',
    },
    create: {
      code: 'ACC001',
      name: 'Packaging Bag',
      productType: ProductType.STANDARD,
      status: ProductStatus.ACTIVE,
      material: 'PE',
      unit: 'PCS',
      isCommonAccessory: true,
      categoryId: category.id,
      salePrice: 0.15,
      description: 'General packaging bag.',
    },
  });

  const componentProduct = await prisma.product.upsert({
    where: { code: 'COMP001' },
    update: {
      name: 'Phone Case Base',
      productType: ProductType.STANDARD,
      status: ProductStatus.ACTIVE,
      material: 'PC',
      unit: 'PCS',
      categoryId: category.id,
      salePrice: 5.0,
      description: 'Base component for phone case.',
    },
    create: {
      code: 'COMP001',
      name: 'Phone Case Base',
      productType: ProductType.STANDARD,
      status: ProductStatus.ACTIVE,
      material: 'PC',
      unit: 'PCS',
      categoryId: category.id,
      salePrice: 5.0,
      description: 'Base component for phone case.',
    },
  });

  await prisma.productAccessory.deleteMany({
    where: { productId: standardProduct.id, accessoryId: accessoryProduct.id },
  });
  await prisma.productAccessory.create({
    data: {
      productId: standardProduct.id,
      accessoryId: accessoryProduct.id,
      productRatio: 1,
      accessoryRatio: 1,
      description: 'One packaging bag per product.',
    },
  });

  await prisma.productBom.deleteMany({
    where: { parentProductId: standardProduct.id, childProductId: componentProduct.id },
  });
  await prisma.productBom.create({
    data: {
      parentProductId: standardProduct.id,
      childProductId: componentProduct.id,
      quantity: 1,
      productType: 'COMPONENT',
    },
  });

  // ===== Customer management seeds =====
  const customerA = await prisma.customer.upsert({
    where: { code: 'CUST001' },
    update: {
      name: 'Acme Trading Co.',
      shortName: 'ACME',
      countryCode: 'US',
      stage: CustomerStage.FORMAL,
      isForeign: true,
      shippingMethod: ShippingMethod.SEA,
      currency: 'USD',
      phone: '+1-212-555-0101',
      approvalStatus: ApprovalStatus.APPROVED,
      isFormal: true,
      formalTime: new Date(),
      isEnabled: true,
    },
    create: {
      code: 'CUST001',
      name: 'Acme Trading Co.',
      shortName: 'ACME',
      countryCode: 'US',
      stage: CustomerStage.FORMAL,
      isForeign: true,
      shippingMethod: ShippingMethod.SEA,
      currency: 'USD',
      phone: '+1-212-555-0101',
      approvalStatus: ApprovalStatus.APPROVED,
      isFormal: true,
      formalTime: new Date(),
      isEnabled: true,
    },
  });

  const customerB = await prisma.customer.upsert({
    where: { code: 'CUST002' },
    update: {
      name: 'Blue Lake Manufacturing',
      shortName: 'BLM',
      countryCode: 'CN',
      stage: CustomerStage.POTENTIAL,
      isForeign: false,
      shippingMethod: ShippingMethod.LAND,
      currency: 'CNY',
      phone: '+86-21-5550-0202',
      approvalStatus: ApprovalStatus.PENDING,
      isFormal: false,
      isEnabled: true,
    },
    create: {
      code: 'CUST002',
      name: 'Blue Lake Manufacturing',
      shortName: 'BLM',
      countryCode: 'CN',
      stage: CustomerStage.POTENTIAL,
      isForeign: false,
      shippingMethod: ShippingMethod.LAND,
      currency: 'CNY',
      phone: '+86-21-5550-0202',
      approvalStatus: ApprovalStatus.PENDING,
      isFormal: false,
      isEnabled: true,
    },
  });

  await prisma.customerBankAccount.deleteMany({ where: { customerId: customerA.id } });
  await prisma.customerBankAccount.deleteMany({ where: { customerId: customerB.id } });
  await prisma.customerBankAccount.createMany({
    data: [
      {
        customerId: customerA.id,
        bankName: 'Bank of America',
        accountNumber: '000111222333',
        branchAddress: 'New York, NY',
        isDefault: true,
      },
      {
        customerId: customerB.id,
        bankName: 'ICBC',
        accountNumber: '6222000000000000',
        branchAddress: 'Shanghai',
        isDefault: true,
      },
    ],
  });

  await prisma.customerContact.deleteMany({ where: { customerId: customerA.id } });
  await prisma.customerContact.deleteMany({ where: { customerId: customerB.id } });
  await prisma.customerContact.createMany({
    data: [
      {
        customerId: customerA.id,
        name: 'Emily Carter',
        position: 'Purchasing Manager',
        email: 'emily.carter@acme.com',
        mobile: '+1-212-555-0102',
        isDefault: true,
      },
      {
        customerId: customerB.id,
        name: 'Li Wei',
        position: 'Buyer',
        email: 'li.wei@blm.cn',
        mobile: '+86-21-5550-0203',
        isDefault: true,
      },
    ],
  });

  // ===== Supplier & quotation seeds =====
  const supplierA = await prisma.supplier.upsert({
    where: { code: 'SUP001' },
    update: {
      name: 'Sunrise Components Ltd.',
      shortName: 'Sunrise',
      supplierType: SupplierType.MANUFACTURER,
      supplierLevel: SupplierLevel.A,
      stage: SupplierStage.FORMAL,
      isFormal: true,
      formalTime: new Date(),
      approvalStatus: ApprovalStatus.APPROVED,
      isEnabled: true,
      companyCity: 'Shenzhen',
    },
    create: {
      code: 'SUP001',
      name: 'Sunrise Components Ltd.',
      shortName: 'Sunrise',
      supplierType: SupplierType.MANUFACTURER,
      supplierLevel: SupplierLevel.A,
      stage: SupplierStage.FORMAL,
      isFormal: true,
      formalTime: new Date(),
      approvalStatus: ApprovalStatus.APPROVED,
      isEnabled: true,
      companyCity: 'Shenzhen',
    },
  });

  const supplierB = await prisma.supplier.upsert({
    where: { code: 'SUP002' },
    update: {
      name: 'Blue River Trading',
      shortName: 'BlueRiver',
      supplierType: SupplierType.SERVICE_PROVIDER,
      supplierLevel: SupplierLevel.B,
      stage: SupplierStage.POTENTIAL,
      approvalStatus: ApprovalStatus.PENDING,
      isEnabled: true,
      companyCity: 'Ningbo',
    },
    create: {
      code: 'SUP002',
      name: 'Blue River Trading',
      shortName: 'BlueRiver',
      supplierType: SupplierType.SERVICE_PROVIDER,
      supplierLevel: SupplierLevel.B,
      stage: SupplierStage.POTENTIAL,
      approvalStatus: ApprovalStatus.PENDING,
      isEnabled: true,
      companyCity: 'Ningbo',
    },
  });

  await prisma.supplierBankAccount.deleteMany({ where: { supplierId: supplierA.id } });
  await prisma.supplierBankAccount.deleteMany({ where: { supplierId: supplierB.id } });
  await prisma.supplierBankAccount.createMany({
    data: [
      {
        supplierId: supplierA.id,
        supplierVersion: 1,
        bankName: 'China Merchants Bank',
        accountNumber: '755000111222',
        branchAddress: 'Shenzhen',
        isDefault: true,
      },
      {
        supplierId: supplierB.id,
        supplierVersion: 1,
        bankName: 'Bank of China',
        accountNumber: '315000333444',
        branchAddress: 'Ningbo',
        isDefault: true,
      },
    ],
  });

  await prisma.supplierQuotation.deleteMany({
    where: { supplierId: supplierA.id },
  });
  await prisma.supplierQuotation.deleteMany({
    where: { supplierId: supplierB.id },
  });

  await prisma.supplierQuotation.createMany({
    data: [
      {
        supplierId: supplierA.id,
        productId: standardProduct.id,
        productCode: standardProduct.code,
        productName: standardProduct.name,
        quotationNo: 'QT-SUP001-001',
        quotationDate: new Date(),
        validFrom: new Date(),
        validTo: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        unitPrice: 7.25,
        currency: 'USD',
        status: ApprovalStatus.APPROVED,
        isActive: true,
      },
      {
        supplierId: supplierB.id,
        productId: standardProduct.id,
        productCode: standardProduct.code,
        productName: standardProduct.name,
        quotationNo: 'QT-SUP002-001',
        quotationDate: new Date(),
        validFrom: new Date(),
        validTo: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        unitPrice: 7.55,
        currency: 'USD',
        status: ApprovalStatus.PENDING,
        isActive: true,
      },
    ],
  });

  // ===== Sales contract seeds =====
  const salesContract = await prisma.salesContract.upsert({
    where: { code: 'SC2026-0001' },
    update: {
      customerId: customerA.id,
      customerCode: customerA.code,
      customerName: customerA.name,
      customerPoNo: 'PO-ACME-2026-001',
      salesPerson: 'Alice Zhang',
      merchandiser: 'Bob Li',
      currency: 'USD',
      usdRate: 7.12,
      creationRate: 7.12,
      totalAmount: 26475.0,
      totalAmountUsd: 26475.0,
      originalCurrencyAmount: 26475.0,
      priceTerms: 'FOB',
      departurePortName: 'Shanghai',
      destinationPortName: 'Los Angeles',
      transportMethod: 'SEA',
      customerDeliveryDate: new Date('2026-03-20T00:00:00.000Z'),
      status: SalesContractStatus.IN_PROGRESS,
      contractType: SalesContractType.STANDARD,
      approvalStatus: ApprovalStatus.APPROVED,
      confirmStatus: ConfirmStatus.CONFIRMED,
      printStatus: PrintStatus.PRINTED,
      printCount: 1,
      signBackStatus: SignBackStatus.SIGNED,
      signBackDate: new Date('2026-01-18T00:00:00.000Z'),
      signBackPerson: 'Emily Carter',
      totalBoxes: 300,
      totalGrossWeight: 850.5,
      totalNetWeight: 780.0,
      totalVolume: 12.6,
      totalQuantity: 2500,
      entryDate: new Date('2026-01-15T00:00:00.000Z'),
      remark: 'Seeded sales contract for demo flow.',
      items: {
        deleteMany: {},
        create: [
          {
            lineNumber: 1,
            productId: standardProduct.id,
            productCode: standardProduct.code,
            productName: standardProduct.name,
            quantity: 2000,
            unit: 'PCS',
            unitPrice: 9.99,
            currency: 'USD',
            amount: 19980.0,
            boxes: 220,
            grossWeight: 680.5,
            netWeight: 620.0,
            volume: 9.8,
            packageMethod: 'Standard Carton',
            deliveryDate: new Date('2026-03-20T00:00:00.000Z'),
          },
          {
            lineNumber: 2,
            productId: customerProduct.id,
            productCode: customerProduct.code,
            productName: customerProduct.name,
            customerProductNo: customerProduct.customerProductNo,
            quantity: 500,
            unit: 'PCS',
            unitPrice: 12.99,
            currency: 'USD',
            amount: 6495.0,
            boxes: 80,
            grossWeight: 170.0,
            netWeight: 160.0,
            volume: 2.8,
            packageMethod: 'Standard Carton',
            deliveryDate: new Date('2026-03-20T00:00:00.000Z'),
          },
        ],
      },
    },
    create: {
      code: 'SC2026-0001',
      internalCode: 'INT-SC-2026-0001',
      customerId: customerA.id,
      customerCode: customerA.code,
      customerName: customerA.name,
      customerPoNo: 'PO-ACME-2026-001',
      salesPerson: 'Alice Zhang',
      merchandiser: 'Bob Li',
      currency: 'USD',
      usdRate: 7.12,
      creationRate: 7.12,
      totalAmount: 26475.0,
      totalAmountUsd: 26475.0,
      originalCurrencyAmount: 26475.0,
      priceTerms: 'FOB',
      departurePortName: 'Shanghai',
      destinationPortName: 'Los Angeles',
      transportMethod: 'SEA',
      customerDeliveryDate: new Date('2026-03-20T00:00:00.000Z'),
      status: SalesContractStatus.IN_PROGRESS,
      contractType: SalesContractType.STANDARD,
      approvalStatus: ApprovalStatus.APPROVED,
      confirmStatus: ConfirmStatus.CONFIRMED,
      printStatus: PrintStatus.PRINTED,
      printCount: 1,
      signBackStatus: SignBackStatus.SIGNED,
      signBackDate: new Date('2026-01-18T00:00:00.000Z'),
      signBackPerson: 'Emily Carter',
      totalBoxes: 300,
      totalGrossWeight: 850.5,
      totalNetWeight: 780.0,
      totalVolume: 12.6,
      totalQuantity: 2500,
      entryDate: new Date('2026-01-15T00:00:00.000Z'),
      remark: 'Seeded sales contract for demo flow.',
      items: {
        create: [
          {
            lineNumber: 1,
            productId: standardProduct.id,
            productCode: standardProduct.code,
            productName: standardProduct.name,
            quantity: 2000,
            unit: 'PCS',
            unitPrice: 9.99,
            currency: 'USD',
            amount: 19980.0,
            boxes: 220,
            grossWeight: 680.5,
            netWeight: 620.0,
            volume: 9.8,
            packageMethod: 'Standard Carton',
            deliveryDate: new Date('2026-03-20T00:00:00.000Z'),
          },
          {
            lineNumber: 2,
            productId: customerProduct.id,
            productCode: customerProduct.code,
            productName: customerProduct.name,
            customerProductNo: customerProduct.customerProductNo,
            quantity: 500,
            unit: 'PCS',
            unitPrice: 12.99,
            currency: 'USD',
            amount: 6495.0,
            boxes: 80,
            grossWeight: 170.0,
            netWeight: 160.0,
            volume: 2.8,
            packageMethod: 'Standard Carton',
            deliveryDate: new Date('2026-03-20T00:00:00.000Z'),
          },
        ],
      },
    },
  });

  // ===== Approval rule config seeds =====
  const salesContractApprovalRule = await prisma.approvalRuleConfig.upsert({
    where: { code: 'sales_contract_approval' },
    update: {
      name: '销售合同审核',
      docType: 'sales_contract',
      levels: [
        { name: '业务经理审批', mode: 'any', roleIds: ['MANAGER'] },
        { name: '总经理审批', mode: 'any', roleIds: ['ADMIN'] },
      ],
      condition: { field: 'totalAmount', operator: 'gt', value: 100000 },
      enabled: true,
    },
    create: {
      code: 'sales_contract_approval',
      name: '销售合同审核',
      docType: 'sales_contract',
      levels: [
        { name: '业务经理审批', mode: 'any', roleIds: ['MANAGER'] },
        { name: '总经理审批', mode: 'any', roleIds: ['ADMIN'] },
      ],
      condition: { field: 'totalAmount', operator: 'gt', value: 100000 },
      enabled: true,
    },
  });

  const purchasePlanApprovalRule = await prisma.approvalRuleConfig.upsert({
    where: { code: 'purchase_plan_approval' },
    update: {
      name: '采购计划审核',
      docType: 'purchase_plan',
      levels: [
        { name: '业务经理审批', mode: 'any', roleIds: ['MANAGER'] },
      ],
      condition: null,
      enabled: true,
    },
    create: {
      code: 'purchase_plan_approval',
      name: '采购计划审核',
      docType: 'purchase_plan',
      levels: [
        { name: '业务经理审批', mode: 'any', roleIds: ['MANAGER'] },
      ],
      condition: null,
      enabled: true,
    },
  });

  const purchaseContractApprovalRule = await prisma.approvalRuleConfig.upsert({
    where: { code: 'purchase_contract_approval' },
    update: {
      name: '采购合同审核',
      docType: 'purchase_contract',
      levels: [
        { name: '业务经理审批', mode: 'any', roleIds: ['MANAGER'] },
        { name: '管理层会签', mode: 'all', roleIds: ['ADMIN', 'MANAGER'] },
      ],
      condition: null,
      enabled: true,
    },
    create: {
      code: 'purchase_contract_approval',
      name: '采购合同审核',
      docType: 'purchase_contract',
      levels: [
        { name: '业务经理审批', mode: 'any', roleIds: ['MANAGER'] },
        { name: '管理层会签', mode: 'all', roleIds: ['ADMIN', 'MANAGER'] },
      ],
      condition: null,
      enabled: true,
    },
  });

  // ==================== 系统管理种子数据 ====================
  console.log('Seeding system management data...');

  // -- 部门层级 --
  // 清空旧数据
  await prisma.department.deleteMany({});

  const companyDept = await prisma.department.create({
    data: { code: 'COMPANY', name: '总公司', orderNum: 0 },
  });

  const salesDept = await prisma.department.create({
    data: { code: 'SALES', name: '销售部', parentId: companyDept.id, orderNum: 1 },
  });
  const salesDeptDomestic = await prisma.department.create({
    data: { code: 'SALES_DOMESTIC', name: '内销组', parentId: salesDept.id, orderNum: 1 },
  });
  const salesDeptExport = await prisma.department.create({
    data: { code: 'SALES_EXPORT', name: '外贸组', parentId: salesDept.id, orderNum: 2 },
  });

  const purchaseDept = await prisma.department.create({
    data: { code: 'PURCHASE', name: '采购部', parentId: companyDept.id, orderNum: 2 },
  });

  const techDept = await prisma.department.create({
    data: { code: 'TECH', name: '技术部', parentId: companyDept.id, orderNum: 3 },
  });

  const financeDept = await prisma.department.create({
    data: { code: 'FINANCE', name: '财务部', parentId: companyDept.id, orderNum: 4 },
  });

  // -- 角色 --
  const adminRole = await prisma.sysRole.upsert({
    where: { code: 'ADMIN' },
    update: { name: '系统管理员', description: '拥有全部权限', status: 'active' },
    create: { code: 'ADMIN', name: '系统管理员', description: '拥有全部权限', status: 'active' },
  });

  const managerRole = await prisma.sysRole.upsert({
    where: { code: 'MANAGER' },
    update: { name: '业务经理', description: '单据审批和管理权限', status: 'active' },
    create: { code: 'MANAGER', name: '业务经理', description: '单据审批和管理权限', status: 'active' },
  });

  const userRole = await prisma.sysRole.upsert({
    where: { code: 'USER' },
    update: { name: '普通用户', description: '基础操作权限', status: 'active' },
    create: { code: 'USER', name: '普通用户', description: '基础操作权限', status: 'active' },
  });

  // -- 用户 --
  const adminPassword = await bcrypt.hash('admin123', 10);
  const demoPassword = await bcrypt.hash('123456', 10);

  const adminUser = await prisma.sysUser.upsert({
    where: { username: 'admin' },
    update: { name: '管理员', password: adminPassword, status: 'active', departmentId: techDept.id },
    create: {
      username: 'admin',
      password: adminPassword,
      name: '管理员',
      email: 'admin@zform.com',
      department: '技术部',
      departmentId: techDept.id,
      status: 'active',
    },
  });

  const demoUser = await prisma.sysUser.upsert({
    where: { username: 'demo' },
    update: { name: '演示用户', password: demoPassword, status: 'active', departmentId: salesDept.id },
    create: {
      username: 'demo',
      password: demoPassword,
      name: '演示用户',
      email: 'demo@zform.com',
      department: '销售部',
      departmentId: salesDept.id,
      status: 'active',
    },
  });

  // -- 用户-角色关联 --
  await prisma.sysUserRole.deleteMany({ where: { userId: adminUser.id } });
  await prisma.sysUserRole.deleteMany({ where: { userId: demoUser.id } });
  await prisma.sysUserRole.createMany({
    data: [
      { userId: adminUser.id, roleId: adminRole.id },
      { userId: demoUser.id, roleId: userRole.id },
    ],
  });

  // -- 菜单 --
  // 先清空旧菜单数据（避免重复）
  await prisma.sysRoleMenu.deleteMany({});
  await prisma.sysMenu.deleteMany({});

  // 顶级菜单：单据管理
  const businessEntryMenu = await prisma.sysMenu.create({
    data: {
      title: '业务入口',
      icon: 'FileText',
      path: null,
      parentId: null,
      orderNum: 1,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const oaEntryMenu = await prisma.sysMenu.create({
    data: {
      title: 'OA入口',
      icon: 'Briefcase',
      path: null,
      parentId: null,
      orderNum: 4,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 业务入口子菜单
  const salesContractMenu = await prisma.sysMenu.create({
    data: {
      title: '销售合同',
      icon: 'ClipboardList',
      path: '/sales-management',
      parentId: businessEntryMenu.id,
      orderNum: 1,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const purchasePlanMenu = await prisma.sysMenu.create({
    data: {
      title: '采购计划',
      icon: 'ShoppingCart',
      path: '/purchase-plan-management',
      parentId: businessEntryMenu.id,
      orderNum: 2,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 采购合同菜单
  const purchaseContractMenu = await prisma.sysMenu.create({
    data: {
      title: '采购合同',
      icon: 'ClipboardList',
      path: '/purchase-contract-management',
      parentId: businessEntryMenu.id,
      orderNum: 3,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // ---- 单证入口（一级菜单） ----
  const documentEntryMenu = await prisma.sysMenu.create({
    data: {
      title: '单证入口',
      icon: 'FileText',
      path: null,
      parentId: null,
      orderNum: 5,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 出运计划菜单 - 移到单证入口下
  const shipmentPlanMenu = await prisma.sysMenu.create({
    data: {
      title: '出运计划',
      icon: 'Ship',
      path: '/type-list/shipment_plan',
      parentId: documentEntryMenu.id,
      orderNum: 1,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 出运明细菜单 - 移到单证入口下
  const shipmentDetailMenu = await prisma.sysMenu.create({
    data: {
      title: '出运明细',
      icon: 'Package',
      path: '/type-list/shipment_detail',
      parentId: documentEntryMenu.id,
      orderNum: 2,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // ---- 资料入口（一级菜单） ----
  const dataEntryMenu = await prisma.sysMenu.create({
    data: {
      title: '资料入口',
      icon: 'Database',
      path: null,
      parentId: null,
      orderNum: 6,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 产品管理菜单（无子菜单）- 移到资料入口下
  const productManagementMenu = await prisma.sysMenu.create({
    data: {
      title: '产品管理',
      icon: 'Package',
      path: '/product-management',
      parentId: dataEntryMenu.id,
      orderNum: 1,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 客户管理菜单 - 移到资料入口下
  const customerMenu = await prisma.sysMenu.create({
    data: {
      title: '客户管理',
      icon: 'Users',
      path: '/type-list/customer',
      parentId: dataEntryMenu.id,
      orderNum: 2,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 供应商管理菜单 - 移到资料入口下
  const supplierMenu = await prisma.sysMenu.create({
    data: {
      title: '供应商管理',
      icon: 'Truck',
      path: '/supplier-management',
      parentId: dataEntryMenu.id,
      orderNum: 3,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // ---- 质检入口（一级菜单） ----
  const qualityEntryMenu = await prisma.sysMenu.create({
    data: {
      title: '质检入口',
      icon: 'ShieldCheck',
      path: null,
      parentId: null,
      orderNum: 7,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 验货单菜单（质检入口子菜单）
  const inspectionOrderMenu = await prisma.sysMenu.create({
    data: {
      title: '验货单',
      icon: 'ClipboardCheck',
      path: '/type-list/inspection_order',
      parentId: qualityEntryMenu.id,
      orderNum: 2,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 让步接收单菜单（质检入口子菜单）
  const concessionAcceptanceMenu = await prisma.sysMenu.create({
    data: {
      title: '让步接收单',
      icon: 'FileCheck2',
      path: '/type-list/concession_acceptance',
      parentId: qualityEntryMenu.id,
      orderNum: 3,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // ---- 仓库入口（一级菜单） ----
  const warehouseEntryMenu = await prisma.sysMenu.create({
    data: {
      title: '仓库入口',
      icon: 'Warehouse',
      path: null,
      parentId: null,
      orderNum: 8,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 库存查询菜单
  const warehouseInventoryMenu = await prisma.sysMenu.create({
    data: {
      title: '库存查询',
      icon: 'PackageSearch',
      path: '/warehouse-inventory',
      parentId: warehouseEntryMenu.id,
      orderNum: 1,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 入库管理菜单
  const warehouseInboundMenu = await prisma.sysMenu.create({
    data: {
      title: '入库管理',
      icon: 'PackageOpen',
      path: '/warehouse-inbound',
      parentId: warehouseEntryMenu.id,
      orderNum: 2,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 出库管理菜单
  const warehouseOutboundMenu = await prisma.sysMenu.create({
    data: {
      title: '出库管理',
      icon: 'PackageX',
      path: '/warehouse-outbound',
      parentId: warehouseEntryMenu.id,
      orderNum: 3,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // ---- 按钮级权限菜单 (menuType = 'button') ----
  // 这些不会在侧边栏显示，仅用于权限标识

  /** 批量创建某个单据类型的按钮权限 */
  async function createDocPermButtons(
    parentId: string,
    typeId: string,
    actions: { perm: string; title: string }[]
  ) {
    const result: string[] = [];
    for (let i = 0; i < actions.length; i++) {
      const btn = await prisma.sysMenu.create({
        data: {
          title: actions[i].title,
          parentId,
          orderNum: i + 1,
          menuType: 'button',
          permission: `${typeId}:${actions[i].perm}`,
          status: 'visible',
        },
      });
      result.push(btn.id);
    }
    return result;
  }

  // 通用按钮权限定义
  const fullDocActions = [
    { perm: 'create', title: '新建' },
    { perm: 'delete', title: '删除' },
    { perm: 'submit', title: '提交' },
    { perm: 'approve', title: '审批' },
    { perm: 'close', title: '关闭' },
    { perm: 'void', title: '作废' },
    { perm: 'push_down', title: '下推' },
  ];

  const basicDocActions = [
    { perm: 'create', title: '新建' },
    { perm: 'delete', title: '删除' },
    { perm: 'submit', title: '提交' },
    { perm: 'approve', title: '审批' },
  ];

  const salesContractBtnIds = await createDocPermButtons(salesContractMenu.id, 'sales_contract', fullDocActions);
  const purchasePlanBtnIds = await createDocPermButtons(purchasePlanMenu.id, 'purchase_plan', fullDocActions);
  const purchaseContractBtnIds = await createDocPermButtons(purchaseContractMenu.id, 'purchase_contract', [
    ...basicDocActions,
    { perm: 'close', title: '关闭' },
    { perm: 'void', title: '作废' },
  ]);
  const customerBtnIds = await createDocPermButtons(customerMenu.id, 'customer', [
    ...basicDocActions,
    { perm: 'close', title: '关闭' },
  ]);
  const supplierBtnIds = await createDocPermButtons(supplierMenu.id, 'supplier', [
    ...basicDocActions,
    { perm: 'close', title: '关闭' },
  ]);

  // 产品类型按钮权限（挂在产品管理菜单下）
  const stdProductBtnIds = await createDocPermButtons(productManagementMenu.id, 'standard_product', [
    ...basicDocActions,
    { perm: 'push_down', title: '下推' },
  ]);
  const custProductBtnIds = await createDocPermButtons(productManagementMenu.id, 'customer_product', basicDocActions);
  const selfProductBtnIds = await createDocPermButtons(productManagementMenu.id, 'self_owned_product', basicDocActions);

  // 仓库管理按钮权限（挂在入库管理菜单下）
  const warehouseInboundBtnIds = await createDocPermButtons(warehouseInboundMenu.id, 'warehouse_inbound', basicDocActions);
  const warehouseOutboundBtnIds = await createDocPermButtons(warehouseOutboundMenu.id, 'warehouse_outbound', basicDocActions);
  const warehouseInboundNoticeBtnIds = await createDocPermButtons(warehouseInboundMenu.id, 'warehouse_inbound_notice', basicDocActions);
  const warehouseOutboundNoticeBtnIds = await createDocPermButtons(warehouseOutboundMenu.id, 'warehouse_outbound_notice', basicDocActions);

  // 汇总仓库按钮权限
  const warehouseBtnIds = [
    ...warehouseInboundBtnIds,
    ...warehouseOutboundBtnIds,
    ...warehouseInboundNoticeBtnIds,
    ...warehouseOutboundNoticeBtnIds,
  ];

  // 验货单按钮权限
  const inspectionOrderBtnIds = await createDocPermButtons(inspectionOrderMenu.id, 'inspection_order', [
    ...basicDocActions,
    { perm: 'close', title: '关闭' },
    { perm: 'void', title: '作废' },
  ]);

  // 让步接收单按钮权限
  const concessionAcceptanceBtnIds = await createDocPermButtons(concessionAcceptanceMenu.id, 'concession_acceptance', basicDocActions);

  // 所有按钮权限 ID 汇总
  const allBtnIds = [
    ...salesContractBtnIds,
    ...purchasePlanBtnIds,
    ...purchaseContractBtnIds,
    ...customerBtnIds,
    ...supplierBtnIds,
    ...stdProductBtnIds,
    ...custProductBtnIds,
    ...selfProductBtnIds,
    ...warehouseBtnIds,
    ...inspectionOrderBtnIds,
    ...concessionAcceptanceBtnIds,
  ];

  // 顶级菜单：系统管理
  const sysMenu = await prisma.sysMenu.create({
    data: {
      title: '系统管理',
      icon: 'Settings',
      path: null,
      parentId: null,
      orderNum: 2,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 顶级菜单：业务配置
  const businessParentMenu = await prisma.sysMenu.create({
    data: {
      title: '业务配置',
      icon: 'Briefcase',
      path: null,
      parentId: null,
      orderNum: 3,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const userMgmtMenu = await prisma.sysMenu.create({
    data: {
      title: '用户管理',
      icon: 'Users',
      path: '/user-management',
      parentId: sysMenu.id,
      orderNum: 1,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const roleMgmtMenu = await prisma.sysMenu.create({
    data: {
      title: '角色管理',
      icon: 'Shield',
      path: '/role-management',
      parentId: sysMenu.id,
      orderNum: 2,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const menuMgmtMenu = await prisma.sysMenu.create({
    data: {
      title: '菜单管理',
      icon: 'Menu',
      path: '/menu-management',
      parentId: sysMenu.id,
      orderNum: 3,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const deptMgmtMenu = await prisma.sysMenu.create({
    data: {
      title: '部门管理',
      icon: 'Building2',
      path: '/department-management',
      parentId: sysMenu.id,
      orderNum: 4,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const categoryMgmtMenu = await prisma.sysMenu.create({
    data: {
      title: '参数配置',
      icon: 'Tags',
      path: '/category-management',
      parentId: businessParentMenu.id,
      orderNum: 1,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const businessConfigMenu = await prisma.sysMenu.create({
    data: {
      title: '实体配置',
      icon: 'Database',
      path: '/business-config',
      parentId: businessParentMenu.id,
      orderNum: 2,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // -- 数据权限种子数据 --
  await prisma.sysDataPermission.deleteMany({});

  // 管理员角色：全部类型 -> all
  await prisma.sysDataPermission.create({
    data: {
      roleId: adminRole.id,
      typeId: '*',
      level: 'all',
      extraDepartmentIds: [],
      extraUserIds: [],
    },
  });

  // 业务经理角色：全部类型 -> department
  await prisma.sysDataPermission.create({
    data: {
      roleId: managerRole.id,
      typeId: '*',
      level: 'department',
      extraDepartmentIds: [],
      extraUserIds: [],
    },
  });

  // 普通用户角色：全部类型 -> personal
  await prisma.sysDataPermission.create({
    data: {
      roleId: userRole.id,
      typeId: '*',
      level: 'personal',
      extraDepartmentIds: [],
      extraUserIds: [],
    },
  });

  // -- 角色-菜单关联 --
  // 管理员角色：拥有全部菜单 + 全部按钮权限
  const allMenuIds = [
    businessEntryMenu.id,
    salesContractMenu.id,
    purchasePlanMenu.id,
    purchaseContractMenu.id,
    shipmentPlanMenu.id,
    shipmentDetailMenu.id,
    dataEntryMenu.id,
    productManagementMenu.id,
    customerMenu.id,
    supplierMenu.id,
    qualityEntryMenu.id,
    inspectionOrderMenu.id,
    concessionAcceptanceMenu.id,
    warehouseEntryMenu.id,
    warehouseInventoryMenu.id,
    warehouseInboundMenu.id,
    warehouseOutboundMenu.id,
    sysMenu.id,
    userMgmtMenu.id,
    roleMgmtMenu.id,
    menuMgmtMenu.id,
    deptMgmtMenu.id,
    businessParentMenu.id,
    categoryMgmtMenu.id,
    businessConfigMenu.id,
    oaEntryMenu.id,
    ...allBtnIds,
  ];

  await prisma.sysRoleMenu.createMany({
    data: allMenuIds.map((menuId) => ({
      roleId: adminRole.id,
      menuId,
    })),
  });

  // 业务经理角色：业务入口菜单 + 资料入口菜单 + 仓库入口菜单 + 全部按钮权限（含审批）
  const managerMenuIds = [
    businessEntryMenu.id,
    salesContractMenu.id,
    purchasePlanMenu.id,
    purchaseContractMenu.id,
    shipmentPlanMenu.id,
    shipmentDetailMenu.id,
    dataEntryMenu.id,
    productManagementMenu.id,
    customerMenu.id,
    supplierMenu.id,
    qualityEntryMenu.id,
    inspectionOrderMenu.id,
    concessionAcceptanceMenu.id,
    warehouseEntryMenu.id,
    warehouseInventoryMenu.id,
    warehouseInboundMenu.id,
    warehouseOutboundMenu.id,
    ...allBtnIds,
  ];

  await prisma.sysRoleMenu.createMany({
    data: managerMenuIds.map((menuId) => ({
      roleId: managerRole.id,
      menuId,
    })),
  });

  // 普通用户角色：业务入口菜单 + 基础操作按钮权限 (新建/删除/提交，不含审批/关闭/作废/下推)
  // 从每种类型的按钮中，只取 create/delete/submit (前3个)
  const userBtnIds = [
    ...salesContractBtnIds.slice(0, 3),
    ...purchasePlanBtnIds.slice(0, 3),
    ...purchaseContractBtnIds.slice(0, 3),
    ...customerBtnIds.slice(0, 3),
    ...supplierBtnIds.slice(0, 3),
    ...stdProductBtnIds.slice(0, 3),
    ...custProductBtnIds.slice(0, 3),
    ...selfProductBtnIds.slice(0, 3),
    ...warehouseInboundBtnIds.slice(0, 3),
    ...warehouseOutboundBtnIds.slice(0, 3),
    ...warehouseInboundNoticeBtnIds.slice(0, 3),
    ...warehouseOutboundNoticeBtnIds.slice(0, 3),
    ...inspectionOrderBtnIds.slice(0, 3),
    ...concessionAcceptanceBtnIds.slice(0, 3),
  ];

  const userMenuIds = [
    businessEntryMenu.id,
    salesContractMenu.id,
    purchasePlanMenu.id,
    purchaseContractMenu.id,
    shipmentPlanMenu.id,
    shipmentDetailMenu.id,
    dataEntryMenu.id,
    productManagementMenu.id,
    customerMenu.id,
    supplierMenu.id,
    qualityEntryMenu.id,
    inspectionOrderMenu.id,
    concessionAcceptanceMenu.id,
    warehouseEntryMenu.id,
    warehouseInventoryMenu.id,
    warehouseInboundMenu.id,
    warehouseOutboundMenu.id,
    oaEntryMenu.id,
    ...userBtnIds,
  ];

  await prisma.sysRoleMenu.createMany({
    data: userMenuIds.map((menuId) => ({
      roleId: userRole.id,
      menuId,
    })),
  });

  console.log('Seed completed.');
  console.log(`Customers: ${customerA.code}, ${customerB.code}`);
  console.log(`Suppliers: ${supplierA.code}, ${supplierB.code}`);
  console.log(`Products: ${standardProduct.code}, ${customerProduct.code}`);
  console.log(`Sales contract: ${salesContract.code}`);
  console.log(`Approval rules: ${salesContractApprovalRule.code}, ${purchasePlanApprovalRule.code}, ${purchaseContractApprovalRule.code}`);
  console.log(`Departments: ${companyDept.code} -> ${salesDept.code}, ${purchaseDept.code}, ${techDept.code}, ${financeDept.code}`);
  console.log(`Roles: ${adminRole.code}, ${managerRole.code}, ${userRole.code}`);
  console.log(`Users: admin (password: admin123, dept: ${techDept.code}), demo (password: 123456, dept: ${salesDept.code})`);
  console.log(`Menus: ${allMenuIds.length} menus (incl. ${allBtnIds.length} button permissions)`);
  console.log(`System management menus: ${userMgmtMenu.title}, ${roleMgmtMenu.title}, ${menuMgmtMenu.title}, ${deptMgmtMenu.title}, ${categoryMgmtMenu.title}, ${businessConfigMenu.title}`);
  console.log(`Data Entry menus: ${dataEntryMenu.title} (${productManagementMenu.title}, ${customerMenu.title}, ${supplierMenu.title})`);
  console.log(`Warehouse & Quality menus: ${warehouseEntryMenu.title} (${warehouseInventoryMenu.title}, ${warehouseInboundMenu.title}, ${warehouseOutboundMenu.title})`);
  console.log(`Data permissions: admin=all, manager=department, user=personal`);
  console.log(`Customer categories: ${customerCategoryA.code} (${customerCategoryA1.code}, ${customerCategoryA2.code}), ${customerCategoryB.code} (${customerCategoryB1.code}), ${customerCategoryC.code}`);
  console.log(`Product categories (HsCode): ${hsCodeElectronics.code} -> ${hsCodePhoneAccessories.code} -> ${hsCodePhoneCase.code}, ${hsCodePlastic.code} -> ${hsCodePlasticPackaging.code}`);
  console.log(`Exhibition categories: ${exhibitionCategory1.name}, ${exhibitionCategory2.name}, ${exhibitionCategory3.name}, ${exhibitionCategory4.name}, ${exhibitionCategory5.name}`);
  console.log(`Customer source tags: ${customerSourceTags.map((tag: {name: string}) => tag.name).join(', ')}`);

  // ==================== 业务实体管理 Seed ====================

  // ---- 区域 ----
  const regionAsia = await prisma.region.upsert({
    where: { code: 'AS' },
    update: { name: '亚洲' },
    create: { code: 'AS', name: '亚洲' },
  });

  const regionNorthAmerica = await prisma.region.upsert({
    where: { code: 'NA' },
    update: { name: '北美洲' },
    create: { code: 'NA', name: '北美洲' },
  });

  const regionEurope = await prisma.region.upsert({
    where: { code: 'EU' },
    update: { name: '欧洲' },
    create: { code: 'EU', name: '欧洲' },
  });

  // ---- 国家 ----
  const countryChina = await prisma.country.upsert({
    where: { code: 'CN' },
    update: { name: '中国', regionId: regionAsia.id },
    create: { code: 'CN', name: '中国', regionId: regionAsia.id },
  });

  const countryUSA = await prisma.country.upsert({
    where: { code: 'US' },
    update: { name: '美国', regionId: regionNorthAmerica.id },
    create: { code: 'US', name: '美国', regionId: regionNorthAmerica.id },
  });

  const countryGermany = await prisma.country.upsert({
    where: { code: 'DE' },
    update: { name: '德国', regionId: regionEurope.id },
    create: { code: 'DE', name: '德国', regionId: regionEurope.id },
  });

  const countryJapan = await prisma.country.upsert({
    where: { code: 'JP' },
    update: { name: '日本', regionId: regionAsia.id },
    create: { code: 'JP', name: '日本', regionId: regionAsia.id },
  });

  const countryUK = await prisma.country.upsert({
    where: { code: 'GB' },
    update: { name: '英国', regionId: regionEurope.id },
    create: { code: 'GB', name: '英国', regionId: regionEurope.id },
  });

  // ---- 港口 ----
  const portShanghai = await prisma.port.upsert({
    where: { code: 'CNSHA' },
    update: {
      name: '上海港',
      nameEn: 'Shanghai Port',
      countryId: countryChina.id,
      city: '上海',
      isCommon: true,
      status: 'NORMAL',
    },
    create: {
      code: 'CNSHA',
      name: '上海港',
      nameEn: 'Shanghai Port',
      countryId: countryChina.id,
      city: '上海',
      isCommon: true,
      status: 'NORMAL',
    },
  });

  const portShenzhen = await prisma.port.upsert({
    where: { code: 'CNSZX' },
    update: {
      name: '深圳港',
      nameEn: 'Shenzhen Port',
      countryId: countryChina.id,
      city: '深圳',
      isCommon: true,
      status: 'NORMAL',
    },
    create: {
      code: 'CNSZX',
      name: '深圳港',
      nameEn: 'Shenzhen Port',
      countryId: countryChina.id,
      city: '深圳',
      isCommon: true,
      status: 'NORMAL',
    },
  });

  const portNingbo = await prisma.port.upsert({
    where: { code: 'CNNGB' },
    update: {
      name: '宁波港',
      nameEn: 'Ningbo Port',
      countryId: countryChina.id,
      city: '宁波',
      isCommon: true,
      status: 'NORMAL',
    },
    create: {
      code: 'CNNGB',
      name: '宁波港',
      nameEn: 'Ningbo Port',
      countryId: countryChina.id,
      city: '宁波',
      isCommon: true,
      status: 'NORMAL',
    },
  });

  const portLosAngeles = await prisma.port.upsert({
    where: { code: 'USLAX' },
    update: {
      name: '洛杉矶港',
      nameEn: 'Los Angeles Port',
      countryId: countryUSA.id,
      city: 'Los Angeles',
      isCommon: true,
      status: 'NORMAL',
    },
    create: {
      code: 'USLAX',
      name: '洛杉矶港',
      nameEn: 'Los Angeles Port',
      countryId: countryUSA.id,
      city: 'Los Angeles',
      isCommon: true,
      status: 'NORMAL',
    },
  });

  const portHamburg = await prisma.port.upsert({
    where: { code: 'DEHAM' },
    update: {
      name: '汉堡港',
      nameEn: 'Hamburg Port',
      countryId: countryGermany.id,
      city: 'Hamburg',
      isCommon: false,
      status: 'NORMAL',
    },
    create: {
      code: 'DEHAM',
      name: '汉堡港',
      nameEn: 'Hamburg Port',
      countryId: countryGermany.id,
      city: 'Hamburg',
      isCommon: false,
      status: 'NORMAL',
    },
  });

  // ---- 子公司 ----
  const mainCompany = await prisma.company.upsert({
    where: { id: 'company-main-001' },
    update: {
      name: '示例进出口贸易有限公司',
      nameEn: 'Sample Import & Export Trading Co., Ltd.',
      abbreviation: '示例贸易',
      unitAbbreviation: 'SIET',
      nature: 'EXPORT_COMPANY',
      taxNumber: '91310000MA1234567X',
      customsCode: '3100123456',
      legalPerson: '张三',
      phone: '021-12345678',
      fax: '021-12345679',
      address: '上海市浦东新区世纪大道1000号',
      addressEn: '1000 Century Avenue, Pudong New Area, Shanghai, China',
      adminName: '李四',
      adminEmail: 'lisi@example.com',
      adminMobile: '13800138000',
      businessLicenseNumber: '91310000MA1234567X',
      isEnabled: true,
    },
    create: {
      id: 'company-main-001',
      name: '示例进出口贸易有限公司',
      nameEn: 'Sample Import & Export Trading Co., Ltd.',
      abbreviation: '示例贸易',
      unitAbbreviation: 'SIET',
      nature: 'EXPORT_COMPANY',
      taxNumber: '91310000MA1234567X',
      customsCode: '3100123456',
      legalPerson: '张三',
      phone: '021-12345678',
      fax: '021-12345679',
      address: '上海市浦东新区世纪大道1000号',
      addressEn: '1000 Century Avenue, Pudong New Area, Shanghai, China',
      adminName: '李四',
      adminEmail: 'lisi@example.com',
      adminMobile: '13800138000',
      businessLicenseNumber: '91310000MA1234567X',
      isEnabled: true,
    },
  });

  const factoryCompany = await prisma.company.upsert({
    where: { id: 'company-factory-001' },
    update: {
      name: '示例制造工厂有限公司',
      nameEn: 'Sample Manufacturing Factory Co., Ltd.',
      abbreviation: '示例工厂',
      unitAbbreviation: 'SMF',
      nature: 'FACTORY',
      taxNumber: '91320000MA7654321Y',
      customsCode: '3200654321',
      legalPerson: '王五',
      phone: '0512-87654321',
      fax: '0512-87654322',
      address: '江苏省苏州市工业园区工业路500号',
      addressEn: '500 Industrial Road, Industrial Park, Suzhou, Jiangsu, China',
      adminName: '赵六',
      adminEmail: 'zhaoliu@example.com',
      adminMobile: '13900139000',
      businessLicenseNumber: '91320000MA7654321Y',
      isEnabled: true,
    },
    create: {
      id: 'company-factory-001',
      name: '示例制造工厂有限公司',
      nameEn: 'Sample Manufacturing Factory Co., Ltd.',
      abbreviation: '示例工厂',
      unitAbbreviation: 'SMF',
      nature: 'FACTORY',
      taxNumber: '91320000MA7654321Y',
      customsCode: '3200654321',
      legalPerson: '王五',
      phone: '0512-87654321',
      fax: '0512-87654322',
      address: '江苏省苏州市工业园区工业路500号',
      addressEn: '500 Industrial Road, Industrial Park, Suzhou, Jiangsu, China',
      adminName: '赵六',
      adminEmail: 'zhaoliu@example.com',
      adminMobile: '13900139000',
      businessLicenseNumber: '91320000MA7654321Y',
      isEnabled: true,
    },
  });

  // ---- 子公司银行账号 ----
  await prisma.companyBankAccount.upsert({
    where: { id: 'bank-account-001' },
    update: {
      companyId: mainCompany.id,
      companyNameCn: '示例进出口贸易有限公司',
      companyNameEn: 'Sample Import & Export Trading Co., Ltd.',
      bankNameCn: '中国工商银行上海分行',
      bankNameEn: 'Industrial and Commercial Bank of China Shanghai Branch',
      bankAddress: '上海市黄浦区南京东路100号',
      bankAddressEn: '100 East Nanjing Road, Huangpu District, Shanghai, China',
      accountNumber: '1234567890123456789',
      swiftCode: 'ICBKCNBJSHA',
      isDefault: true,
    },
    create: {
      id: 'bank-account-001',
      companyId: mainCompany.id,
      companyNameCn: '示例进出口贸易有限公司',
      companyNameEn: 'Sample Import & Export Trading Co., Ltd.',
      bankNameCn: '中国工商银行上海分行',
      bankNameEn: 'Industrial and Commercial Bank of China Shanghai Branch',
      bankAddress: '上海市黄浦区南京东路100号',
      bankAddressEn: '100 East Nanjing Road, Huangpu District, Shanghai, China',
      accountNumber: '1234567890123456789',
      swiftCode: 'ICBKCNBJSHA',
      isDefault: true,
    },
  });

  await prisma.companyBankAccount.upsert({
    where: { id: 'bank-account-002' },
    update: {
      companyId: mainCompany.id,
      companyNameCn: '示例进出口贸易有限公司',
      companyNameEn: 'Sample Import & Export Trading Co., Ltd.',
      bankNameCn: '中国银行上海分行',
      bankNameEn: 'Bank of China Shanghai Branch',
      bankAddress: '上海市浦东新区陆家嘴环路1233号',
      bankAddressEn: '1233 Lujiazui Ring Road, Pudong New Area, Shanghai, China',
      accountNumber: '9876543210987654321',
      swiftCode: 'BKCHCNBJSHA',
      isDefault: false,
    },
    create: {
      id: 'bank-account-002',
      companyId: mainCompany.id,
      companyNameCn: '示例进出口贸易有限公司',
      companyNameEn: 'Sample Import & Export Trading Co., Ltd.',
      bankNameCn: '中国银行上海分行',
      bankNameEn: 'Bank of China Shanghai Branch',
      bankAddress: '上海市浦东新区陆家嘴环路1233号',
      bankAddressEn: '1233 Lujiazui Ring Road, Pudong New Area, Shanghai, China',
      accountNumber: '9876543210987654321',
      swiftCode: 'BKCHCNBJSHA',
      isDefault: false,
    },
  });

  await prisma.companyBankAccount.upsert({
    where: { id: 'bank-account-003' },
    update: {
      companyId: factoryCompany.id,
      companyNameCn: '示例制造工厂有限公司',
      companyNameEn: 'Sample Manufacturing Factory Co., Ltd.',
      bankNameCn: '中国建设银行苏州分行',
      bankNameEn: 'China Construction Bank Suzhou Branch',
      bankAddress: '江苏省苏州市工业园区星湖街328号',
      bankAddressEn: '328 Xinghu Street, Industrial Park, Suzhou, Jiangsu, China',
      accountNumber: '5555666677778888999',
      swiftCode: 'PCBCCNBJSUZ',
      isDefault: true,
    },
    create: {
      id: 'bank-account-003',
      companyId: factoryCompany.id,
      companyNameCn: '示例制造工厂有限公司',
      companyNameEn: 'Sample Manufacturing Factory Co., Ltd.',
      bankNameCn: '中国建设银行苏州分行',
      bankNameEn: 'China Construction Bank Suzhou Branch',
      bankAddress: '江苏省苏州市工业园区星湖街328号',
      bankAddressEn: '328 Xinghu Street, Industrial Park, Suzhou, Jiangsu, China',
      accountNumber: '5555666677778888999',
      swiftCode: 'PCBCCNBJSUZ',
      isDefault: true,
    },
  });

  console.log(`Regions: ${regionAsia.code}, ${regionNorthAmerica.code}, ${regionEurope.code}`);
  console.log(`Countries: ${countryChina.code}, ${countryUSA.code}, ${countryGermany.code}, ${countryJapan.code}, ${countryUK.code}`);
  console.log(`Ports: ${portShanghai.code}, ${portShenzhen.code}, ${portNingbo.code}, ${portLosAngeles.code}, ${portHamburg.code}`);
  console.log(`Companies: ${mainCompany.name}, ${factoryCompany.name}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
