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

  // ==================== 系统管理种子数据 ====================
  console.log('Seeding system management data...');

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
    update: { name: '管理员', password: adminPassword, status: 'active' },
    create: {
      username: 'admin',
      password: adminPassword,
      name: '管理员',
      email: 'admin@zform.com',
      department: '技术部',
      status: 'active',
    },
  });

  const demoUser = await prisma.sysUser.upsert({
    where: { username: 'demo' },
    update: { name: '演示用户', password: demoPassword, status: 'active' },
    create: {
      username: 'demo',
      password: demoPassword,
      name: '演示用户',
      email: 'demo@zform.com',
      department: '业务部',
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
  const docMenu = await prisma.sysMenu.create({
    data: {
      title: '单据管理',
      icon: 'FileText',
      path: null,
      parentId: null,
      orderNum: 1,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 单据管理子菜单
  const salesContractMenu = await prisma.sysMenu.create({
    data: {
      title: '销售合同',
      icon: 'ClipboardList',
      path: '/type-list/sales_contract',
      parentId: docMenu.id,
      orderNum: 1,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const purchasePlanMenu = await prisma.sysMenu.create({
    data: {
      title: '采购计划',
      icon: 'ShoppingCart',
      path: '/type-list/purchase_plan',
      parentId: docMenu.id,
      orderNum: 2,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const stdProductMenu = await prisma.sysMenu.create({
    data: {
      title: '标准产品',
      icon: 'Package',
      path: '/type-list/standard_product',
      parentId: docMenu.id,
      orderNum: 3,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const custProductMenu = await prisma.sysMenu.create({
    data: {
      title: '客户产品',
      icon: 'Package',
      path: '/type-list/customer_product',
      parentId: docMenu.id,
      orderNum: 4,
      menuType: 'menu',
      status: 'visible',
    },
  });

  const selfProductMenu = await prisma.sysMenu.create({
    data: {
      title: '自营产品',
      icon: 'Package',
      path: '/type-list/self_owned_product',
      parentId: docMenu.id,
      orderNum: 5,
      menuType: 'menu',
      status: 'visible',
    },
  });

  // 采购合同菜单
  const purchaseContractMenu = await prisma.sysMenu.create({
    data: {
      title: '采购合同',
      icon: 'ClipboardList',
      path: '/type-list/purchase_contract',
      parentId: docMenu.id,
      orderNum: 6,
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
  const stdProductBtnIds = await createDocPermButtons(stdProductMenu.id, 'standard_product', [
    ...basicDocActions,
    { perm: 'push_down', title: '下推' },
  ]);
  const custProductBtnIds = await createDocPermButtons(custProductMenu.id, 'customer_product', basicDocActions);
  const selfProductBtnIds = await createDocPermButtons(selfProductMenu.id, 'self_owned_product', basicDocActions);

  // 所有按钮权限 ID 汇总
  const allBtnIds = [
    ...salesContractBtnIds,
    ...purchasePlanBtnIds,
    ...purchaseContractBtnIds,
    ...stdProductBtnIds,
    ...custProductBtnIds,
    ...selfProductBtnIds,
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

  // -- 角色-菜单关联 --
  // 管理员角色：拥有全部菜单 + 全部按钮权限
  const allMenuIds = [
    docMenu.id,
    salesContractMenu.id,
    purchasePlanMenu.id,
    stdProductMenu.id,
    custProductMenu.id,
    selfProductMenu.id,
    purchaseContractMenu.id,
    sysMenu.id,
    userMgmtMenu.id,
    roleMgmtMenu.id,
    menuMgmtMenu.id,
    ...allBtnIds,
  ];

  await prisma.sysRoleMenu.createMany({
    data: allMenuIds.map((menuId) => ({
      roleId: adminRole.id,
      menuId,
    })),
  });

  // 业务经理角色：单据管理菜单 + 全部按钮权限（含审批）
  const managerMenuIds = [
    docMenu.id,
    salesContractMenu.id,
    purchasePlanMenu.id,
    stdProductMenu.id,
    custProductMenu.id,
    selfProductMenu.id,
    purchaseContractMenu.id,
    ...allBtnIds,
  ];

  await prisma.sysRoleMenu.createMany({
    data: managerMenuIds.map((menuId) => ({
      roleId: managerRole.id,
      menuId,
    })),
  });

  // 普通用户角色：单据管理菜单 + 基础操作按钮权限 (新建/删除/提交，不含审批/关闭/作废/下推)
  // 从每种类型的按钮中，只取 create/delete/submit (前3个)
  const userBtnIds = [
    ...salesContractBtnIds.slice(0, 3),
    ...purchasePlanBtnIds.slice(0, 3),
    ...purchaseContractBtnIds.slice(0, 3),
    ...stdProductBtnIds.slice(0, 3),
    ...custProductBtnIds.slice(0, 3),
    ...selfProductBtnIds.slice(0, 3),
  ];

  const userMenuIds = [
    docMenu.id,
    salesContractMenu.id,
    purchasePlanMenu.id,
    stdProductMenu.id,
    custProductMenu.id,
    selfProductMenu.id,
    purchaseContractMenu.id,
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
  console.log(`Roles: ${adminRole.code}, ${managerRole.code}, ${userRole.code}`);
  console.log(`Users: admin (password: admin123), demo (password: 123456)`);
  console.log(`Menus: ${allMenuIds.length} menus (incl. ${allBtnIds.length} button permissions)`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
