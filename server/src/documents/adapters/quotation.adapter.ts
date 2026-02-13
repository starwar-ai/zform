/**
 * 报价单 Adapter
 * 
 * 从 zexport 的 QuotationServiceImpl.java 提取的业务逻辑:
 * - 柜型数量自动计算和验证
 * - 审批流程集成
 * - 货币转换
 * - 状态流转管理
 */

import type { DocumentTypeAdapter } from '../types';
import { ApprovalService } from '../../services/approval.service';
import { codeGeneratorApi } from '../../services/code-generator.service';
import { calculateContainers, decimalEqual } from '../../utils/business-utils';

const approvalService = new ApprovalService();

// ============================================================
// 辅助函数：柜型数量计算
// ============================================================

/**
 * 验证明细柜型数量（使用共享的 calculateContainers 函数）
 * 
 * 规则:
 * 1. 箱数必须大于0
 * 2. 外箱体积必须大于0
 * 3. 计算的柜型数量必须与输入的一致
 * 
 * @param items - 报价单明细数组
 * @throws 如果验证失败，抛出详细错误信息
 */
function validateCabinetNumbers(items: any[]): void {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('报价单明细不能为空');
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const lineNumber = item.lineNumber || (i + 1);
    
    try {
      // 检查箱数
      if (!item.boxCount || item.boxCount <= 0) {
        throw new Error('箱数不能为空或小于等于0');
      }

      // 检查外箱体积
      if (!item.outerBoxVolume || item.outerBoxVolume <= 0) {
        throw new Error('外箱体积不能为空');
      }

      // 计算总体积
      const totalVolume = Number(item.outerBoxVolume) * item.boxCount;

      // 计算柜型数量
      const calculated = calculateContainers(totalVolume);

      // 验证散货体积
      if (item.bulkCargo !== undefined && item.bulkCargo !== null) {
        if (!decimalEqual(calculated.bulkCargo, Number(item.bulkCargo))) {
          throw new Error(`散货体积应为 ${calculated.bulkCargo} CBM`);
        }
      }

      // 验证20尺柜
      if (item.container20ft !== undefined && item.container20ft !== null) {
        if (!decimalEqual(calculated.container20ft, Number(item.container20ft))) {
          throw new Error(`20尺柜数量应为 ${calculated.container20ft} 个`);
        }
      }

      // 验证40尺柜
      if (item.container40ft !== undefined && item.container40ft !== null) {
        if (!decimalEqual(calculated.container40ft, Number(item.container40ft))) {
          throw new Error(`40尺柜数量应为 ${calculated.container40ft} 个`);
        }
      }

      // 验证40尺高柜
      if (item.container40hq !== undefined && item.container40hq !== null) {
        if (!decimalEqual(calculated.container40hq, Number(item.container40hq))) {
          throw new Error(`40尺高柜数量应为 ${calculated.container40hq} 个`);
        }
      }
    } catch (error: any) {
      // 为错误消息添加行号信息
      throw new Error(`第 ${lineNumber} 行：${error.message}`);
    }
  }
}

// ============================================================
// Adapter 定义
// ============================================================

