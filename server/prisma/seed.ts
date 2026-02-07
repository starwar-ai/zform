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
} from '@prisma/client';

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
    update: { name: 'Plastic Products', hsCode: '3926909090' },
    create: { code: 'HS001', name: 'Plastic Products', hsCode: '3926909090' },
  });

  const packageMethod = await prisma.packageMethod.upsert({
    where: { code: 'PKG001' },
    update: { name: 'Standard Carton', nameEn: 'Standard Carton' },
    create: { code: 'PKG001', name: 'Standard Carton', nameEn: 'Standard Carton' },
  });

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
      supplierType: SupplierType.TRADER,
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
      supplierType: SupplierType.TRADER,
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

  console.log('Seed completed.');
  console.log(`Customers: ${customerA.code}, ${customerB.code}`);
  console.log(`Suppliers: ${supplierA.code}, ${supplierB.code}`);
  console.log(`Products: ${standardProduct.code}, ${customerProduct.code}`);
  console.log(`Sales contract: ${salesContract.code}`);
  console.log(`Approval rules: ${salesContractApprovalRule.code}, ${purchasePlanApprovalRule.code}, ${purchaseContractApprovalRule.code}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
