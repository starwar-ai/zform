import { PrismaClient, ProductType, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建种子数据...');

  // 创建示例部门
  const department = await prisma.department.create({
    data: {
      code: 'DEPT001',
      name: '研发部',
    },
  });
  console.log('✅ 部门创建成功:', department.name);

  // 创建示例品牌
  const brand = await prisma.brand.create({
    data: {
      code: 'BRAND001',
      name: '自主品牌A',
      isSelfOwned: true,
    },
  });
  console.log('✅ 品牌创建成功:', brand.name);

  // 创建产品分类
  const category = await prisma.productCategory.create({
    data: {
      code: 'CAT001',
      name: '电子产品',
      level: 1,
    },
  });
  console.log('✅ 产品分类创建成功:', category.name);

  // 创建海关编码
  const hsCode = await prisma.hsCode.create({
    data: {
      code: 'HS001',
      name: '塑料制品',
      hsCode: '3926909090',
    },
  });
  console.log('✅ 海关编码创建成功:', hsCode.name);

  // 创建包装方式
  const packageMethod = await prisma.packageMethod.create({
    data: {
      code: 'PKG001',
      name: '标准纸箱',
      nameEn: 'Standard Carton',
    },
  });
  console.log('✅ 包装方式创建成功:', packageMethod.name);

  // 创建标准产品
  const standardProduct = await prisma.product.create({
    data: {
      code: 'STD001',
      name: '标准手机壳',
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
      description: '标准手机保护壳，适用于多种型号',
    },
  });
  console.log('✅ 标准产品创建成功:', standardProduct.name);

  // 创建客户产品（基于标准产品）
  const customerProduct = await prisma.product.create({
    data: {
      code: 'CUST001',
      name: '定制手机壳-客户A',
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
      description: '根据客户A需求定制的手机壳',
    },
  });
  console.log('✅ 客户产品创建成功:', customerProduct.name);

  // 创建辅料产品
  const accessoryProduct = await prisma.product.create({
    data: {
      code: 'ACC001',
      name: '包装袋',
      productType: ProductType.STANDARD,
      status: ProductStatus.ACTIVE,
      material: 'PE',
      unit: 'PCS',
      isCommonAccessory: true,
      categoryId: category.id,
      salePrice: 0.15,
      description: '通用包装袋',
    },
  });
  console.log('✅ 辅料产品创建成功:', accessoryProduct.name);

  // 添加产品辅料关系
  const productAccessory = await prisma.productAccessory.create({
    data: {
      productId: standardProduct.id,
      accessoryId: accessoryProduct.id,
      productRatio: 1,
      accessoryRatio: 1,
      description: '每个产品配一个包装袋',
    },
  });
  console.log('✅ 产品辅料关系创建成功');

  // 创建子产品用于 BOM
  const componentProduct = await prisma.product.create({
    data: {
      code: 'COMP001',
      name: '手机壳底座',
      productType: ProductType.STANDARD,
      status: ProductStatus.ACTIVE,
      material: 'PC',
      unit: 'PCS',
      categoryId: category.id,
      salePrice: 5.00,
      description: '手机壳组件-底座',
    },
  });
  console.log('✅ 组件产品创建成功:', componentProduct.name);

  // 添加 BOM 关系
  const productBom = await prisma.productBom.create({
    data: {
      parentProductId: standardProduct.id,
      childProductId: componentProduct.id,
      quantity: 1,
      productType: 'COMPONENT',
    },
  });
  console.log('✅ BOM 关系创建成功');

  console.log('\n🎉 种子数据创建完成！');
  console.log('\n创建的数据摘要:');
  console.log(`- 部门: ${department.name} (${department.code})`);
  console.log(`- 品牌: ${brand.name} (${brand.code})`);
  console.log(`- 分类: ${category.name} (${category.code})`);
  console.log(`- 海关编码: ${hsCode.name} (${hsCode.hsCode})`);
  console.log(`- 包装方式: ${packageMethod.name} (${packageMethod.code})`);
  console.log(`- 标准产品: ${standardProduct.name} (${standardProduct.code})`);
  console.log(`- 客户产品: ${customerProduct.name} (${customerProduct.code})`);
  console.log(`- 辅料产品: ${accessoryProduct.name} (${accessoryProduct.code})`);
  console.log(`- 组件产品: ${componentProduct.name} (${componentProduct.code})`);
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