export const quotationAdapter: DocumentTypeAdapter = {
  typeId: 'quotation',
  typeName: '报价单',

  // ---- Prisma 映射 ----
  prismaModel: 'quotation',
  prismaItemModel: 'quotationItem',
  parentForeignKey: 'quotationId',
  itemRelationName: 'items',

  // ---- 基础筛选条件 ----
  baseWhere: {},

  // ---- 搜索 ----
  searchFields: [
    'code',
    'customerCode',
    'customerName',
    'customerContactName',
  ],

  // ---- Includes ----
  listIncludes: {
    items: {
      where: { deletedAt: null },
      orderBy: { lineNumber: 'asc' },
      take: 5,
    },
  },
  detailIncludes: {
    items: {
      where: { deletedAt: null },
      orderBy: { lineNumber: 'asc' },
    },
  },

  // ---- 默认排序 ----
  defaultOrderBy: { createdAt: 'desc' },

  // ---- 字段映射 (前端 columnId → Prisma 字段名) ----
  columnToPrismaField: {
    _docNumber: 'code',
    _status: 'status',
    _createdAt: 'createdAt',
    customerId: 'customerId',
    customerCode: 'customerCode',
    customerName: 'customerName',
    isNewCustomer: 'isNewCustomer',
    customerContactName: 'customerContactName',
    countryName: 'countryName',
    currency: 'currency',
    salesPerson: 'salesPerson',
    validUntil: 'validUntil',
    approvalStatus: 'approvalStatus',
    printStatus: 'printStatus',
  },

  // ---- 聚合 ----
  aggregateFields: [],

  // ---- 扁平化 ----
  flattenRow(row: any) {
    return {
      _id: row.id,
      _docNumber: row.code,
      _status: row.status,
      _createdAt: row.createdAt,
      // 主数据字段
      customerId: row.customerId,
      customerCode: row.customerCode,
      customerName: row.customerName,
      isNewCustomer: row.isNewCustomer,
      customerContactName: row.customerContactName,
      countryId: row.countryId,
      countryName: row.countryName,
      internalCompanyId: row.internalCompanyId,
      internalCompanyName: row.internalCompanyName,
      departurePortId: row.departurePortId,
      departurePortName: row.departurePortName,
      currency: row.currency,
      priceTerms: row.priceTerms,
      validUntil: row.validUntil,
      salesPerson: row.salesPerson,
      approvalStatus: row.approvalStatus,
      printStatus: row.printStatus,
      processInstanceId: row.processInstanceId,
    };
  },

  flattenDetailRow(masterRow: any, detailRow: any) {
    return {
      _id: masterRow.id,
      _docNumber: masterRow.code,
      _status: masterRow.status,
      _createdAt: masterRow.createdAt,
      _detailRowId: detailRow.id,
      // 主数据
      customerCode: masterRow.customerCode,
      customerName: masterRow.customerName,
      currency: masterRow.currency,
      // 明细数据
      lineNumber: detailRow.lineNumber,
      productCode: detailRow.productCode,
      productNameCn: detailRow.productNameCn,
      productNameEn: detailRow.productNameEn,
      spec: detailRow.spec,
      productSpec: detailRow.productSpec,
      productImage: detailRow.productImage,
      baseProductCode: detailRow.baseProductCode,
      customerProductNo: detailRow.customerProductNo,
      isSelfOwnedProduct: detailRow.isSelfOwnedProduct,
      isCustomerProduct: detailRow.isCustomerProduct,
      isSeparateContainer: detailRow.isSeparateContainer,
      unitPrice: detailRow.unitPrice ? Number(detailRow.unitPrice) : 0,
      taxUnitPrice: detailRow.taxUnitPrice ? Number(detailRow.taxUnitPrice) : 0,
      minOrderQuantity: detailRow.minOrderQuantity ? Number(detailRow.minOrderQuantity) : 0,
      commissionRate: detailRow.commissionRate ? Number(detailRow.commissionRate) : 0,
      supplierId: detailRow.supplierId,
      supplierCode: detailRow.supplierCode,
      supplierName: detailRow.supplierName,
      bulkCargo: detailRow.bulkCargo ? Number(detailRow.bulkCargo) : 0,
      container20ft: detailRow.container20ft ? Number(detailRow.container20ft) : 0,
      container40ft: detailRow.container40ft ? Number(detailRow.container40ft) : 0,
      container40hq: detailRow.container40hq ? Number(detailRow.container40hq) : 0,
      packageMethod: detailRow.packageMethod,
      innerBoxQty: detailRow.innerBoxQty ? Number(detailRow.innerBoxQty) : 0,
      outerBoxQty: detailRow.outerBoxQty ? Number(detailRow.outerBoxQty) : 0,
      boxCount: detailRow.boxCount,
      outerBoxUnit: detailRow.outerBoxUnit,
      outerBoxLength: detailRow.outerBoxLength ? Number(detailRow.outerBoxLength) : 0,
      outerBoxWidth: detailRow.outerBoxWidth ? Number(detailRow.outerBoxWidth) : 0,
      outerBoxHeight: detailRow.outerBoxHeight ? Number(detailRow.outerBoxHeight) : 0,
      outerBoxVolume: detailRow.outerBoxVolume ? Number(detailRow.outerBoxVolume) : 0,
      outerBoxNetWeight: detailRow.outerBoxNetWeight ? Number(detailRow.outerBoxNetWeight) : 0,
      outerBoxGrossWeight: detailRow.outerBoxGrossWeight ? Number(detailRow.outerBoxGrossWeight) : 0,
      productDescription: detailRow.productDescription,
      productDescriptionEn: detailRow.productDescriptionEn,
      hsCode: detailRow.hsCode,
      deliveryDate: detailRow.deliveryDate,
    };
  },

  // ============================================================
  // 自定义生命周期钩子
  // ============================================================

  /**
   * 创建报价单前的处理
   * 1. 生成报价单号
   * 2. 验证柜型数量
   * 3. 设置初始状态
   */
  async onCreate(data: any, userId: string, prisma: any) {
    // 生成报价单号
    const code = await codeGeneratorApi.generateCode('quotation', 'QT');

    // 验证明细柜型数量
    if (data.items && Array.isArray(data.items)) {
      validateCabinetNumbers(data.items);
    }

    // 创建报价单
    const quotation = await prisma.quotation.create({
      data: {
        ...data,
        code,
        status: 'DRAFT',
        approvalStatus: 'PENDING',
        printStatus: 'NOT_PRINTED',
        createdBy: userId,
        updatedBy: userId,
        items: data.items
          ? {
              create: data.items.map((item: any, index: number) => ({
                ...item,
                lineNumber: item.lineNumber || index + 1,
                createdBy: userId,
                updatedBy: userId,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    // 如果需要提交审批
    if (data.submitFlag) {
      await approvalService.submit({
        docType: 'quotation',
        docId: quotation.id,
        docNumber: quotation.code,
        user: {
          userId,
          userName: data.userName || 'System',
          roleIds: data.roleIds || [],
        },
      });
    }

    return quotation;
  },

  /**
   * 更新报价单前的处理
   * 1. 验证柜型数量
   * 2. 更新明细（删除旧的，创建新的）
   */
  async onUpdate(id: string, data: any, userId: string, prisma: any) {
    // 验证报价单存在
    const existing = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('报价单不存在');
    }

    // 验证明细柜型数量
    if (data.items && Array.isArray(data.items)) {
      validateCabinetNumbers(data.items);
    }

    // 软删除旧明细
    if (data.items) {
      await prisma.quotationItem.updateMany({
        where: { quotationId: id },
        data: { deletedAt: new Date() },
      });
    }

    // 更新报价单
    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        ...data,
        items: data.items
          ? {
              create: data.items.map((item: any, index: number) => ({
                ...item,
                lineNumber: item.lineNumber || index + 1,
                createdBy: userId,
                updatedBy: userId,
              })),
            }
          : undefined,
        updatedBy: userId,
      },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    // 如果需要提交审批
    if (data.submitFlag) {
      await approvalService.submit({
        docType: 'quotation',
        docId: quotation.id,
        docNumber: quotation.code,
        user: {
          userId,
          userName: data.userName || 'System',
          roleIds: data.roleIds || [],
        },
      });
    }

    return quotation;
  },

  // ============================================================
  // 自定义 Actions
  // ============================================================
  actions: {
    /**
     * 提交审批
     */
    async submit({ id, body, userId, prisma }) {
      const doc = await prisma.quotation.findUnique({
        where: { id },
      });

      if (!doc) {
        throw new Error('报价单不存在');
      }

      const result = await approvalService.submit({
        docType: 'quotation',
        docId: id,
        docNumber: doc.code,
        user: {
          userId,
          userName: body.userName || 'System',
          roleIds: body.roleIds || [],
        },
      });

      return {
        data: result.instance,
        message: result.message,
      };
    },

    /**
     * 撤回审批
     */
    async withdraw({ id, body, userId, prisma }) {
      // 查找审批实例
      const instance = await prisma.approvalInstance.findFirst({
        where: {
          docType: 'quotation',
          docId: id,
          status: 'in_progress',
        },
      });

      if (!instance) {
        throw new Error('未找到进行中的审批实例');
      }

      const result = await approvalService.withdraw({
        instanceId: instance.id,
        user: {
          userId,
          userName: body.userName || 'System',
          roleIds: body.roleIds || [],
        },
      });

      return {
        data: result.instance,
        message: result.message,
      };
    },

    /**
     * 结案
     */
    async finish({ id, userId, prisma }) {
      const doc = await prisma.quotation.update({
        where: { id },
        data: {
          status: 'CLOSED',
          updatedBy: userId,
        },
      });

      return { data: doc, message: '报价单已结案' };
    },

    /**
     * 接受报价
     */
    async accept({ id, userId, prisma }) {
      const doc = await prisma.quotation.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          updatedBy: userId,
        },
      });

      return { data: doc, message: '报价单已接受' };
    },

    /**
     * 标记已打印
     */
    async print({ id, userId, prisma }) {
      const doc = await prisma.quotation.update({
        where: { id },
        data: {
          printStatus: 'PRINTED',
          updatedBy: userId,
        },
      });

      return { data: doc, message: '已标记为已打印' };
    },

    /**
     * 转销售合同
     */
    async toSalesContract({ id, userId, prisma }) {
      // 验证报价单状态
      const quotation = await prisma.quotation.findUnique({
        where: { id },
        include: {
          items: {
            where: { deletedAt: null },
          },
        },
      });

      if (!quotation) {
        throw new Error('报价单不存在');
      }

      if (quotation.status !== 'APPROVED' && quotation.status !== 'ACCEPTED') {
        throw new Error('只有已审批或已接受的报价单才能转销售合同');
      }

      // 标记为已接受状态
      const doc = await prisma.quotation.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          updatedBy: userId,
        },
      });

      return { data: doc, message: '已标记为已接受，可以转销售合同' };
    },

    /**
     * 计算柜型数量（工具方法）
     * 根据外箱体积和箱数计算柜型数量
     */
    async calculateContainers({ body }) {
      const { outerBoxVolume, boxCount } = body;

      if (!outerBoxVolume || outerBoxVolume <= 0) {
        throw new Error('外箱体积必须大于0');
      }

      if (!boxCount || boxCount <= 0) {
        throw new Error('箱数必须大于0');
      }

      const totalVolume = Number(outerBoxVolume) * Number(boxCount);
      const result = calculateContainers(totalVolume);

      return {
        data: result,
        message: '柜型数量计算成功',
      };
    },
  },
};
